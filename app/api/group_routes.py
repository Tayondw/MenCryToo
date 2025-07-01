from flask import Blueprint, request, render_template, redirect, jsonify
from flask_login import login_required, current_user
from app.models import db, Group, GroupImage, Membership, Venue, Event, EventImage, Attendance
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
from sqlalchemy import func, and_

group_routes = Blueprint("groups", __name__)


# ! GROUPS
@group_routes.route("/")
def all_groups():
    """
    Query for all groups with optimized pagination and minimal data loading
    """
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 50)

    # Get search and filter parameters
    search = request.args.get("search", "").strip()
    group_type = request.args.get("type", "").strip()
    city = request.args.get("city", "").strip()
    state = request.args.get("state", "").strip()

    # Build query with optimized loading
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
    Query for group by id with optimized loading
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
    Create a new group with optimized response
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
        db.session.commit()

        # Return minimal data for faster response
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
                "numMembers": 0,
                "numEvents": 0,
            }
        }, 201

    return form.errors, 400


@group_routes.route("/<int:groupId>/edit", methods=["POST"])
@login_required
def edit_group(groupId):
    """
    Update group with optimized response
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
    Delete group with optimized batch operations
    """
    group_to_delete = Group.query.get(groupId)

    if not group_to_delete:
        return {"errors": {"message": "Group not found"}}, 404

    if current_user.id != group_to_delete.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    try:
        # Use bulk delete operations for better performance
        from sqlalchemy import text

        # Delete all related data in correct order
        db.session.execute(
            text(
                "DELETE FROM attendances WHERE event_id IN (SELECT id FROM events WHERE group_id = :group_id)"
            ),
            {"group_id": groupId},
        )

        db.session.execute(
            text(
                "DELETE FROM event_images WHERE event_id IN (SELECT id FROM events WHERE group_id = :group_id)"
            ),
            {"group_id": groupId},
        )

        db.session.execute(
            text("DELETE FROM events WHERE group_id = :group_id"), {"group_id": groupId}
        )

        db.session.execute(
            text("DELETE FROM venues WHERE group_id = :group_id"), {"group_id": groupId}
        )

        db.session.execute(
            text("DELETE FROM group_images WHERE group_id = :group_id"),
            {"group_id": groupId},
        )

        db.session.execute(
            text("DELETE FROM memberships WHERE group_id = :group_id"),
            {"group_id": groupId},
        )

        # Remove main image from S3
        if group_to_delete.image:
            remove_file_from_s3(group_to_delete.image)

        db.session.delete(group_to_delete)
        db.session.commit()

        return {"message": "Group deleted successfully"}, 200

    except Exception as e:
        db.session.rollback()
        return {"errors": {"message": "Error deleting group"}}, 500


# ! GROUP - MEMBERS
@group_routes.route("/<int:groupId>/join-group", methods=["POST"])
@login_required
def join_group(groupId):
    """
    Join group with optimized checks
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
    Leave group with optimized operations
    """
    group = Group.query.get(groupId)

    if not group:
        return {"errors": {"message": "Group not found"}}, 404

    # Check if the user to be removed is a member of the group
    member = Membership.query.filter_by(group_id=groupId, user_id=memberId).first()

    if not member:
        return {"message": "User is not a member of this group"}, 400

    # If the current user is trying to leave the group
    if memberId == current_user.id:
        if group.organizer_id == current_user.id:
            return {"message": "The organizer cannot leave their own group"}, 403

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

    if memberId == group.organizer_id:
        return {"message": "The organizer cannot be removed from the group"}, 400

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


