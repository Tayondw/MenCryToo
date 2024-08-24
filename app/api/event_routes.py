from flask import Blueprint, request, abort
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

    Returns 404 Not Found if the group is not in the database

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
