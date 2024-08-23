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

group_routes = Blueprint("groups", __name__)


@group_routes.route("/")
def all_groups():
    """
    Query for all groups and returns them in a list of user dictionaries
    """
    groups = Group.query.all()
    return {"groups": [group.to_dict() for group in groups]}


@group_routes.route("/<int:group_id>")
def group(group_id):
    """
    Query for group by id and returns that group in a dictionary
    """
    group = Group.query.get(group_id)
    return group.to_dict()
