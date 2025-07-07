from flask import Blueprint, request, render_template, redirect, jsonify
from flask_login import login_required, current_user
from app.models import (
    db,
    Group,
    GroupImage,
    Membership,
    Venue,
    Event,
    EventImage,
    Attendance,
)
from app.forms import (
    GroupForm,
    GroupImageForm,
    EventForm,
    VenueForm,
    EditGroupForm,
    EditEventForm,
)
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import func, and_, text

group_routes = Blueprint("groups", __name__)


# ! GROUPS
@group_routes.route("")
def all_groups():
    """
    Query for all groups with pagination and minimal data loading
    """
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 50)

    # Get search and filter parameters
    search = request.args.get("search", "").strip()
    group_type = request.args.get("type", "").strip()
    city = request.args.get("city", "").strip()
    state = request.args.get("state", "").strip()

    # Build query with loading
    groups_query = db.session.query(Group).options(
        joinedload(Group.organizer).load_only(
            "id", "username", "first_name", "last_name", "profile_image_url"
        ),
        # Don't load full relationships, just get counts
    )

    # Apply filters
    if search:
        groups_query = groups_query.filter(
            db.or_(Group.name.ilike(f"%{search}%"), Group.about.ilike(f"%{search}%"))
        )

    if group_type:
        groups_query = groups_query.filter(Group.type == group_type)

    if city:
        groups_query = groups_query.filter(Group.city.ilike(f"%{city}%"))

    if state:
        groups_query = groups_query.filter(Group.state.ilike(f"%{state}%"))

    # Order by created date for consistency
    groups_query = groups_query.order_by(Group.created_at.desc())

    # Paginate
    groups = groups_query.paginate(page=page, per_page=per_page, error_out=False)

    if not groups.items:
        return jsonify(
            {
                "groups": [],
                "pagination": {
                    "page": page,
                    "pages": 0,
                    "per_page": per_page,
                    "total": 0,
                    "has_next": False,
                    "has_prev": False,
                },
            }
        )

    # Get member counts efficiently in batch
    group_ids = [group.id for group in groups.items]
    member_counts = dict(
        db.session.query(Membership.group_id, func.count(Membership.id))
        .filter(Membership.group_id.in_(group_ids))
        .group_by(Membership.group_id)
        .all()
    )

    # Get event counts efficiently in batch
    event_counts = dict(
        db.session.query(Event.group_id, func.count(Event.id))
        .filter(Event.group_id.in_(group_ids))
        .group_by(Event.group_id)
        .all()
    )

    # Build response with counts
    group_data = []
    for group in groups.items:
        group_dict = {
            "id": group.id,
            "name": group.name,
            "about": group.about,
            "type": group.type,
            "city": group.city,
            "state": group.state,
            "image": group.image,
            "organizerId": group.organizer_id,
            "organizer": (
                {
                    "id": group.organizer.id,
                    "username": group.organizer.username,
                    "firstName": group.organizer.first_name,
                    "lastName": group.organizer.last_name,
                    "profileImage": group.organizer.profile_image_url,
                }
                if group.organizer
                else None
            ),
            "numMembers": member_counts.get(group.id, 0),
            "numEvents": event_counts.get(group.id, 0),
            "createdAt": group.created_at.isoformat(),
        }
        group_data.append(group_dict)

    return jsonify(
        {
            "groups": group_data,
            "pagination": {
                "page": page,
                "pages": groups.pages,
                "per_page": per_page,
                "total": groups.total,
                "has_next": groups.has_next,
                "has_prev": groups.has_prev,
            },
        }
    )


@group_routes.route("/<int:groupId>")
def group(groupId):
    """
    Query for group by id with loading
    """
    group = (
        db.session.query(Group)
        .options(
            joinedload(Group.organizer).load_only(
                "id", "username", "first_name", "last_name", "profile_image_url"
            ),
            selectinload(Group.events).options(
                selectinload(Event.attendances)
                .joinedload(Attendance.user)
                .load_only("id", "username", "profile_image_url")
            ),
            selectinload(Group.venues),
            selectinload(Group.memberships)
            .joinedload(Membership.user)
            .load_only(
                "id", "username", "first_name", "last_name", "profile_image_url"
            ),
            selectinload(Group.group_images),
        )
        .filter(Group.id == groupId)
        .first()
    )

    if not group:
        return jsonify({"errors": {"message": "Group not found"}}), 404

    return jsonify(group.to_dict())


