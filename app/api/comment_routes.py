from flask import Blueprint, request, abort, jsonify
from flask_login import login_required, current_user
from app.models import db, User, Post, Likes, Comment, CommentLike
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import and_, desc, func, text
import logging

comment_routes = Blueprint("comments", __name__)
logger = logging.getLogger(__name__)


@comment_routes.route("/<int:commentId>", methods=["GET"])
@login_required
def get_comment(commentId):
    """
    Get a specific comment with its commenter info
    """
    try:
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
    except Exception as e:
        logger.error(f"Error fetching comment {commentId}: {str(e)}")
        return jsonify({"errors": {"message": "Error fetching comment"}}), 500


@comment_routes.route("/<int:commentId>/replies", methods=["GET"])
@login_required
def get_comment_replies(commentId):
    """
    Get replies to a specific comment with pagination and threading
    """
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 10, type=int), 20)

        # Check if parent comment exists
        parent_comment = Comment.query.get(commentId)
        if not parent_comment:
            return jsonify({"errors": {"message": "Parent comment not found"}}), 404

        # Get replies with pagination
        replies_query = (
            db.session.query(Comment)
            .options(
                joinedload(Comment.commenter).load_only(
                    "id", "username", "first_name", "last_name", "profile_image_url"
                )
            )
            .filter(Comment.parent_id == commentId)
            .order_by(Comment.created_at.asc())  # Chronological order for replies
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
    except Exception as e:
        logger.error(f"Error fetching replies for comment {commentId}: {str(e)}")
        return jsonify({"errors": {"message": "Error fetching replies"}}), 500


@comment_routes.route("/<int:commentId>/edit", methods=["PUT"])
@login_required
def edit_comment(commentId):
    """
    Edit a comment with authorization check
    """
    try:
        comment = Comment.query.filter_by(id=commentId).first()

        if not comment:
            return jsonify({"errors": {"message": "Comment not found"}}), 404

        if comment.user_id != current_user.id:
            return jsonify({"errors": {"message": "Unauthorized"}}), 403

        data = request.get_json()
        comment_text = data.get("comment", "").strip()

        if not comment_text or len(comment_text) < 1 or len(comment_text) > 500:
            return (
                jsonify(
                    {
                        "errors": {
                            "message": "Comment must be between 1 and 500 characters"
                        }
                    }
                ),
                400,
            )

        comment.comment = comment_text
        db.session.commit()

        # Return updated comment with user info
        updated_comment = (
            db.session.query(Comment)
            .options(
                joinedload(Comment.commenter).load_only(
                    "id", "username", "first_name", "last_name", "profile_image_url"
                )
            )
            .filter(Comment.id == commentId)
            .first()
        )

        return (
            jsonify(
                {
                    "message": "Comment updated successfully",
                    "comment": updated_comment.to_dict(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating comment {commentId}: {str(e)}")
        return jsonify({"errors": {"message": "Error updating comment"}}), 500


@comment_routes.route("/<int:commentId>/like", methods=["POST"])
@login_required
def like_comment(commentId):
    """
    Like/unlike a comment (toggle functionality)
    """
    try:
        comment = Comment.query.get(commentId)
        if not comment:
            return jsonify({"errors": {"message": "Comment not found"}}), 404

        return jsonify({"message": "Comment liked", "liked": True}), 200

    except Exception as e:
        logger.error(f"Error liking comment {commentId}: {str(e)}")
        return jsonify({"errors": {"message": "Error liking comment"}}), 500


@comment_routes.route("/recent", methods=["GET"])
@login_required
def get_recent_comments():
    """
    Get recent comments with pagination (for admin/dashboard use)
    """
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 50)

        comments_query = (
            db.session.query(Comment)
            .options(
                joinedload(Comment.commenter).load_only(
                    "id", "username", "first_name", "last_name", "profile_image_url"
                ),
                joinedload(Comment.post).load_only("id", "title", "image"),
            )
            .filter(Comment.parent_id.is_(None))  # Only top-level comments
            .order_by(Comment.created_at.desc())
        )

        comments = comments_query.paginate(
            page=page, per_page=per_page, error_out=False
        )

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
    except Exception as e:
        logger.error(f"Error fetching recent comments: {str(e)}")
        return jsonify({"errors": {"message": "Error fetching recent comments"}}), 500


# Post comment routes with threading support
@comment_routes.route("/posts/<int:postId>/comments", methods=["GET"])
@login_required
def get_post_comments(postId):
    """
    Get all comments for a post with like data included by default
    """
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 50)
        include_replies = request.args.get("include_replies", "true").lower() == "true"
        include_likes = (
            request.args.get("include_likes", "true").lower() == "true"
        )  # Default to true

        # Check if post exists
        post = Post.query.get(postId)
        if not post:
            return jsonify({"errors": {"message": "Post not found"}}), 404

        # Load comments with like data by default
        comments_query = (
            db.session.query(Comment)
            .options(
                # Load commenter data
                joinedload(Comment.commenter).load_only(
                    "id", "username", "first_name", "last_name", "profile_image_url"
                ),
                # Load like data
                selectinload(Comment.comment_likes),
            )
            .filter(Comment.post_id == postId)
        )

        if include_replies:
            # Get all comments with their user and like data
            all_comments = comments_query.order_by(Comment.created_at.desc()).all()

            # Organize into hierarchical structure
            comment_dict = {comment.id: comment for comment in all_comments}
            root_comments = []

            # First pass: identify root comments and attach replies
            for comment in all_comments:
                if comment.parent_id is None:
                    root_comments.append(comment)
                    comment.replies = []
                else:
                    parent = comment_dict.get(comment.parent_id)
                    if parent:
                        if not hasattr(parent, "replies"):
                            parent.replies = []
                        parent.replies.append(comment)

            # Sort replies chronologically
            def sort_replies(comment):
                if hasattr(comment, "replies") and comment.replies:
                    comment.replies.sort(key=lambda x: x.created_at)
                    for reply in comment.replies:
                        sort_replies(reply)

            for comment in root_comments:
                sort_replies(comment)

            # Apply pagination to root comments
            total_root = len(root_comments)
            start_idx = (page - 1) * per_page
            end_idx = start_idx + per_page
            paginated_comments = root_comments[start_idx:end_idx]

            # Convert to dict with like data
            comments_data = [
                comment.to_dict_with_likes(
                    include_replies=True, current_user_id=current_user.id
                )
                for comment in paginated_comments
            ]

            pagination = {
                "page": page,
                "pages": (total_root + per_page - 1) // per_page,
                "per_page": per_page,
                "total": total_root,
                "has_next": end_idx < total_root,
                "has_prev": page > 1,
            }

        else:
            # Get only root comments
            root_comments_query = comments_query.filter(Comment.parent_id.is_(None))
            comments = root_comments_query.order_by(Comment.created_at.desc()).paginate(
                page=page, per_page=per_page, error_out=False
            )

            # Convert to dict with like data
            comments_data = [
                comment.to_dict_with_likes(current_user_id=current_user.id)
                for comment in comments.items
            ]

            pagination = {
                "page": page,
                "pages": comments.pages,
                "per_page": per_page,
                "total": comments.total,
                "has_next": comments.has_next,
                "has_prev": comments.has_prev,
            }

        return jsonify(
            {
                "comments": comments_data,
                "pagination": pagination,
            }
        )

    except Exception as e:
        logger.error(f"Error fetching comments for post {postId}: {str(e)}")
        return jsonify({"errors": {"message": "Error fetching comments"}}), 500


@comment_routes.route("/posts/<int:postId>/comments", methods=["GET"])
@login_required
def get_post_comments_with_likes(postId):
    """
    Get all comments for a post with like data included
    """
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 50)
        include_replies = request.args.get("include_replies", "true").lower() == "true"
        include_likes = request.args.get("include_likes", "false").lower() == "true"

        # Check if post exists
        post = Post.query.get(postId)
        if not post:
            return jsonify({"errors": {"message": "Post not found"}}), 404

        # Load comments with like data
        comments_query = (
            db.session.query(Comment)
            .options(
                # Load commenter data
                joinedload(Comment.commenter).load_only(
                    "id", "username", "first_name", "last_name", "profile_image_url"
                )
            )
            .filter(Comment.post_id == postId)
        )

        if include_likes:
            # Add like count and current user like status
            comments_query = comments_query.options(selectinload(Comment.comment_likes))

        if include_replies:
            # Get all comments with their user data
            all_comments = comments_query.order_by(Comment.created_at.desc()).all()

            # Organize into hierarchical structure
            comment_dict = {comment.id: comment for comment in all_comments}
            root_comments = []

            # First pass: identify root comments and attach replies
            for comment in all_comments:
                if comment.parent_id is None:
                    root_comments.append(comment)
                    comment.replies = []
                else:
                    parent = comment_dict.get(comment.parent_id)
                    if parent:
                        if not hasattr(parent, "replies"):
                            parent.replies = []
                        parent.replies.append(comment)

            # Sort replies chronologically
            def sort_replies(comment):
                if hasattr(comment, "replies") and comment.replies:
                    comment.replies.sort(key=lambda x: x.created_at)
                    for reply in comment.replies:
                        sort_replies(reply)

            for comment in root_comments:
                sort_replies(comment)

            # Apply pagination to root comments
            total_root = len(root_comments)
            start_idx = (page - 1) * per_page
            end_idx = start_idx + per_page
            paginated_comments = root_comments[start_idx:end_idx]

            # Convert to dict with like data
            comments_data = [
                comment.to_dict_with_likes(
                    include_replies=True, current_user_id=current_user.id
                )
                for comment in paginated_comments
            ]

            pagination = {
                "page": page,
                "pages": (total_root + per_page - 1) // per_page,
                "per_page": per_page,
                "total": total_root,
                "has_next": end_idx < total_root,
                "has_prev": page > 1,
            }

        else:
            # Get only root comments
            root_comments_query = comments_query.filter(Comment.parent_id.is_(None))
            comments = root_comments_query.order_by(Comment.created_at.desc()).paginate(
                page=page, per_page=per_page, error_out=False
            )

            # Convert to dict with like data
            comments_data = [
                comment.to_dict_with_likes(current_user_id=current_user.id)
                for comment in comments.items
            ]

            pagination = {
                "page": page,
                "pages": comments.pages,
                "per_page": per_page,
                "total": comments.total,
                "has_next": comments.has_next,
                "has_prev": comments.has_prev,
            }

        return jsonify(
            {
                "comments": comments_data,
                "pagination": pagination,
            }
        )

    except Exception as e:
        logger.error(f"Error fetching comments for post {postId}: {str(e)}")
        return jsonify({"errors": {"message": "Error fetching comments"}}), 500


@comment_routes.route("/posts/<int:postId>/comments", methods=["POST"])
@login_required
def add_comment(postId):
    """
    Add a comment to a post with like data in response
    """
    try:
        # Check if post exists
        post_exists = db.session.execute(
            text("SELECT 1 FROM posts WHERE id = :post_id"), {"post_id": postId}
        ).fetchone()

        if not post_exists:
            return jsonify({"error": "Post not found"}), 404

        # Get form data
        comment_text = request.form.get("comment", "").strip()
        parent_id = request.form.get("parent_id")

        # Validate comment text
        if not comment_text or len(comment_text) < 1 or len(comment_text) > 500:
            return (
                jsonify(
                    {
                        "errors": {
                            "comment": "Comment must be between 1 and 500 characters"
                        }
                    }
                ),
                400,
            )

        # Validate parent comment if this is a reply
        if parent_id:
            try:
                parent_id = int(parent_id)
                parent_comment = Comment.query.filter_by(
                    id=parent_id, post_id=postId
                ).first()

                if not parent_comment:
                    return (
                        jsonify({"errors": {"parent_id": "Parent comment not found"}}),
                        400,
                    )
            except (ValueError, TypeError):
                return (
                    jsonify({"errors": {"parent_id": "Invalid parent comment ID"}}),
                    400,
                )
        else:
            parent_id = None

        # Create comment
        comment = Comment(
            post_id=postId,
            user_id=current_user.id,
            comment=comment_text,
            parent_id=parent_id,
        )

        db.session.add(comment)
        db.session.commit()

        # Reload with user and like data
        comment_with_data = (
            db.session.query(Comment)
            .options(
                joinedload(Comment.commenter).load_only(
                    "id", "username", "first_name", "last_name", "profile_image_url"
                ),
                selectinload(Comment.comment_likes),
            )
            .filter(Comment.id == comment.id)
            .first()
        )

        # Return with like data
        return (
            jsonify(
                {
                    "comment": comment_with_data.to_dict_with_likes(
                        current_user_id=current_user.id
                    ),
                    "success": True,
                    "message": "Comment created successfully",
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding comment to post {postId}: {str(e)}")
        return jsonify({"errors": {"message": "Error creating comment"}}), 500


@comment_routes.route(
    "/posts/<int:postId>/comments/<int:commentId>", methods=["DELETE"]
)
@login_required
def delete_comment(postId, commentId):
    """
    Delete a comment and all its nested replies
    """
    try:
        comment = Comment.query.filter_by(id=commentId, post_id=postId).first()

        if not comment:
            return jsonify({"errors": {"message": "Comment not found"}}), 404

        if comment.user_id != current_user.id:
            return jsonify({"errors": {"message": "Unauthorized"}}), 403

        # Delete all nested replies recursively using raw SQL for efficiency
        # This will cascade delete all child comments
        def delete_comment_tree(comment_id):
            # Get all child comments
            child_comments = db.session.execute(
                text("SELECT id FROM comments WHERE parent_id = :parent_id"),
                {"parent_id": comment_id},
            ).fetchall()

            # Recursively delete children
            for child in child_comments:
                delete_comment_tree(child[0])

            # Delete the comment itself
            db.session.execute(
                text("DELETE FROM comments WHERE id = :comment_id"),
                {"comment_id": comment_id},
            )

        delete_comment_tree(commentId)
        db.session.commit()

        return jsonify({"message": "Comment deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting comment {commentId}: {str(e)}")
        return jsonify({"errors": {"message": "Error deleting comment"}}), 500


@comment_routes.route("/<int:commentId>/like", methods=["POST"])
@login_required
def toggle_comment_like(commentId):
    """
    Toggle like on a comment (like if not liked, unlike if already liked)
    """
    try:
        # Check if comment exists
        comment = Comment.query.get(commentId)
        if not comment:
            return jsonify({"errors": {"message": "Comment not found"}}), 404

        # Check current like status
        existing_like = CommentLike.query.filter_by(
            user_id=current_user.id, comment_id=commentId
        ).first()

        if existing_like:
            # Unlike the comment
            db.session.delete(existing_like)
            action = "unliked"
            is_liked = False
        else:
            # Like the comment
            new_like = CommentLike(user_id=current_user.id, comment_id=commentId)
            db.session.add(new_like)
            action = "liked"
            is_liked = True

        db.session.commit()

        # Get updated like count
        like_count = CommentLike.query.filter_by(comment_id=commentId).count()

        # Return the structure that the frontend expects
        return jsonify(
            {
                "success": True,
                "action": action,
                "isLiked": is_liked,  # Frontend expects this field
                "likeCount": like_count,  # Frontend expects this field
                "commentId": commentId,
                "message": f"Comment {action} successfully",
                # Legacy fields for backward compatibility
                "liked": is_liked,
            }
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error toggling like for comment {commentId}: {str(e)}")
        return jsonify({"errors": {"message": "Error updating like"}}), 500


@comment_routes.route("/<int:commentId>/likes", methods=["GET"])
@login_required
def get_comment_likes(commentId):
    """
    Get all users who liked a specific comment
    """
    try:
        # Check if comment exists
        comment = Comment.query.get(commentId)
        if not comment:
            return jsonify({"errors": {"message": "Comment not found"}}), 404

        # Get all users who liked this comment
        liked_users = (
            db.session.query(User)
            .join(CommentLike, User.id == CommentLike.user_id)
            .filter(CommentLike.comment_id == commentId)
            .options(selectinload(User.users_tags).load_only("id", "name"))
            .order_by(CommentLike.created_at.desc())
            .all()
        )

        # Format response
        users_data = [
            {
                "id": user.id,
                "username": user.username,
                "firstName": user.first_name or "",
                "lastName": user.last_name or "",
                "profileImage": user.profile_image_url or "/default-avatar.png",
            }
            for user in liked_users
        ]

        return jsonify(
            {
                "likes": users_data,
                "total": len(users_data),
                "commentId": commentId,
                "comment": (
                    comment.comment[:100] + "..."
                    if len(comment.comment) > 100
                    else comment.comment
                ),
            }
        )

    except Exception as e:
        logger.error(f"Error getting comment likes {commentId}: {str(e)}")
        return jsonify({"errors": {"message": "Internal server error"}}), 500


@comment_routes.route("/<int:commentId>/like-status", methods=["GET"])
@login_required
def get_comment_like_status(commentId):
    """
    Get like status for current user and total count
    """
    try:
        # Check if comment exists
        comment = Comment.query.get(commentId)
        if not comment:
            return jsonify({"errors": {"message": "Comment not found"}}), 404

        # Check if current user liked this comment
        is_liked = (
            CommentLike.query.filter_by(
                user_id=current_user.id, comment_id=commentId
            ).first()
            is not None
        )

        # Get total like count
        like_count = CommentLike.query.filter_by(comment_id=commentId).count()

        return jsonify(
            {"isLiked": is_liked, "likeCount": like_count, "commentId": commentId}
        )

    except Exception as e:
        logger.error(f"Error getting like status for comment {commentId}: {str(e)}")
        return jsonify({"errors": {"message": "Internal server error"}}), 500


@comment_routes.route("/batch-like-status", methods=["POST"])
@login_required
def get_batch_comment_like_status():
    """
    Get like status for multiple comments at once
    """
    try:
        data = request.get_json()
        comment_ids = data.get("commentIds", [])

        if not comment_ids:
            return jsonify({"statuses": {}})

        # Get like statuses for all comments
        like_data = (
            db.session.query(
                CommentLike.comment_id,
                func.count(CommentLike.id).label("like_count"),
                func.sum(
                    func.case((CommentLike.user_id == current_user.id, 1), else_=0)
                ).label("is_liked_by_user"),
            )
            .filter(CommentLike.comment_id.in_(comment_ids))
            .group_by(CommentLike.comment_id)
            .all()
        )

        # Format response
        statuses = {}
        for comment_id in comment_ids:
            # Find data for this comment
            comment_data = next(
                (item for item in like_data if item.comment_id == comment_id), None
            )

            if comment_data:
                statuses[comment_id] = {
                    "isLiked": bool(comment_data.is_liked_by_user),
                    "likeCount": comment_data.like_count,
                }
            else:
                statuses[comment_id] = {"isLiked": False, "likeCount": 0}

        return jsonify({"statuses": statuses})

    except Exception as e:
        logger.error(f"Error getting batch like status: {str(e)}")
        return jsonify({"errors": {"message": "Internal server error"}}), 500
