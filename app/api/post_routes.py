from flask import Blueprint, request, abort, redirect, render_template, jsonify
from flask_login import login_required, current_user
from app.models import db, User, Post, Comment, Likes, UserTags
from app.forms import PostForm, CommentForm
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3
from sqlalchemy.orm import joinedload, selectinload, load_only
from sqlalchemy import desc, func, text, and_
import logging
import app

post_routes = Blueprint("posts", __name__)

# Configure logging
logger = logging.getLogger(__name__)


# ! POSTS
@post_routes.route("/feed")
@login_required
def all_posts():
    """
    Posts feed with pagination, caching, and minimal data loading
    """
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 50)

        # Get current user's tag IDs in a single query
        current_user_tag_ids = (
            db.session.query(db.text("tag_id"))
            .from_text("user_tags")
            .filter(db.text("user_id = :user_id"))
            .params(user_id=current_user.id)
            .all()
        )
        current_user_tag_ids = (
            [row[0] for row in current_user_tag_ids] if current_user_tag_ids else []
        )

        if current_user_tag_ids:
            # Use raw SQL for better performance on large datasets
            posts_query = (
                db.session.query(Post)
                .join(User, Post.creator == User.id)
                .join(db.text("user_tags ON users.id = user_tags.user_id"))
                .filter(db.text("user_tags.tag_id IN :tag_ids"))
                .options(
                    joinedload(Post.user).load_only(
                        "id", "username", "first_name", "last_name", "profile_image_url"
                    ),
                    # Don't load relationships here for feed - use counts instead
                )
                .distinct()
                .order_by(desc(Post.created_at))
                .params(tag_ids=tuple(current_user_tag_ids))
            )
        else:
            # Fallback to recent posts if user has no tags
            posts_query = (
                db.session.query(Post)
                .options(
                    joinedload(Post.user).load_only(
                        "id", "username", "first_name", "last_name", "profile_image_url"
                    ),
                )
                .order_by(desc(Post.created_at))
            )

        posts = posts_query.paginate(page=page, per_page=per_page, error_out=False)

        if not posts.items:
            return jsonify({"errors": {"message": "Not Found"}}), 404

        # Batch load like counts for all posts
        post_ids = [post.id for post in posts.items]
        like_counts = {}

        if post_ids:
            like_count_results = db.session.execute(
                text(
                    """
                    SELECT post_id, COUNT(*) as like_count 
                    FROM likes 
                    WHERE post_id IN :post_ids 
                    GROUP BY post_id
                """
                ),
                {"post_ids": tuple(post_ids)},
            ).fetchall()

            like_counts = {row[0]: row[1] for row in like_count_results}

        # Build optimized response
        posts_data = []
        for post in posts.items:
            post_dict = {
                "id": post.id,
                "title": post.title,
                "caption": (
                    post.caption[:100] + "..."
                    if len(post.caption) > 100
                    else post.caption
                ),
                "creator": post.creator,
                "image": post.image,
                "likes": like_counts.get(post.id, 0),
                "createdAt": post.created_at.isoformat() if post.created_at else None,
                "updatedAt": post.updated_at.isoformat() if post.updated_at else None,
                "user": (
                    {
                        "id": post.user.id,
                        "username": post.user.username,
                        "profileImage": post.user.profile_image_url,
                    }
                    if post.user
                    else None
                ),
            }
            posts_data.append(post_dict)

        return jsonify(
            {
                "posts": posts_data,
                "pagination": {
                    "page": page,
                    "pages": posts.pages,
                    "per_page": per_page,
                    "total": posts.total,
                    "has_next": posts.has_next,
                    "has_prev": posts.has_prev,
                },
            }
        )

    except Exception as e:
        logger.error(f"Error in all_posts: {str(e)}")
        return jsonify({"errors": {"message": "Internal server error"}}), 500