@group_routes.route("/new", methods=["POST"])
@login_required
def create_group():
    """
    Create a new group with automatic membership creation for organizer
    """
    form = GroupForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        image = form.image.data

        if not image:
            return {"message": "An image is required to create a group."}, 400

        try:
            image.filename = get_unique_filename(image.filename)
            upload = upload_file_to_s3(image)
        except Exception as e:
            return {"message": f"Image upload failed: {str(e)}"}, 500

        if "url" not in upload:
            return {
                "message": upload.get(
                    "errors", "Image upload failed. Please try again."
                )
            }, 400

        url = upload["url"]

        try:
            # Create the group
            new_group = Group(
                organizer_id=current_user.id,
                name=form.data["name"],
                about=form.data["about"],
                type=form.data["type"],
                city=form.data["city"],
                state=form.data["state"],
                image=url,
            )

            db.session.add(new_group)
            db.session.flush()  # Get the group ID without committing

            # Automatically create membership for the organizer
            organizer_membership = Membership(
                group_id=new_group.id, user_id=current_user.id
            )
            db.session.add(organizer_membership)

            # Commit both the group and membership
            db.session.commit()

            # Return the created group with proper member count
            return {
                "group": {
                    "id": new_group.id,
                    "name": new_group.name,
                    "about": new_group.about,
                    "type": new_group.type,
                    "city": new_group.city,
                    "state": new_group.state,
                    "image": new_group.image,
                    "organizerId": new_group.organizer_id,
                    "numMembers": 1,  # Organizer is automatically a member
                    "numEvents": 0,
                }
            }, 201

        except Exception as e:
            db.session.rollback()
            return {"message": f"Group creation failed: {str(e)}"}, 500

    return form.errors, 400


@group_routes.route("/<int:groupId>/edit", methods=["POST"])
@login_required
def edit_group(groupId):
    """
    Update group with response
    """
    group_to_edit = Group.query.get(groupId)

    if not group_to_edit:
        return {"errors": {"message": "Group not found"}}, 404

    if current_user.id != group_to_edit.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = EditGroupForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        image = form.image.data

        if image:
            try:
                image.filename = get_unique_filename(image.filename)
                upload = upload_file_to_s3(image)
            except Exception as e:
                return {"message": f"Image upload failed: {str(e)}"}, 500

            if "url" not in upload:
                return {
                    "message": upload.get(
                        "errors", "Image upload failed. Please try again."
                    )
                }, 400

            # Remove the old image from S3
            if group_to_edit.image:
                remove_file_from_s3(group_to_edit.image)
            group_to_edit.image = upload["url"]

        # Update group fields
        group_to_edit.name = form.data["name"] or group_to_edit.name
        group_to_edit.about = form.data["about"] or group_to_edit.about
        group_to_edit.type = form.data["type"] or group_to_edit.type
        group_to_edit.city = form.data["city"] or group_to_edit.city
        group_to_edit.state = form.data["state"] or group_to_edit.state

        db.session.commit()

        # Return minimal updated data
        return {
            "group": {
                "id": group_to_edit.id,
                "name": group_to_edit.name,
                "about": group_to_edit.about,
                "type": group_to_edit.type,
                "city": group_to_edit.city,
                "state": group_to_edit.state,
                "image": group_to_edit.image,
                "organizerId": group_to_edit.organizer_id,
            }
        }, 200

    return form.errors, 400


