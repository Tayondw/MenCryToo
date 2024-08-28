from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from app.models import db, User, Tag

tag_routes = Blueprint("tags", __name__)


@tag_routes.route("/")
def tags():
    """
    Query for all tags and returns them in a list of tag dictionaries
    """
    tags = Tag.query.all()
    return jsonify({"tags": [tag.to_dict() for tag in tags]})


@tag_routes.route("/<int:tagId>")
def user(tagId):
    """
    Query for a tag by id and returns that tag in a dictionary
    """
    tag = Tag.query.get(tagId)
    return jsonify(tag.to_dict())
