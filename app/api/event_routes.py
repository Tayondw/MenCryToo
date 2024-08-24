from flask import Blueprint, request, abort, render_template
from flask_login import login_required, current_user
from app.models import (
    db,
    Group,
    User,
    Memberships,
    Attendances,
    Venue,
    Event,
    EventImage,
)

from app.forms import EventForm, EventImageForm
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3

event_routes = Blueprint("events", __name__)


# ! EVENTS
@event_routes.route("/")
def all_events():
    """
    Query for all events and returns them in a list of user dictionaries
    """
    events = Event.query.all()
    return {"events": [event.to_dict() for event in events]}


@event_routes.route("/<int:eventId>")
def event(eventId):
    """
    Query for event by id and returns that event in a dictionary
    """

    event = Event.query.get(eventId)
    return event.to_dict()


@event_routes.route("/<int:eventId>", methods=["DELETE"])
@login_required
def delete_event(eventId):
    """
    will delete a given event by its id

    Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

    Returns 404 Not Found if the group or event is not in the database

    The commented out code was to test if the delete request works
    """
    event_to_delete = Event.query.get(eventId)
    group = Group.query.get(event_to_delete.group_id)

    # check if there is an event to delete
    if not event_to_delete:
        return {"errors": {"message": "Not Found"}}, 404

    # check if current user is group organizer - group organizer is only allowed to update
    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    # Delete associated event images
    EventImage.query.filter_by(event_id=eventId).delete()

    db.session.delete(event_to_delete)
    db.session.commit()
    return {"message": "Event deleted"}


# ! EVENT IMAGES
@event_routes.route("/<int:eventId>/images", methods=["GET", "POST"])
@login_required
def add_event_image(eventId):
    """
    will add an event image by the event's id

    Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

    Returns 404 Not Found if the event or image is not in the database

    The commented out code was to test if the post request works
    """

    # check if there is an event to add the image to
    event = Event.query.get(eventId)
    group = Group.query.get(event.group_id)

    if not event:
        return {"errors": {"message": "Not Found"}}, 404

    # check if current user is group organizer - group organizer is only allowed to update
    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = EventImageForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        event_image = form.event_image.data

        if event_image:
            event_image.filename = get_unique_filename(event_image.filename)
            upload = upload_file_to_s3(event_image)

            if "url" not in upload:
                # if the dictionary doesn't have a url key
                # it means that there was an error when you tried to upload
                # so you send back that error message (and you printed it above)
                return {"message": "unable to locate url"}

            url = upload["url"]
            new_event_image = EventImage(event_id=eventId, event_image=url)
            db.session.add(new_event_image)
            db.session.commit()
            return {"event_image": new_event_image.to_dict()}, 201
        else:
            return {"message": "Event image is None"}

    #     if form.errors:
    #         print(form.errors)
    #         return render_template(
    #             "event_image_form.html", form=form, id=eventId, errors=form.errors
    #         )
    #     return render_template("event_image_form.html", form=form, id=eventId, errors=None)

    return form.errors, 400


@event_routes.route("/<int:eventId>/images/<int:imageId>/edit", methods=["GET", "POST"])
@login_required
def edit_event_images(eventId, imageId):
    """
    will generate an update event image form on get requests and validate/save on post requests

    Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

    Returns 404 Not Found if the group is not in the database or if the group image is not found in the database

    The commented out code was to test if the post request works
    """

    event_image = EventImage.query.get(imageId)

    event = Event.query.get(eventId)

    group = Group.query.get(event.group_id)

    # check if there is event
    if not event:
        return {"errors": {"message": "Not Found"}}, 404

    # check if there is a event image to edit
    if not event_image:
        return {"errors": {"message": "Not Found"}}, 404

    # check if current user is group organizer - group organizer is only allowed to update
    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = EventImageForm()
    if form.validate_on_submit():
        edit_event_image = form.data["event_image"] or edit_event_image.group_image
        edit_event_image.filename = get_unique_filename(edit_event_image.filename)
        upload = upload_file_to_s3(edit_event_image)

        if "url" not in upload:
            return {"message": "Upload failed"}, 400

        # Remove the old image from S3
        remove_file_from_s3(event_image.event_image)

        event_image.event_image = upload["url"]
        db.session.commit()
        return {"event_image": event_image.to_dict()}, 200
    # return {"message": "Image updated successfully"}

    return form.errors, 400


#     return render_template(
#         "event_image_form.html",
#         form=form,
#         type="update",
#         eventId=eventId,
#         event_image=event_image,
#     )