@group_routes.route("/<int:groupId>/delete", methods=["DELETE"])
@login_required
def delete_group(groupId):
    """
    Delete group with batch operations and proper transaction handling
    """
    group_to_delete = Group.query.get(groupId)

    if not group_to_delete:
        return {"errors": {"message": "Group not found"}}, 404

    if current_user.id != group_to_delete.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    try:
        # Use proper transaction handling
        # Delete all related data in correct order using raw SQL for efficiency

        # Delete attendances for events in this group
        db.session.execute(
            text(
                "DELETE FROM attendances WHERE event_id IN (SELECT id FROM events WHERE group_id = :group_id)"
            ),
            {"group_id": groupId},
        )

        # Delete event images for events in this group
        db.session.execute(
            text(
                "DELETE FROM event_images WHERE event_id IN (SELECT id FROM events WHERE group_id = :group_id)"
            ),
            {"group_id": groupId},
        )

        # Delete events in this group
        db.session.execute(
            text("DELETE FROM events WHERE group_id = :group_id"), {"group_id": groupId}
        )

        # Delete venues in this group
        db.session.execute(
            text("DELETE FROM venues WHERE group_id = :group_id"), {"group_id": groupId}
        )

        # Delete group images
        db.session.execute(
            text("DELETE FROM group_images WHERE group_id = :group_id"),
            {"group_id": groupId},
        )

        # Delete memberships (including organizer)
        db.session.execute(
            text("DELETE FROM memberships WHERE group_id = :group_id"),
            {"group_id": groupId},
        )

        # Remove main image from S3
        if group_to_delete.image:
            try:
                remove_file_from_s3(group_to_delete.image)
            except Exception as s3_error:
                print(f"S3 deletion error: {s3_error}")
                # Continue with database deletion even if S3 fails

        # Delete the group itself
        db.session.delete(group_to_delete)

        # Commit the transaction
        db.session.commit()

        return {"message": "Group deleted successfully"}, 200

    except Exception as e:
        db.session.rollback()
        print(f"Group deletion error: {str(e)}")
        return {"errors": {"message": "Error deleting group"}}, 500


# ! GROUP - MEMBERS
@group_routes.route("/<int:groupId>/join-group", methods=["POST"])
@login_required
def join_group(groupId):
    """
    Join group with checks
    """
    group = Group.query.get(groupId)

    if not group:
        return {"errors": {"message": "Group not found"}}, 404

    # Prevent the organizer from joining as a member
    if group.organizer_id == current_user.id:
        return {"message": "User is the organizer of the group"}, 403

    # Check if the user is already a member
    existing_membership = Membership.query.filter_by(
        group_id=groupId, user_id=current_user.id
    ).first()

    if existing_membership:
        return {"message": "Already a member of this group"}, 400

    try:
        new_membership = Membership(group_id=groupId, user_id=current_user.id)
        db.session.add(new_membership)
        db.session.commit()

        return {"message": "Successfully joined the group"}, 200

    except Exception as e:
        db.session.rollback()
        return {"errors": {"message": "Error joining group"}}, 500


@group_routes.route("/<int:groupId>/leave-group/<int:memberId>", methods=["DELETE"])
@login_required
def leave_group(groupId, memberId):
    """
    Leave group with proper organizer protection
    """
    group = Group.query.get(groupId)

    if not group:
        return {"errors": {"message": "Group not found"}}, 404

    # Check if the user to be removed is a member of the group
    member = Membership.query.filter_by(group_id=groupId, user_id=memberId).first()

    if not member:
        return {"message": "User is not a member of this group"}, 400

    # Prevent organizer from leaving their own group
    if memberId == group.organizer_id:
        return {
            "message": "The organizer cannot leave their own group. Transfer ownership or delete the group instead."
        }, 403

    # If the current user is trying to leave the group
    if memberId == current_user.id:
        try:
            db.session.delete(member)
            db.session.commit()
            return {"message": "You have successfully left the group"}, 200
        except Exception as e:
            db.session.rollback()
            return {"errors": {"message": "Error leaving group"}}, 500

    # If the current user is trying to remove another member
    if group.organizer_id != current_user.id:
        return {"message": "Only the organizer can remove members"}, 403

    try:
        db.session.delete(member)
        db.session.commit()
        return {"message": "Member successfully removed from the group"}, 200
    except Exception as e:
        db.session.rollback()
        return {"errors": {"message": "Error removing member"}}, 500