@post_routes.route("/<int:postId>")
@login_required
def post(postId):
    """
    Single post view with minimal queries
    """
    try:
        post = (
            db.session.query(Post)
            .options(
                joinedload(Post.user).load_only(
                    "id", "username", "first_name", "last_name", "profile_image_url"
                ),
                selectinload(Post.post_comments)
                .joinedload(Comment.commenter)
                .load_only("id", "username"),
            )
            .filter(Post.id == postId)
            .first()
        )

        if not post:
            return jsonify({"errors": {"message": "Not Found"}}), 404

        # Get like count efficiently
        like_count = (
            db.session.execute(
                text("SELECT COUNT(*) FROM likes WHERE post_id = :post_id"),
                {"post_id": postId},
            ).scalar()
            or 0
        )

        # Build response with optimized data
        post_data = {
            "id": post.id,
            "title": post.title,
            "caption": post.caption,
            "creator": post.creator,
            "image": post.image,
            "likes": like_count,
            "user": (
                {
                    "id": post.user.id,
                    "username": post.user.username,
                    "firstName": post.user.first_name,
                    "lastName": post.user.last_name,
                    "profileImage": post.user.profile_image_url,
                }
                if post.user
                else None
            ),
            "postComments": (
                [
                    {
                        "id": comment.id,
                        "userId": comment.user_id,
                        "postId": comment.post_id,
                        "comment": comment.comment,
                        "username": (
                            comment.commenter.username
                            if comment.commenter
                            else "Unknown"
                        ),
                        "parentId": comment.parent_id,
                        "created_at": (
                            comment.created_at.isoformat()
                            if comment.created_at
                            else None
                        ),
                        "updated_at": (
                            comment.updated_at.isoformat()
                            if comment.updated_at
                            else None
                        ),
                    }
                    for comment in post.post_comments
                ]
                if hasattr(post, "post_comments")
                else []
            ),
            "createdAt": post.created_at.isoformat() if post.created_at else None,
            "updatedAt": post.updated_at.isoformat() if post.updated_at else None,
        }

        return jsonify(post_data)

    except Exception as e:
        logger.error(f"Error in post {postId}: {str(e)}")
        return jsonify({"errors": {"message": "Internal server error"}}), 500


