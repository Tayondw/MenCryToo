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