# ! GROUP - IMAGES (Simplified for performance)
@group_routes.route("/<int:groupId>/images", methods=["POST"])
@login_required
def add_group_image(groupId):
    """
    Add group image with minimal response
    """
    group = Group.query.get(groupId)
    if not group:
        return {"errors": {"message": "Group not found"}}, 404

    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = GroupImageForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        group_image = form.group_image.data

        if group_image:
            try:
                group_image.filename = get_unique_filename(group_image.filename)
                upload = upload_file_to_s3(group_image)

                if "url" not in upload:
                    return {"message": "Image upload failed"}, 400

                url = upload["url"]
                new_group_image = GroupImage(group_id=groupId, group_image=url)
                db.session.add(new_group_image)
                db.session.commit()

                return {"group_image": new_group_image.to_dict()}, 201
            except Exception as e:
                return {"message": f"Image upload failed: {str(e)}"}, 500
        else:
            return {"message": "No image provided"}, 400

    return form.errors, 400


# ! GROUP - EVENTS
@group_routes.route("/<int:groupId>/events/new", methods=["POST"])
@login_required
def create_event(groupId):
    """
    Create event with automatic organizer attendance and proper response
    """
    group = Group.query.get(groupId)

    if not group:
        return {"errors": {"message": "Group not found"}}, 404

    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = EventForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        image = form.image.data

        if not image:
            return {"message": "An image is required to create an event."}, 400

        try:
            image.filename = get_unique_filename(image.filename)
            upload = upload_file_to_s3(image)
        except Exception as e:
            return {"message": f"Image upload failed: {str(e)}"}, 500

        if "url" not in upload:
            return {"message": "Image upload failed. Please try again."}, 400

        url = upload["url"]

        try:
            # Create the event
            new_event = Event(
                group_id=groupId,
                name=form.data["name"],
                description=form.data["description"],
                type=form.data["type"],
                capacity=form.data["capacity"],
                image=url,
                start_date=form.data["startDate"],
                end_date=form.data["endDate"],
            )

            db.session.add(new_event)
            db.session.flush()  # Get the event ID

            # AUTOMATICALLY ADD ORGANIZER AS ATTENDEE
            organizer_attendance = Attendance(
                event_id=new_event.id, user_id=current_user.id
            )
            db.session.add(organizer_attendance)

            # Commit both the event and attendance
            db.session.commit()

            # Return complete event data with attendance count
            return {
                "event": {
                    "id": new_event.id,
                    "name": new_event.name,
                    "description": new_event.description,
                    "type": new_event.type,
                    "capacity": new_event.capacity,
                    "image": new_event.image,
                    "startDate": new_event.start_date.isoformat(),
                    "endDate": new_event.end_date.isoformat(),
                    "groupId": new_event.group_id,
                    "numAttendees": 1,  # Organizer is automatically attending
                    "organizerId": current_user.id,
                    "organizer": {
                        "id": current_user.id,
                        "firstName": current_user.first_name,
                        "lastName": current_user.last_name,
                        "username": current_user.username,
                        "profileImage": current_user.profile_image_url,
                    },
                }
            }, 201

        except Exception as e:
            db.session.rollback()
            return {"message": f"Event creation failed: {str(e)}"}, 500

    return form.errors, 400


# ! GROUP - VENUES (Simplified)
@group_routes.route("/<int:groupId>/venues", methods=["POST"])
@login_required
def create_venue(groupId):
    """
    Create venue with minimal response
    """
    group = Group.query.get(groupId)

    if not group:
        return {"errors": {"message": "Group not found"}}, 404

    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = VenueForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        new_venue = Venue(
            group_id=groupId,
            address=form.data["address"],
            city=form.data["city"],
            state=form.data["state"],
            zip_code=form.data["zip_code"],
            latitude=form.data["latitude"],
            longitude=form.data["longitude"],
        )

        db.session.add(new_venue)
        db.session.commit()

        return new_venue.to_dict(), 201

    return form.errors, 400