# ! GROUP - EVENTS (Simplified)
@group_routes.route("/<int:groupId>/events/new", methods=["POST"])
@login_required
def create_event(groupId):
    """
    Create event with minimal response data
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
        db.session.commit()

        # Return minimal event data
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
                "numAttendees": 0,
            }
        }, 201

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


# from flask import Blueprint, request, render_template, redirect, jsonify
# from flask_login import login_required, current_user
# from app.models import db, Group, GroupImage, Membership, Venue, Event, EventImage
# from app.forms import (
#     GroupForm,
#     GroupImageForm,
#     EventForm,
#     VenueForm,
#     EditGroupForm,
#     EditEventForm,
# )
# from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3
# from sqlalchemy.orm import joinedload, selectinload
# from sqlalchemy import func

# group_routes = Blueprint("groups", __name__)


# # ! GROUPS
# @group_routes.route("/")
# def all_groups():
#     """
#     Query for all groups and returns them in a list of group dictionaries - with member count
#     """
#     groups = (
#         db.session.query(Group)
#         .options(
#             joinedload(Group.organizer),
#             selectinload(Group.memberships),
#             selectinload(Group.group_images),
#         )
#         .all()
#     )

#     if not groups:
#         return jsonify({"errors": {"message": "Not Found"}}), 404

#     return jsonify({"groups": [group.to_dict_minimal() for group in groups]})


# @group_routes.route("/<int:groupId>")
# def group(groupId):
#     """
#     Query for group by id and returns that group in a dictionary
#     """
#     group = (
#         db.session.query(Group)
#         .options(
#             joinedload(Group.organizer),
#             selectinload(Group.events),
#             selectinload(Group.venues),
#             selectinload(Group.memberships).joinedload(Membership.user),
#             selectinload(Group.group_images),
#         )
#         .filter(Group.id == groupId)
#         .first()
#     )

#     if not group:
#         return jsonify({"errors": {"message": "Not Found"}}), 404

#     return jsonify(group.to_dict())


# @group_routes.route("/new", methods=["GET", "POST"])
# @login_required
# def create_group():
#     """
#     Create a new group linked to the current user and submit to the database

#     renders an empty form on get requests, validates and submits form on post requests

#     The commented out code was to test if the post request works
#     """
#     form = GroupForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]

#     if form.validate_on_submit():
#         image = form.image.data

#         if not image:
#             return {"message": "An image is required to create a group."}, 400

#         try:
#             image.filename = get_unique_filename(image.filename)
#             upload = upload_file_to_s3(image)
#         except Exception as e:
#             return {"message": f"Image upload failed: {str(e)}"}, 500

#         if "url" not in upload:
#             return {
#                 "message": upload.get(
#                     "errors", "Image upload failed. Please try again."
#                 )
#             }, 400

#         url = upload["url"]

#         new_group = Group(
#             organizer_id=current_user.id,
#             name=form.data["name"],
#             about=form.data["about"],
#             type=form.data["type"],
#             city=form.data["city"],
#             state=form.data["state"],
#             image=url,
#         )

#         db.session.add(new_group)
#         db.session.commit()

#         # Load the created group with relationships
#         created_group = (
#             db.session.query(Group)
#             .options(
#                 joinedload(Group.organizer),
#                 selectinload(Group.memberships),
#                 selectinload(Group.group_images),
#             )
#             .filter(Group.id == new_group.id)
#             .first()
#         )
#         #   return redirect("/api/groups/")
#         return created_group.to_dict(), 201
#     #   if form.errors:
#     #       print(form.errors)
#     #       return render_template("group_form.html", form=form, errors=form.errors)
#     #   return render_template("group_form.html", form=form, errors=None)
#     return form.errors, 400


# @group_routes.route("/<int:groupId>/edit", methods=["GET", "POST"])
# @login_required
# def edit_group(groupId):
#     """
#     will generate an update group form on get requests and validate/save on post requests

#     Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

#     Returns 404 Not Found if the group is not in the database

#     The commented out code was to test if the post request works
#     """
#     group_to_edit = Group.query.get(groupId)

#     if not group_to_edit:
#         return {"errors": {"message": "Not Found"}}, 404

#     if current_user.id != group_to_edit.organizer_id:
#         return {"errors": {"message": "Unauthorized"}}, 401

