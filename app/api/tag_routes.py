from flask import Blueprint, request, abort
from flask_login import login_required, current_user
from app.models import db, User, Tag

tag_routes = Blueprint("tags", __name__)
