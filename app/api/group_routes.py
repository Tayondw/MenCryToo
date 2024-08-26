from flask import Blueprint, request, abort, render_template, redirect, jsonify
from flask_login import login_required, current_user
from app.models import (
    db,
    Group,
    GroupImage,
    User,
    Memberships,
    Attendances,
    Venue,
    Event,
)
from app.forms import GroupForm, GroupImageForm, EventForm, VenueForm
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3

group_routes = Blueprint("groups", __name__)


# ! GROUPS
@group_routes.route("/")
def all_groups():
    """
    Query for all groups and returns them in a list of group dictionaries
    """
    groups = Group.query.all()
    if not groups:
        return jsonify({"errors": {"message": "Not Found"}}), 404
    return jsonify({"groups": [group.to_dict() for group in groups]})


@group_routes.route("/<int:groupId>")
def group(groupId):
    """
    Query for group by id and returns that group in a dictionary
    """
    group = Group.query.get(groupId)
    if not group:
        return jsonify({"errors": {"message": "Not Found"}}), 404
    return group.to_dict()


@group_routes.route("/new", methods=["GET", "POST"])
@login_required
def create_group():
    """
    Create a new group linked to the current user and submit to the database

    renders an empty form on get requests, validates and submits form on post requests

    The commented out code was to test if the post request works
    """
    form = GroupForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        new_group = Group(
            organizer_id=current_user.id,
            name=form.data["name"],
            about=form.data["about"],
            type=form.data["type"],
            city=form.data["city"],
            state=form.data["state"],
        )
        db.session.add(new_group)
        db.session.commit()
        #   return redirect("/api/groups/")
        return new_group.to_dict()
    #     if form.errors:
    #         print(form.errors)
    #         return render_template("group_form.html", form=form, errors=form.errors)
    #     return render_template("group_form.html", form=form, errors=None)

    return form.errors, 400


@group_routes.route("/<int:groupId>/edit", methods=["GET", "POST"])
@login_required
def edit_group(groupId):
    """
    will generate an update group form on get requests and validate/save on post requests

    Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

    Returns 404 Not Found if the group is not in the database

    The commented out code was to test if the post request works
    """
    group_to_edit = Group.query.get(groupId)

    # check if there is a group to edit
    if not group_to_edit:
        return {"errors": {"message": "Not Found"}}, 404

    # check if current user is group organizer - group organizer is only allowed to update
    if current_user.id != group_to_edit.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = GroupForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        group_to_edit.organizer_id = current_user.id
        group_to_edit.name = form.data["name"] or group_to_edit.name
        group_to_edit.about = form.data["about"] or group_to_edit.about
        group_to_edit.type = form.data["type"] or group_to_edit.type
        group_to_edit.city = form.data["city"] or group_to_edit.city
        group_to_edit.state = form.data["state"] or group_to_edit.state
        db.session.commit()
        return group_to_edit.to_dict()
    #   return redirect(f"/api/groups/{groupId}")

    #     elif form.errors:
    #             print(form.errors)
    #             return render_template(
    #                 "group_form.html", form=form, type="update", id=groupId, errors=form.errors
    #             )

    #     else:
    #             current_data = Group.query.get(groupId)
    #             print(current_data)
    #             form.process(obj=current_data)
    #             return render_template(
    #                 "group_form.html", form=form, type="update", id=groupId, errors=None
    #             )
    return form.errors, 400


@group_routes.route("/<int:groupId>/delete", methods=["DELETE"])
@login_required
def delete_group(groupId):
    """
    will delete a given group by its id

    Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

    Returns 404 Not Found if the group is not in the database

    The commented out code was to test if the delete request works
    """
    group_to_delete = Group.query.get(groupId)

    # check if there is a group to delete
    if not group_to_delete:
        return {"errors": {"message": "Not Found"}}, 404

    # check if current user is group organizer - group organizer is only allowed to update
    if current_user.id != group_to_delete.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    # Delete associated group images
    GroupImage.query.filter_by(group_id=groupId).delete()

    db.session.delete(group_to_delete)
    db.session.commit()
    return {"message": "Group deleted"}


#     return redirect("/api/groups/")