@post_routes.route("/similar-feed")
@login_required
def similar_users_posts_feed():
    """
    Using UserTags table correctly
    """
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 50)

        # Get current user's tags using the relationship
        if not current_user.users_tags:
            return jsonify(
                {
                    "posts": [],
                    "pagination": {
                        "page": 1,
                        "pages": 0,
                        "per_page": per_page,
                        "total": 0,
                        "has_next": False,
                        "has_prev": False,
                    },
                    "message": "Add tags to your profile to discover posts from similar users!",
                }
            )

        # Get tag IDs from the relationship
        user_tag_ids = [tag.id for tag in current_user.users_tags]

        # Find users with similar tags using the Tag model
        from app.models import Tag, User

        # Get all users who have these tags
        similar_users = (
            User.query.join(User.users_tags)
            .filter(
                Tag.id.in_(user_tag_ids),
                User.id != current_user.id,
                User.profile_image_url.isnot(None),
            )
            .distinct()
            .all()
        )

        if not similar_users:
            return jsonify(
                {
                    "posts": [],
                    "pagination": {
                        "page": page,
                        "pages": 0,
                        "per_page": per_page,
                        "total": 0,
                        "has_next": False,
                        "has_prev": False,
                    },
                    "message": "No users found with similar interests.",
                }
            )

        # Get user IDs
        similar_user_ids = [user.id for user in similar_users]

        # Get posts from those users
        posts_query = Post.query.filter(Post.creator.in_(similar_user_ids)).order_by(
            Post.created_at.desc()
        )

        # Paginate
        posts = posts_query.paginate(page=page, per_page=per_page, error_out=False)

        if not posts.items:
            return jsonify(
                {
                    "posts": [],
                    "pagination": {
                        "page": page,
                        "pages": 0,
                        "per_page": per_page,
                        "total": 0,
                        "has_next": False,
                        "has_prev": False,
                    },
                    "message": "No posts found from users with similar interests.",
                }
            )

        # Build response
        posts_data = []
        for post in posts.items:
            post_dict = {
                "id": post.id,
                "title": post.title,
                "caption": post.caption,
                "creator": post.creator,
                "image": post.image,
                "likes": post.get_like_count_optimized(),
                "comments": 0,
                "createdAt": post.created_at.isoformat() if post.created_at else None,
                "updatedAt": post.updated_at.isoformat() if post.updated_at else None,
                "user": {
                    "id": post.user.id if post.user else post.creator,
                    "username": post.user.username if post.user else "Unknown",
                    "firstName": post.user.first_name if post.user else "",
                    "lastName": post.user.last_name if post.user else "",
                    "profileImage": post.user.profile_image_url if post.user else "",
                },
            }
            posts_data.append(post_dict)

        return jsonify(
            {
                "posts": posts_data,
                "pagination": {
                    "page": page,
                    "pages": posts.pages,
                    "per_page": per_page,
                    "total": posts.total,
                    "has_next": posts.has_next,
                    "has_prev": posts.has_prev,
                },
            }
        )

    except Exception as e:
        print(f"ERROR in similar feed alt: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"errors": {"message": str(e)}}), 500

@post_routes.route("/feed-stats")
@login_required
def posts_feed_stats():
    """
    OPTIONAL: Get stats about similar users and available posts
    Useful for showing user insights
    """
    try:
        # Get current user's tags
        current_user_tag_ids = db.session.execute(
            text("SELECT tag_id FROM user_tags WHERE user_id = :user_id"),
            {"user_id": current_user.id},
        ).fetchall()
        current_user_tag_ids = [row[0] for row in current_user_tag_ids]

        if not current_user_tag_ids:
            return jsonify(
                {
                    "similarUsers": 0,
                    "availablePosts": 0,
                    "message": "Add tags to discover similar users",
                }
            )

        # Count similar users
        similar_users_count = (
            db.session.execute(
                text(
                    """
                SELECT COUNT(DISTINCT users.id)
                FROM users 
                JOIN user_tags ON users.id = user_tags.user_id
                WHERE user_tags.tag_id IN :tag_ids 
                AND users.id != :current_user_id
                AND users.profile_image_url IS NOT NULL
            """
                ),
                {
                    "tag_ids": tuple(current_user_tag_ids),
                    "current_user_id": current_user.id,
                },
            ).scalar()
            or 0
        )

        # Count available posts from similar users
        available_posts_count = (
            db.session.execute(
                text(
                    """
                SELECT COUNT(DISTINCT posts.id)
                FROM posts
                JOIN users ON posts.creator = users.id
                JOIN user_tags ON users.id = user_tags.user_id
                WHERE user_tags.tag_id IN :tag_ids 
                AND users.id != :current_user_id
                AND users.profile_image_url IS NOT NULL
            """
                ),
                {
                    "tag_ids": tuple(current_user_tag_ids),
                    "current_user_id": current_user.id,
                },
            ).scalar()
            or 0
        )

        return jsonify(
            {
                "similarUsers": similar_users_count,
                "availablePosts": available_posts_count,
                "userTags": len(current_user_tag_ids),
            }
        )

    except Exception as e:
        logger.error(f"Error getting feed stats: {str(e)}")
        return jsonify({"errors": {"message": "Internal server error"}}), 500


@post_routes.route("/<int:postId>/delete", methods=["DELETE"])
@login_required
def delete_post(postId):
    """
    Post deletion with efficient batch operations
    """
    try:
        post_to_delete = Post.query.get(postId)

        if not post_to_delete:
            return {"errors": {"message": "Not Found"}}, 404

        if current_user.id != post_to_delete.creator:
            return {"errors": {"message": "Unauthorized"}}, 401

        # Use efficient bulk delete operations with raw SQL
        db.session.execute(
            text("DELETE FROM comments WHERE post_id = :post_id"), {"post_id": postId}
        )

        db.session.execute(
            text("DELETE FROM likes WHERE post_id = :post_id"), {"post_id": postId}
        )

        # Remove image from S3 if it exists
        if post_to_delete.image:
            try:
                remove_file_from_s3(post_to_delete.image)
            except Exception as s3_error:
                logger.warning(f"Failed to remove S3 image: {str(s3_error)}")

        db.session.delete(post_to_delete)
        db.session.commit()

        return {"message": "Post deleted successfully"}, 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting post {postId}: {str(e)}")
        return {"errors": {"message": "Error deleting post"}}, 500


# ! POST - COMMENTS
@post_routes.route("/<int:postId>/comments", methods=["GET", "POST"])
@login_required
def add_comment(postId):
    """
    Comment addition with minimal validation overhead
    """
    try:
        # Quick existence check
        post_exists = db.session.execute(
            text("SELECT 1 FROM posts WHERE id = :post_id"), {"post_id": postId}
        ).fetchone()

        if not post_exists:
            return jsonify({"error": "Post not found"}), 404

        form = CommentForm()
        form["csrf_token"].data = request.cookies["csrf_token"]

        if form.validate_on_submit():
            comment = Comment(
                post_id=postId, user_id=current_user.id, comment=form.comment.data
            )

            db.session.add(comment)
            db.session.commit()

            # Return minimal comment data for faster response
            return (
                jsonify(
                    {
                        "id": comment.id,
                        "postId": comment.post_id,
                        "userId": comment.user_id,
                        "comment": comment.comment,
                        "username": current_user.username,
                        "parentId": comment.parent_id,
                        "created_at": (
                            comment.created_at.isoformat()
                            if comment.created_at
                            else None
                        ),
                        "updated_at": (
                            comment.updated_at.isoformat()
                            if comment.updated_at
                            else None
                        ),
                    }
                ),
                201,
            )

        return jsonify({"errors": form.errors}), 400

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding comment to post {postId}: {str(e)}")
        return jsonify({"errors": {"message": "Error creating comment"}}), 500


@post_routes.route("/<int:postId>/comments/<int:commentId>", methods=["DELETE"])
@login_required
def delete_comment(postId, commentId):
    """
    Comment deletion with efficient nested deletion
    """
    try:
        comment = Comment.query.filter_by(id=commentId, post_id=postId).first()

        if not comment:
            return jsonify({"errors": {"message": "Comment not found"}}), 404

        if comment.user_id != current_user.id:
            return jsonify({"errors": {"message": "Unauthorized"}}), 403

        # Delete nested replies efficiently using raw SQL
        db.session.execute(
            text("DELETE FROM comments WHERE parent_id = :comment_id"),
            {"comment_id": commentId},
        )

        db.session.delete(comment)
        db.session.commit()

        return jsonify({"message": "Comment deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting comment {commentId}: {str(e)}")
        return jsonify({"errors": {"message": "Error deleting comment"}}), 500


# ! POST - LIKES
@post_routes.route("/<int:postId>/like", methods=["POST"])
@login_required
def like_post(postId):
    """
    Post liking with direct SQL operations
    """
    try:
        # Check if post exists
        post_exists = db.session.execute(
            text("SELECT 1 FROM posts WHERE id = :post_id"), {"post_id": postId}
        ).fetchone()

        if not post_exists:
            return {"errors": {"message": "Post not found"}}, 404

        # Use optimized like addition
        success = db.session.execute(
            text(
                """
                INSERT OR IGNORE INTO likes (user_id, post_id) 
                VALUES (:user_id, :post_id)
            """
            ),
            {"user_id": current_user.id, "post_id": postId},
        )

        db.session.commit()

        if success.rowcount > 0:
            return {"message": "Like added"}, 200
        return {"errors": {"message": "Post already liked"}}, 400

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error liking post {postId}: {str(e)}")
        return {"errors": {"message": "Error adding like"}}, 500


@post_routes.route("/<int:postId>/unlike", methods=["POST"])
@login_required
def unlike_post(postId):
    """
    Post unliking with direct SQL operations
    """
    try:
        result = db.session.execute(
            text("DELETE FROM likes WHERE user_id = :user_id AND post_id = :post_id"),
            {"user_id": current_user.id, "post_id": postId},
        )

        if result.rowcount > 0:
            db.session.commit()
            return {"message": "Like removed"}, 200
        return {"errors": {"message": "Post not liked"}}, 400

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error unliking post {postId}: {str(e)}")
        return {"errors": {"message": "Error removing like"}}, 500
