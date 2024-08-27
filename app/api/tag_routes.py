from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from app.models import db, User, Tag

tag_routes = Blueprint("tags", __name__)


@tag_routes.route("/")
@login_required
def tags():
    """
    Query for all tags and returns them in a list of user dictionaries
    """
    tags = Tag.query.all()
    return jsonify({"tags": [tag.to_dict() for tag in tags]})