# ! GROUP IMAGES
@group_routes.route("/<int:groupId>/images", methods=["GET", "POST"])
@login_required
def add_group_image(groupId):
    """
    will add a group image by the group's id

    Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

    Returns 404 Not Found if the group is not in the database

    The commented out code was to test if the post request works
    """

    # check if there is a group to add the image to
    group = Group.query.get(groupId)
    if not group:
        return {"errors": {"message": "Not Found"}}, 404

    # check if current user is group organizer - group organizer is only allowed to update
    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = GroupImageForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        group_image = form.group_image.data

        if group_image:
            group_image.filename = get_unique_filename(group_image.filename)
            upload = upload_file_to_s3(group_image)

            if "url" not in upload:
                # if the dictionary doesn't have a url key
                # it means that there was an error when you tried to upload
                # so you send back that error message (and you printed it above)
                return {"message": "unable to locate url"}
            url = upload["url"]
            new_group_image = GroupImage(group_id=groupId, group_image=url)
            db.session.add(new_group_image)
            db.session.commit()
            return {"group_image": new_group_image.to_dict()}, 201
        else:
            return {"message": "Group image is None"}
    #     if form.errors:
    #         print(form.errors)
    #         return render_template("group_image_form.html", form=form, id=groupId, errors=form.errors)
    #     return render_template("group_image_form.html", form=form, id=groupId, errors=None)
    return form.errors, 400


@group_routes.route("/<int:groupId>/images/<int:imageId>/edit", methods=["GET", "POST"])
@login_required
def edit_group_images(groupId, imageId):
    """
    will generate an update group image form on get requests and validate/save on post requests

    Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

    Returns 404 Not Found if the group is not in the database or if the group image is not found in the database

    The commented out code was to test if the post request works
    """

    group_image = GroupImage.query.get(imageId)

    group = Group.query.get(groupId)

    # check if there is a group to edit
    if not group:
        return {"errors": {"message": "Not Found"}}, 404

    # check if there is a group image to edit
    if not group_image:
        return {"errors": {"message": "Not Found"}}, 404

    # check if current user is group organizer - group organizer is only allowed to update
    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = GroupImageForm()
    if form.validate_on_submit():
        edit_group_image = form.data["group_image"] or edit_group_image.group_image
        edit_group_image.filename = get_unique_filename(edit_group_image.filename)
        upload = upload_file_to_s3(edit_group_image)

        if "url" not in upload:
            return {"message": "Upload failed"}, 400

        # Remove the old image from S3
        remove_file_from_s3(group_image.group_image)

        group_image.group_image = upload["url"]
        db.session.commit()
        return {"group_image": group_image.to_dict()}, 200
    #   return {"message": "Image updated successfully"}

    return form.errors, 400


#     return render_template(
#         "group_image_form.html",
#         form=form,
#         type="update",
#         groupId=groupId,
#         group_image=group_image,
#     )


# ! GROUP - EVENTS
@group_routes.route("/<int:groupId>/events", methods=["GET", "POST"])
@login_required
def create_event(groupId):
    """
    Create an event linked to a group and submit to the database

    renders an empty form on get requests, validates and submits form on post requests

    The commented out code was to test if the post request works
    """
    # query for the group you want to add the event to
    group = Group.query.get(groupId)

    # check if there is a group
    if not group:
        return {"errors": {"message": "Not Found"}}, 404

    # check if current user is group organizer - group organizer is only allowed to update
    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = EventForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        new_event = Event(
            group_id=groupId,
            name=form.data["name"],
            description=form.data["description"],
            type=form.data["type"],
            capacity=form.data["capacity"],
            start_date=form.data["start_date"],
            end_date=form.data["end_date"],
        )
        db.session.add(new_event)
        db.session.commit()
        #   return redirect("/api/events/")
        return new_event.to_dict()
    #     if form.errors:
    #             print(form.errors)
    #             return render_template(
    #                 "event_form.html", id=groupId, form=form, errors=form.errors
    #             )
    #     return render_template("event_form.html", id=groupId, form=form, errors=None)

    return form.errors, 400