#     form = EditGroupForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]

#     if form.validate_on_submit():
#         image = form.image.data

#         if image:
#             try:
#                 image.filename = get_unique_filename(image.filename)
#                 upload = upload_file_to_s3(image)
#             except Exception as e:
#                 return {"message": f"Image upload failed: {str(e)}"}, 500

#             if "url" not in upload:
#                 return {
#                     "message": upload.get(
#                         "errors", "Image upload failed. Please try again."
#                     )
#                 }, 400

#             # Remove the old image from S3
#             if group_to_edit.image:
#                 remove_file_from_s3(group_to_edit.image)
#             group_to_edit.image = upload["url"]

#         # Update group fields
#         group_to_edit.name = form.data["name"] or group_to_edit.name
#         group_to_edit.about = form.data["about"] or group_to_edit.about
#         group_to_edit.type = form.data["type"] or group_to_edit.type
#         group_to_edit.city = form.data["city"] or group_to_edit.city
#         group_to_edit.state = form.data["state"] or group_to_edit.state

#         db.session.commit()

#         # Return updated group with relationships
#         updated_group = (
#             db.session.query(Group)
#             .options(
#                 joinedload(Group.organizer),
#                 selectinload(Group.events),
#                 selectinload(Group.venues),
#                 selectinload(Group.memberships),
#                 selectinload(Group.group_images),
#             )
#             .filter(Group.id == groupId)
#             .first()
#         )

#         return updated_group.to_dict(), 201
#     #   return redirect(f"/api/groups/{groupId}")

#     #     elif form.errors:
#     #             print(form.errors)
#     #             return render_template(
#     #                 "group_form.html", form=form, type="update", id=groupId, errors=form.errors
#     #             )

#     #     else:
#     #             current_data = Group.query.get(groupId)
#     #             print(current_data)
#     #             form.process(obj=current_data)
#     #             return render_template(
#     #                 "group_form.html", form=form, type="update", id=groupId, errors=None
#     #             )
#     return form.errors, 400


# @group_routes.route("/<int:groupId>/delete", methods=["DELETE"])
# @login_required
# def delete_group(groupId):
#     """
#     will delete a given group by its id

#     Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

#     Returns 404 Not Found if the group is not in the database

#     The commented out code was to test if the delete request works
#     """
#     group_to_delete = Group.query.get(groupId)

#     if not group_to_delete:
#         return {"errors": {"message": "Not Found"}}, 404

#     if current_user.id != group_to_delete.organizer_id:
#         return {"errors": {"message": "Unauthorized"}}, 401

#     try:
#         # Delete associated data in batch operations
#         GroupImage.query.filter_by(group_id=groupId).delete(synchronize_session=False)
#         EventImage.query.filter(
#             EventImage.event_id.in_(
#                 db.session.query(Event.id).filter_by(group_id=groupId)
#             )
#         ).delete(synchronize_session=False)
#         Event.query.filter_by(group_id=groupId).delete(synchronize_session=False)
#         Venue.query.filter_by(group_id=groupId).delete(synchronize_session=False)
#         Membership.query.filter_by(group_id=groupId).delete(synchronize_session=False)

#         db.session.delete(group_to_delete)
#         db.session.commit()

#         return {"message": "Group deleted"}, 200

#     except Exception as e:
#         db.session.rollback()
#         return {"errors": {"message": "Error deleting group"}}, 500


# #     return redirect("/api/groups/")


# # ! GROUP IMAGES
# @group_routes.route("/<int:groupId>/images", methods=["GET", "POST"])
# @login_required
# def add_group_image(groupId):
#     """
#     will add a group image by the group's id

#     Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

#     Returns 404 Not Found if the group is not in the database

#     The commented out code was to test if the post request works
#     """

#     # check if there is a group to add the image to
#     group = Group.query.get(groupId)
#     if not group:
#         return {"errors": {"message": "Not Found"}}, 404

