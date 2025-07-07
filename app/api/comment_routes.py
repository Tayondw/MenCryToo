from flask import Blueprint, request, abort, jsonify
from flask_login import login_required, current_user
from app.models import db, User, Post, Likes, Comment
from sqlalchemy.orm import joinedload
from sqlalchemy import and_

comment_routes = Blueprint("comments", __name__)


@comment_routes.route("/<int:commentId>", methods=["GET"])
@login_required
def get_comment(commentId):
    """
    Get a specific comment with loading
    """
    comment = (
        db.session.query(Comment)
        .options(
            joinedload(Comment.commenter).load_only(
                "id", "username", "first_name", "last_name", "profile_image_url"
            )
        )
        .filter(Comment.id == commentId)
        .first()
    )

    if not comment:
        return jsonify({"errors": {"message": "Comment not found"}}), 404

    return jsonify(comment.to_dict())


@comment_routes.route("/<int:commentId>/replies", methods=["GET"])
@login_required
def get_comment_replies(commentId):
    """
    Get replies to a specific comment with pagination
    """
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 10, type=int), 20)

    replies_query = (
        db.session.query(Comment)
        .options(
            joinedload(Comment.commenter).load_only(
                "id", "username", "profile_image_url"
            )
        )
        .filter(Comment.parent_id == commentId)
        .order_by(Comment.created_at.asc())
    )

    replies = replies_query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "replies": [reply.to_dict() for reply in replies.items],
            "pagination": {
                "page": page,
                "pages": replies.pages,
                "per_page": per_page,
                "total": replies.total,
                "has_next": replies.has_next,
                "has_prev": replies.has_prev,
            },
        }
    )


@comment_routes.route("/<int:commentId>/edit", methods=["PUT"])
@login_required
def edit_comment(commentId):
    """
    Edit a comment with minimal response
    """
    comment = Comment.query.filter_by(id=commentId).first()

    if not comment:
        return jsonify({"errors": {"message": "Comment not found"}}), 404

    if comment.user_id != current_user.id:
        return jsonify({"errors": {"message": "Unauthorized"}}), 403

    data = request.get_json()
    comment_text = data.get("comment", "").strip()

    if not comment_text or len(comment_text) < 1 or len(comment_text) > 255:
        return (
            jsonify(
                {"errors": {"message": "Comment must be between 1 and 255 characters"}}
            ),
            400,
        )

    try:
        comment.comment = comment_text
        db.session.commit()

        return (
            jsonify(
                {
                    "message": "Comment updated successfully",
                    "comment": comment.to_dict(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"errors": {"message": "Error updating comment"}}), 500


@comment_routes.route("/<int:commentId>/like", methods=["POST"])
@login_required
def like_comment(commentId):
    """
    Like/unlike a comment (toggle functionality)
    """
    comment = Comment.query.get(commentId)
    if not comment:
        return jsonify({"errors": {"message": "Comment not found"}}), 404

    # Check if user already liked this comment (if you have a likes system for comments)
    # For now, just return success
    return jsonify({"message": "Comment liked"}), 200


@comment_routes.route("/recent", methods=["GET"])
@login_required
def get_recent_comments():
    """
    Get recent comments with minimal data for dashboard/feed
    """
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 50)

    comments_query = (
        db.session.query(Comment)
        .options(
            joinedload(Comment.commenter).load_only(
                "id", "username", "profile_image_url"
            ),
            joinedload(Comment.post).load_only("id", "title", "image"),
        )
        .filter(Comment.parent_id.is_(None))  # Only top-level comments
        .order_by(Comment.created_at.desc())
    )

    comments = comments_query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "comments": [comment.to_dict() for comment in comments.items],
            "pagination": {
                "page": page,
                "pages": comments.pages,
                "per_page": per_page,
                "total": comments.total,
                "has_next": comments.has_next,
                "has_prev": comments.has_prev,
            },
        }
    )