@group_routes.route("/<int:groupId>/events/<int:eventId>", methods=["GET", "POST"])
@login_required
def edit_event(groupId, eventId):
    """
    will generate an update event form on get requests and validate/save on post requests

    Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

    Returns 404 Not Found if the event or the group is not in the database

    The commented out code was to test if the post request works
    """
    # query for the group you want to edit the event
    group = Group.query.get(groupId)

    # query for the event you want to edit
    event_to_edit = Event.query.get(eventId)

    # check if there is a group to edit
    if not group:
        return {"errors": {"message": "Not Found"}}, 404

    # check if there is an event to edit
    if not event_to_edit:
        return {"errors": {"message": "Not Found"}}, 404

    # check if current user is group organizer - group organizer is only allowed to update
    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = EventForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        event_to_edit.group_id = groupId
        event_to_edit.name = form.data["name"] or event_to_edit.name
        event_to_edit.description = (
            form.data["description"] or event_to_edit.description
        )
        event_to_edit.type = form.data["type"] or event_to_edit.type
        event_to_edit.capacity = form.data["capacity"] or event_to_edit.capacity
        event_to_edit.start_date = form.data["start_date"] or event_to_edit.start_date
        event_to_edit.end_date = form.data["end_date"] or event_to_edit.end_date
        db.session.commit()
        return event_to_edit.to_dict()
    #   return redirect(f"/api/groups/{groupId}")

    #     elif form.errors:
    #         print(form.errors)
    #         return render_template(
    #             "event_form.html",
    #             form=form,
    #             type="update",
    #             id=groupId,
    #             eventId=eventId,
    #             errors=form.errors,
    #         )

    #     else:
    #         current_data = Group.query.get(groupId)
    #         print(current_data)
    #         form.process(obj=current_data)
    #         return render_template(
    #             "event_form.html",
    #             form=form,
    #             type="update",
    #             id=groupId,
    #             eventId=eventId,
    #             errors=None,
    #         )

    return form.errors, 400


# ! GROUP - VENUES


@group_routes.route("/<int:groupId>/venues", methods=["GET", "POST"])
@login_required
def create_venue(groupId):
    """
    Create a venue linked to a group and submit to the database

    renders an empty form on get requests, validates and submits form on post requests

    The commented out code was to test if the post request works
    """
    # query for the group you want to add the venue to
    group = Group.query.get(groupId)

    # check if there is a group
    if not group:
        return {"errors": {"message": "Not Found"}}, 404

    # check if current user is group organizer - group organizer is only allowed to update
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
        return redirect("/api/venues/")
    #   return new_venue.to_dict()
    if form.errors:
        print(form.errors)
        return render_template(
            "venue_form.html", id=groupId, form=form, errors=form.errors
        )
    return render_template("venue_form.html", id=groupId, form=form, errors=None)


#     return form.errors, 400


# ! GROUP - MEMBERS
@group_routes.route("/<int:groupId>/join-group", methods=["POST"])
@login_required
def join_group(groupId):
    group = Group.query.get(groupId)

    if not group:
        return {"errors": {"message": "Not Found"}}, 404

    # Prevent the organizer from joining as a member
    if group.organizer_id == current_user.id:
        return {"message": "User is the organizer of the group"}, 403

    # Check if the user is already a member of the group
    membership = Memberships.query.filter_by(
        group_id=groupId, user_id=current_user.id
    ).first()

    if membership:
        return {"message": "Already a member of this group"}, 400

    new_membership = Memberships(group_id=group.id, user_id=current_user.id)
    db.session.add(new_membership)
    db.session.commit()

    return {"message": "Successfully joined the group"}, 200


@group_routes.route("/<int:groupId>/leave-group/<int:memberId>", methods=["DELETE"])
@login_required
def leave_group(groupId, memberId):
    group = Group.query.get(groupId)

    if not group:
        return {"errors": {"message": "Group not found"}}, 404

    # Check if the user to be removed is a member of the group
    member = Memberships.query.filter_by(group_id=groupId, user_id=memberId).first()

    if not member:
        return {"message": "User is not a member of this group"}, 400

    # If the current user is trying to leave the group
    if memberId == current_user.id:
        if group.organizer_id == current_user.id:
            return {"message": "The organizer cannot leave their own group"}, 403

        db.session.delete(member)
        db.session.commit()
        return {"message": "You have successfully left the group"}, 200

    # If the current user is trying to remove another member
    if group.organizer_id != current_user.id:
        return {"message": "Only the organizer can remove members"}, 403

    if memberId == group.organizer_id:
        return {"message": "The organizer cannot be removed from the group"}, 400

    db.session.delete(member)
    db.session.commit()
    return {"message": "Member successfully removed from the group"}, 200