#     if current_user.id != group.organizer_id:
#         return {"errors": {"message": "Unauthorized"}}, 401

#     form = GroupImageForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]

#     if form.validate_on_submit():
#         group_image = form.group_image.data

#         if group_image:
#             group_image.filename = get_unique_filename(group_image.filename)
#             upload = upload_file_to_s3(group_image)

#             if "url" not in upload:
#                 return {"message": "unable to locate url"}, 400

#             url = upload["url"]
#             new_group_image = GroupImage(group_id=groupId, group_image=url)
#             db.session.add(new_group_image)
#             db.session.commit()

#             return {"group_image": new_group_image.to_dict()}, 201
#         else:
#             return {"message": "Group image is None"}, 400
#     #     if form.errors:
#     #         print(form.errors)
#     #         return render_template("group_image_form.html", form=form, id=groupId, errors=form.errors)
#     #     return render_template("group_image_form.html", form=form, id=groupId, errors=None)
#     return form.errors, 400


# @group_routes.route("/<int:groupId>/images/<int:imageId>/edit", methods=["GET", "POST"])
# @login_required
# def edit_group_images(groupId, imageId):
#     """
#     will generate an update group image form on get requests and validate/save on post requests

#     Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

#     Returns 404 Not Found if the group is not in the database or if the group image is not found in the database

#     The commented out code was to test if the post request works
#     """
#     group_image = GroupImage.query.get(imageId)
#     group = Group.query.get(groupId)

#     if not group:
#         return {"errors": {"message": "Not Found"}}, 404

#     if not group_image:
#         return {"errors": {"message": "Not Found"}}, 404

#     if current_user.id != group.organizer_id:
#         return {"errors": {"message": "Unauthorized"}}, 401

#     form = GroupImageForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]

#     if form.validate_on_submit():
#         edit_group_image = form.data["group_image"]
#         if not edit_group_image:
#             return {"message": "No image provided"}, 400

#         edit_group_image.filename = get_unique_filename(edit_group_image.filename)
#         upload = upload_file_to_s3(edit_group_image)

#         if "url" not in upload:
#             return {"message": "Upload failed"}, 400

#         # Remove the old image from S3
#         if group_image.group_image:
#             remove_file_from_s3(group_image.group_image)

#         group_image.group_image = upload["url"]
#         db.session.commit()

#         return {"group_image": group_image.to_dict()}, 200
#     #   return {"message": "Image updated successfully"}

#     return form.errors, 400


# #     return render_template(
# #         "group_image_form.html",
# #         form=form,
# #         type="update",
# #         groupId=groupId,
# #         group_image=group_image,
# #     )


# # ! GROUP - EVENTS
# @group_routes.route("/<int:groupId>/events/new", methods=["POST"])
# @login_required
# def create_event(groupId):
#     """
#     Create an event linked to a group and submit to the database

#     renders an empty form on get requests, validates and submits form on post requests

#     The commented out code was to test if the post request works
#     """
#     group = Group.query.get(groupId)

#     if not group:
#         return {"errors": {"message": "Not Found"}}, 404

#     if current_user.id != group.organizer_id:
#         return {"errors": {"message": "Unauthorized"}}, 401

#     form = EventForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]

#     if form.validate_on_submit():
#         image = form.image.data

#         if not image:
#             return {"message": "An image is required to create an event."}, 400

#         try:
#             image.filename = get_unique_filename(image.filename)
#             upload = upload_file_to_s3(image)
#         except Exception as e:
#             return {"message": f"Image upload failed: {str(e)}"}, 500

#         if "url" not in upload:
#             return {
#                 "message": upload.get(
#                     "errors", "Image upload failed. Please try again."
#                 )
#             }, 400

#         url = upload["url"]

#         new_event = Event(
#             group_id=groupId,
#             name=form.data["name"],
#             description=form.data["description"],
#             type=form.data["type"],
#             capacity=form.data["capacity"],
#             image=url,
#             start_date=form.data["startDate"],
#             end_date=form.data["endDate"],
#         )

