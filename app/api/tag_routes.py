from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.models import db, User, Tag
from sqlalchemy.orm import load_only

tag_routes = Blueprint("tags", __name__)


@tag_routes.route("")
def tags():
    """
    Query for all tags and returns them in a list of tag dictionaries - optimized with caching consideration
    """
    # Since tags are relatively static, we can load them efficiently
    # Consider adding Redis caching here in production for even better performance
    tags = Tag.query.options(load_only("id", "name")).order_by(Tag.name).all()

    return jsonify({"tags": [tag.to_dict() for tag in tags]})


@tag_routes.route("/<int:tagId>")
def tag_detail(tagId):
    """
    Query for a tag by id and returns that tag in a dictionary - optimized with selective loading
    """
    tag = Tag.query.options(load_only("id", "name")).filter_by(id=tagId).first()

    if not tag:
        return jsonify({"errors": {"message": "Tag not found"}}), 404

    return jsonify(tag.to_dict())


@tag_routes.route("/popular")
def popular_tags():
    """
    Get most popular tags based on user usage - optimized query
    """
    limit = request.args.get("limit", 10, type=int)
    limit = min(limit, 50)  # Cap at 50 for performance

    # Get popular tags by counting users
    popular_tags = (
        db.session.query(Tag, db.func.count(Tag.tags_users).label("user_count"))
        .join(Tag.tags_users)
        .group_by(Tag.id)
        .order_by(db.func.count(Tag.tags_users).desc())
        .limit(limit)
        .all()
    )

    result = []
    for tag, count in popular_tags:
        tag_dict = tag.to_dict()
        tag_dict["user_count"] = count
        result.append(tag_dict)

    return jsonify({"popular_tags": result})


@tag_routes.route("/search")
def search_tags():
    """
    Search tags by name - optimized with ILIKE for case-insensitive search
    """
    query = request.args.get("q", "").strip()
    limit = request.args.get("limit", 20, type=int)
    limit = min(limit, 50)  # Cap for performance

    if not query:
        return jsonify({"tags": []})

    # Case-insensitive search
    tags = (
        Tag.query.options(load_only("id", "name"))
        .filter(Tag.name.ilike(f"%{query}%"))
        .order_by(Tag.name)
        .limit(limit)
        .all()
    )

    return jsonify({"tags": [tag.to_dict() for tag in tags]})


@tag_routes.route("/user/<int:userId>")
@login_required
def user_tags(userId):
    """
    Get tags for a specific user - optimized query
    """
    user = User.query.options(load_only("id", "username")).filter_by(id=userId).first()

    if not user:
        return jsonify({"errors": {"message": "User not found"}}), 404

    # Get user's tags efficiently
    user_tags = (
        db.session.query(Tag)
        .join(Tag.tags_users)
        .filter(Tag.tags_users.any(id=userId))
        .options(load_only("id", "name"))
        .order_by(Tag.name)
        .all()
    )

    return jsonify(
        {
            "user_id": userId,
            "username": user.username,
            "tags": [tag.to_dict() for tag in user_tags],
        }
    )


# from flask import Blueprint, jsonify
# from flask_login import login_required, current_user
# from app.models import db, User, Tag

# tag_routes = Blueprint("tags", __name__)


# @tag_routes.route("/")
# def tags():
#     """
#     Query for all tags and returns them in a list of tag dictionaries
#     """
#     tags = Tag.query.all()
#     return jsonify({"tags": [tag.to_dict() for tag in tags]})


# @tag_routes.route("/<int:tagId>")
# def user(tagId):
#     """
#     Query for a tag by id and returns that tag in a dictionary
#     """
#     tag = Tag.query.get(tagId)
#     return jsonify(tag.to_dict())
