from flask import Blueprint, request, abort
from flask_login import login_required, current_user
from app.models import (
    db,
    Group,
    User,
    Memberships,
    Event,
    EventImage,
)

event_image_routes = Blueprint("event_images", __name__)