#         db.session.add(new_event)
#         db.session.commit()

#         # Load created event with relationships
#         created_event = (
#             db.session.query(Event)
#             .options(
#                 joinedload(Event.groups).joinedload(Group.organizer),
#                 selectinload(Event.attendances),
#                 selectinload(Event.event_images),
#             )
#             .filter(Event.id == new_event.id)
#             .first()
#         )

#         return created_event.to_dict(), 201
#         #   return redirect("/api/events/")

#     #     if form.errors:
#     #             print(form.errors)
#     #             return render_template(
#     #                 "event_form.html", id=groupId, form=form, errors=form.errors
#     #             )
#     #     return render_template("event_form.html", id=groupId, form=form, errors=None)
#     return form.errors, 400


# @group_routes.route("/<int:groupId>/events/<int:eventId>", methods=["POST"])
# @login_required
# def edit_event(groupId, eventId):
#     """
#     will generate an update event form on get requests and validate/save on post requests

#     Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

#     Returns 404 Not Found if the event or the group is not in the database

#     The commented out code was to test if the post request works
#     """
#     group = Group.query.get(groupId)
#     event_to_edit = Event.query.get(eventId)

#     if not group:
#         return {"errors": {"message": "Group not found"}}, 404

#     if not event_to_edit:
#         return {"errors": {"message": "Event not found"}}, 404

#     if current_user.id != group.organizer_id:
#         return {"errors": {"message": "Unauthorized"}}, 401

#     form = EditEventForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]

#     if form.validate_on_submit():
#         image = form.image.data

#         if image:
#             try:
#                 image.filename = get_unique_filename(image.filename)
#                 upload = upload_file_to_s3(image)
#             except Exception as e:
#                 return {"message": f"Image upload failed: {str(e)}"}, 500

#             if "url" not in upload:
#                 return {
#                     "message": upload.get(
#                         "errors", "Image upload failed. Please try again."
#                     )
#                 }, 400

#             # Remove the old image from S3
#             if event_to_edit.image:
#                 remove_file_from_s3(event_to_edit.image)
#             event_to_edit.image = upload["url"]

#         # Update event fields
#         event_to_edit.name = form.data["name"] or event_to_edit.name
#         event_to_edit.description = (
#             form.data["description"] or event_to_edit.description
#         )
#         event_to_edit.type = form.data["type"] or event_to_edit.type
#         event_to_edit.capacity = form.data["capacity"] or event_to_edit.capacity
#         event_to_edit.start_date = form.data["startDate"] or event_to_edit.start_date
#         event_to_edit.end_date = form.data["endDate"] or event_to_edit.end_date

#         db.session.commit()

#         # Return updated event with relationships
#         updated_event = (
#             db.session.query(Event)
#             .options(
#                 joinedload(Event.groups).joinedload(Group.organizer),
#                 selectinload(Event.attendances),
#                 selectinload(Event.event_images),
#             )
#             .filter(Event.id == eventId)
#             .first()
#         )

#         return updated_event.to_dict(), 201
#     #   return redirect(f"/api/groups/{groupId}")

#     #     elif form.errors:
#     #         print(form.errors)
#     #         return render_template(
#     #             "event_form.html",
#     #             form=form,
#     #             type="update",
#     #             id=groupId,
#     #             eventId=eventId,
#     #             errors=form.errors,
#     #         )

#     #     else:
#     #         current_data = Group.query.get(groupId)
#     #         print(current_data)
#     #         form.process(obj=current_data)
#     #         return render_template(
#     #             "event_form.html",
#     #             form=form,
#     #             type="update",
#     #             id=groupId,
#     #             eventId=eventId,
#     #             errors=None,
#     #         )
#     return form.errors, 400


