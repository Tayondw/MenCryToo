from flask import Blueprint, request, abort
from flask_login import login_required, current_user
from app.models import db, Group, GroupImage, User, Memberships, Attendances, Venue, Event, EventImage

group_routes = Blueprint("groups", __name__)

@group_routes.route("/")
def all_groups():
      groups = Group.query.all()
      return {"groups": [group.to_dict() for group in groups]}