from flask import Blueprint, request, abort
from flask_login import login_required, current_user
from app.models import (
    db,
    Group,
    User,
    Memberships,
    Venue,
)

from app.forms import VenueForm

venue_routes = Blueprint("venues", __name__)


@venue_routes.route("/")
def all_venues():
    """
    Query for all venues and returns them in a list of venue dictionaries
    """
    venues = Venue.query.all()
    if not venues:
        return {"errors": {"message": "Not Found"}}, 404
    return {"venues": [venue.to_dict() for venue in venues]}


@venue_routes.route("/<int:venueId>")
def venue(venueId):
    """
    Query for a venue by id and returns that venue in a dictionary
    """
    venue = Venue.query.get(venueId)
    if not venue:
        return {"errors": {"message": "Not Found"}}, 404
    return venue.to_dict()