# # ! GROUP - VENUES
# @group_routes.route("/<int:groupId>/venues", methods=["GET", "POST"])
# @login_required
# def create_venue(groupId):
#     """
#     Create a venue linked to a group and submit to the database

#     renders an empty form on get requests, validates and submits form on post requests

#     The commented out code was to test if the post request works
#     """
#     group = Group.query.get(groupId)

#     if not group:
#         return {"errors": {"message": "Not Found"}}, 404

#     if current_user.id != group.organizer_id:
#         return {"errors": {"message": "Unauthorized"}}, 401

#     form = VenueForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]

#     if form.validate_on_submit():
#         new_venue = Venue(
#             group_id=groupId,
#             address=form.data["address"],
#             city=form.data["city"],
#             state=form.data["state"],
#             zip_code=form.data["zip_code"],
#             latitude=form.data["latitude"],
#             longitude=form.data["longitude"],
#         )

#         db.session.add(new_venue)
#         db.session.commit()

#         return new_venue.to_dict(), 201
#     #   return redirect("/api/venues/")

#     #    if form.errors:
#     #       print(form.errors)
#     #       return render_template(
#     #           "venue_form.html", id=groupId, form=form, errors=form.errors
#     #       )
#     #    return render_template("venue_form.html", id=groupId, form=form, errors=None)
#     return form.errors, 400


# # ! GROUP - MEMBERS
# @group_routes.route("/<int:groupId>/join-group", methods=["POST"])
# @login_required
# def join_group(groupId):
#     group = Group.query.get(groupId)

#     if not group:
#         return {"errors": {"message": "Not Found"}}, 404

#     # Prevent the organizer from joining as a member
#     if group.organizer_id == current_user.id:
#         return {"message": "User is the organizer of the group"}, 403

#     # Check if the user is already a member in one query
#     existing_membership = Membership.query.filter_by(
#         group_id=groupId, user_id=current_user.id
#     ).first()

#     if existing_membership:
#         return {"message": "Already a member of this group"}, 400

#     # Parse JSON request body
#     data = request.get_json()
#     user_id = data.get("user_id") if data else None
#     group_id = data.get("group_id") if data else groupId

#     # Ensure data is valid
#     if user_id and user_id != current_user.id:
#         return jsonify({"message": "Invalid user ID"}), 400

#     try:
#         new_membership = Membership(group_id=group_id, user_id=current_user.id)
#         db.session.add(new_membership)
#         db.session.commit()

#         return {"message": "Successfully joined the group"}, 200

#     except Exception as e:
#         db.session.rollback()
#         return {"errors": {"message": "Error joining group"}}, 500


# @group_routes.route("/<int:groupId>/leave-group/<int:memberId>", methods=["DELETE"])
# @login_required
# def leave_group(groupId, memberId):
#     group = Group.query.get(groupId)

#     if not group:
#         return {"errors": {"message": "Group not found"}}, 404

#     # Check if the user to be removed is a member of the group
#     member = Membership.query.filter_by(group_id=groupId, user_id=memberId).first()

#     if not member:
#         return {"message": "User is not a member of this group"}, 400

#     # If the current user is trying to leave the group
#     if memberId == current_user.id:
#         if group.organizer_id == current_user.id:
#             return {"message": "The organizer cannot leave their own group"}, 403

#         try:
#             db.session.delete(member)
#             db.session.commit()
#             return {"message": "You have successfully left the group"}, 200
#         except Exception as e:
#             db.session.rollback()
#             return {"errors": {"message": "Error leaving group"}}, 500

#     # If the current user is trying to remove another member
#     if group.organizer_id != current_user.id:
#         return {"message": "Only the organizer can remove members"}, 403

#     if memberId == group.organizer_id:
#         return {"message": "The organizer cannot be removed from the group"}, 400

#     try:
#         db.session.delete(member)
#         db.session.commit()
#         return {"message": "Member successfully removed from the group"}, 200
#     except Exception as e:
#         db.session.rollback()
