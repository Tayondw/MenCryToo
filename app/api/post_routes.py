from flask import Blueprint, request, redirect, jsonify
from flask_login import login_required, current_user
from app.models import db, User, Post, Comment, Likes, UserTags, Tag
from app.forms import PostForm, CommentForm
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3
from sqlalchemy.orm import joinedload, selectinload, load_only
from sqlalchemy import desc, func, text
import logging

post_routes = Blueprint("posts", __name__)
logger = logging.getLogger(__name__)

# ! POSTS
@post_routes.route("/feed/all")
@login_required
def all_posts_feed():
    """
    ALL posts with pagination and loading
    """
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 50)

        # Get posts with pagination
        posts = Post.query.order_by(desc(Post.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )

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
                }
            )

        # Build response
        posts_data = []
        for post in posts.items:
            try:
                # Load user
                user_data = None
                if post.creator:
                    user = User.query.get(post.creator)
                    if user:
                        user_data = {
                            "id": user.id,
                            "username": user.username,
                            "firstName": user.first_name or "",
                            "lastName": user.last_name or "",
                            "profileImage": user.profile_image_url or "",
                        }

                # Get counts
                like_count = (
                    db.session.execute(
                        text("SELECT COUNT(*) FROM likes WHERE post_id = :post_id"),
                        {"post_id": post.id},
                    ).scalar()
                    or 0
                )

                comment_count = (
                    db.session.execute(
                        text("SELECT COUNT(*) FROM comments WHERE post_id = :post_id"),
                        {"post_id": post.id},
                    ).scalar()
                    or 0
                )

                post_dict = {
                    "id": post.id,
                    "title": post.title or "",
                    "caption": post.caption or "",
                    "creator": post.creator,
                    "image": post.image or "",
                    "likes": like_count,
                    "comments": comment_count,
                    "createdAt": (
                        post.created_at.isoformat() if post.created_at else None
                    ),
                    "updatedAt": (
                        post.updated_at.isoformat() if post.updated_at else None
                    ),
                    "user": user_data,
                }
                posts_data.append(post_dict)

            except Exception as post_error:
                logger.warning(f"Error processing post {post.id}: {post_error}")
                continue

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
        logger.error(f"Error in all_posts_feed: {str(e)}")
        return jsonify({"errors": {"message": "Internal server error"}}), 500


@post_routes.route("/feed/similar")
@login_required
def similar_posts_feed():
    """
    Posts from users with similar tags
    """
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 50)

        # Check if user has tags
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

        # Get user's tag IDs
        user_tag_ids = [tag.id for tag in current_user.users_tags]

        # Find users with similar tags
        try:
            similar_user_ids = []

            if len(user_tag_ids) == 1:
                # Single tag case
                result = db.session.execute(
                    text(
                        """
                        SELECT DISTINCT user_id 
                        FROM user_tags 
                        WHERE tag_id = :tag_id 
                        AND user_id != :current_user_id
                    """
                    ),
                    {"tag_id": user_tag_ids[0], "current_user_id": current_user.id},
                ).fetchall()
                similar_user_ids = [row[0] for row in result]
            else:
                # Multiple tags case
                tag_conditions = []
                params = {"current_user_id": current_user.id}

                for i, tag_id in enumerate(user_tag_ids):
                    tag_conditions.append(f"tag_id = :tag_id_{i}")
                    params[f"tag_id_{i}"] = tag_id

                query = f"""
                    SELECT DISTINCT user_id 
                    FROM user_tags 
                    WHERE ({' OR '.join(tag_conditions)})
                    AND user_id != :current_user_id
                """

                result = db.session.execute(text(query), params).fetchall()
                similar_user_ids = [row[0] for row in result]

            if not similar_user_ids:
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

            # Get posts from these users
            posts = (
                Post.query.filter(Post.creator.in_(similar_user_ids))
                .order_by(desc(Post.created_at))
                .paginate(page=page, per_page=per_page, error_out=False)
            )

        except Exception as query_error:
            logger.error(f"Error finding similar users: {query_error}")
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
                    "message": "Error finding similar users.",
                }
            )

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
            try:
                # Load user
                user_data = None
                if post.creator:
                    user = User.query.get(post.creator)
                    if user:
                        user_data = {
                            "id": user.id,
                            "username": user.username,
                            "firstName": user.first_name or "",
                            "lastName": user.last_name or "",
                            "profileImage": user.profile_image_url or "",
                        }

                # Get counts
                like_count = (
                    db.session.execute(
                        text("SELECT COUNT(*) FROM likes WHERE post_id = :post_id"),
                        {"post_id": post.id},
                    ).scalar()
                    or 0
                )

                comment_count = (
                    db.session.execute(
                        text("SELECT COUNT(*) FROM comments WHERE post_id = :post_id"),
                        {"post_id": post.id},
                    ).scalar()
                    or 0
                )

                post_dict = {
                    "id": post.id,
                    "title": post.title or "",
                    "caption": post.caption or "",
                    "creator": post.creator,
                    "image": post.image or "",
                    "likes": like_count,
                    "comments": comment_count,
                    "createdAt": (
                        post.created_at.isoformat() if post.created_at else None
                    ),
                    "updatedAt": (
                        post.updated_at.isoformat() if post.updated_at else None
                    ),
                    "user": user_data,
                }
                posts_data.append(post_dict)

            except Exception as post_error:
                logger.warning(f"Error processing similar post {post.id}: {post_error}")
                continue

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
        logger.error(f"Error in similar_posts_feed: {str(e)}")
        return jsonify({"errors": {"message": "Internal server error"}}), 500


@post_routes.route("/feed/stats")
@login_required
def posts_feed_stats():
    """
    Get stats about the posts feed
    """
    try:
        # Get total posts count
        total_posts = db.session.query(func.count(Post.id)).scalar() or 0

        # Get similar users and posts count
        similar_users_count = 0
        similar_posts_count = 0

        if current_user.users_tags:
            user_tag_ids = [tag.id for tag in current_user.users_tags]

            try:
                if len(user_tag_ids) == 1:
                    # Single tag case
                    similar_users_count = (
                        db.session.execute(
                            text(
                                """
                            SELECT COUNT(DISTINCT user_id) 
                            FROM user_tags 
                            WHERE tag_id = :tag_id 
                            AND user_id != :current_user_id
                        """
                            ),
                            {
                                "tag_id": user_tag_ids[0],
                                "current_user_id": current_user.id,
                            },
                        ).scalar()
                        or 0
                    )
                else:
                    # Multiple tags case
                    tag_conditions = []
                    params = {"current_user_id": current_user.id}

                    for i, tag_id in enumerate(user_tag_ids):
                        tag_conditions.append(f"tag_id = :tag_id_{i}")
                        params[f"tag_id_{i}"] = tag_id

                    query = f"""
                        SELECT COUNT(DISTINCT user_id) 
                        FROM user_tags 
                        WHERE ({' OR '.join(tag_conditions)})
                        AND user_id != :current_user_id
                    """

                    similar_users_count = (
                        db.session.execute(text(query), params).scalar() or 0
                    )

                # Count posts from similar users if any exist
                if similar_users_count > 0:
                    if len(user_tag_ids) == 1:
                        similar_user_ids_result = db.session.execute(
                            text(
                                """
                                SELECT DISTINCT user_id 
                                FROM user_tags 
                                WHERE tag_id = :tag_id 
                                AND user_id != :current_user_id
                            """
                            ),
                            {
                                "tag_id": user_tag_ids[0],
                                "current_user_id": current_user.id,
                            },
                        ).fetchall()
                    else:
                        similar_user_ids_result = db.session.execute(
                            text(query), params
                        ).fetchall()

                    similar_user_ids = [row[0] for row in similar_user_ids_result]

                    if similar_user_ids:
                        posts_count_query = "SELECT COUNT(*) FROM posts WHERE "
                        posts_count_conditions = []
                        posts_params = {}

                        for i, user_id in enumerate(similar_user_ids):
                            posts_count_conditions.append(f"creator = :user_id_{i}")
                            posts_params[f"user_id_{i}"] = user_id

                        posts_count_query += (
                            "(" + " OR ".join(posts_count_conditions) + ")"
                        )

                        similar_posts_count = (
                            db.session.execute(
                                text(posts_count_query), posts_params
                            ).scalar()
                            or 0
                        )

            except Exception as stats_error:
                logger.warning(f"Error calculating similar stats: {stats_error}")
                similar_users_count = 0
                similar_posts_count = 0

        return jsonify(
            {
                "totalPosts": total_posts,
                "similarUsers": similar_users_count,
                "similarPosts": similar_posts_count,
                "userTags": (
                    len(current_user.users_tags) if current_user.users_tags else 0
                ),
            }
        )

    except Exception as e:
        logger.error(f"Error getting feed stats: {str(e)}")
        return jsonify({"errors": {"message": "Internal server error"}}), 500


@post_routes.route("/feed/batch")
@login_required
def batch_posts_feed():
    """
    Returns both all posts and similar posts data in a single API call
    """
    try:
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 50)

        # Get stats safely
        try:
            stats_response = posts_feed_stats()
            stats_data = (
                stats_response.get_json() if hasattr(stats_response, "get_json") else {}
            )
        except Exception:
            stats_data = {
                "totalPosts": 0,
                "similarUsers": 0,
                "similarPosts": 0,
                "userTags": 0,
            }

        # Get all posts safely
        try:
            all_posts_response = all_posts_feed()
            if isinstance(all_posts_response, tuple) and all_posts_response[1] != 200:
                all_posts_data = {"posts": [], "pagination": {}}
            else:
                all_posts_data = (
                    all_posts_response.get_json()
                    if hasattr(all_posts_response, "get_json")
                    else {"posts": [], "pagination": {}}
                )
        except Exception:
            all_posts_data = {"posts": [], "pagination": {}}

        # Get similar posts safely
        try:
            similar_posts_response = similar_posts_feed()
            if (
                isinstance(similar_posts_response, tuple)
                and similar_posts_response[1] != 200
            ):
                similar_posts_data = {
                    "posts": [],
                    "pagination": {},
                    "message": "Error loading similar posts",
                }
            else:
                similar_posts_data = (
                    similar_posts_response.get_json()
                    if hasattr(similar_posts_response, "get_json")
                    else {"posts": [], "pagination": {}}
                )
        except Exception:
            similar_posts_data = {
                "posts": [],
                "pagination": {},
                "message": "Error loading similar posts",
            }

        return jsonify(
            {
                "allPosts": all_posts_data.get("posts", []),
                "similarPosts": similar_posts_data.get("posts", []),
                "allPostsPagination": all_posts_data.get("pagination", {}),
                "similarPostsPagination": similar_posts_data.get("pagination", {}),
                "stats": stats_data,
                "message": similar_posts_data.get("message"),
                "activeTab": "all",
            }
        )

    except Exception as e:
        logger.error(f"Error in batch_posts_feed: {str(e)}")
        return jsonify({"errors": {"message": "Internal server error"}}), 500


# Keep existing endpoints but mark as legacy
@post_routes.route("/feed")
@login_required
def all_posts():
    """
    Legacy endpoint - redirects to other version
    """
    return redirect("/api/posts/feed/all")


@post_routes.route("/similar-feed")
@login_required
def similar_users_posts_feed():
    """
    Legacy endpoint - redirects to other version
    """
    return redirect("/api/posts/feed/similar")


@post_routes.route("/<int:postId>")
@login_required
def post(postId):
    """
    Single post view with ALL commenter data properly loaded
    """
    try:
        # Load post with ALL comment user data
        post = (
            db.session.query(Post)
            .options(
                # Load post user data
                joinedload(Post.user).load_only(
                    "id", "username", "first_name", "last_name", "profile_image_url"
                ),
                # Load ALL comments with their respective user data
                selectinload(Post.post_comments).options(
                    # Load commenter for EVERY comment
                    joinedload(Comment.commenter).load_only(
                        "id", "username", "first_name", "last_name", "profile_image_url"
                    )
                ),
            )
            .filter(Post.id == postId)
            .first()
        )

        if not post:
            return jsonify({"errors": {"message": "Not Found"}}), 404

        # Get like count
        like_count = (
            db.session.execute(
                text("SELECT COUNT(*) FROM likes WHERE post_id = :post_id"),
                {"post_id": postId},
            ).scalar()
            or 0
        )

        # Build response with PROPER commenter data for ALL comments
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
            "postComments": [
                {
                    "id": comment.id,
                    "userId": comment.user_id,
                    "postId": comment.post_id,
                    "comment": comment.comment,
                    "username": (
                        comment.commenter.username if comment.commenter else "Unknown"
                    ),
                    "parentId": comment.parent_id,
                    "created_at": (
                        comment.created_at.isoformat() if comment.created_at else None
                    ),
                    "updated_at": (
                        comment.updated_at.isoformat() if comment.updated_at else None
                    ),
                    # Include actual commenter data for EVERY comment
                    "commenter": (
                        {
                            "id": comment.commenter.id,
                            "username": comment.commenter.username,
                            "firstName": comment.commenter.first_name or "",
                            "lastName": comment.commenter.last_name or "",
                            "profileImage": comment.commenter.profile_image_url
                            or "/default-avatar.png",
                        }
                        if comment.commenter
                        else {
                            "id": comment.user_id,
                            "username": "Unknown User",
                            "firstName": "",
                            "lastName": "",
                            "profileImage": "/default-avatar.png",
                        }
                    ),
                }
                for comment in post.post_comments
            ],
            "createdAt": post.created_at.isoformat() if post.created_at else None,
            "updatedAt": post.updated_at.isoformat() if post.updated_at else None,
        }

        return jsonify(post_data)

    except Exception as e:
        logger.error(f"Error in post {postId}: {str(e)}")
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
    Post liking with database-agnostic atomic operation
    """
    try:
        # Single operation that handles both check and insert
        result = db.session.execute(
            text(
                """
                INSERT INTO likes (user_id, post_id) 
                SELECT :user_id, :post_id
                WHERE EXISTS (SELECT 1 FROM posts WHERE id = :post_id)
                AND NOT EXISTS (
                    SELECT 1 FROM likes 
                    WHERE user_id = :user_id AND post_id = :post_id
                )
            """
            ),
            {"user_id": current_user.id, "post_id": postId},
        )

        db.session.commit()

        if result.rowcount > 0:
            return {"message": "Like added"}, 200
        else:
            # Check why it failed - post doesn't exist or already liked
            post_exists = db.session.execute(
                text("SELECT 1 FROM posts WHERE id = :post_id"), {"post_id": postId}
            ).fetchone()

            if not post_exists:
                return {"errors": {"message": "Post not found"}}, 404
            else:
                return {"errors": {"message": "Post already liked"}}, 400

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error liking post {postId}: {str(e)}")
        return {"errors": {"message": "Error adding like"}}, 500


@post_routes.route("/<int:postId>/unlike", methods=["POST"])
@login_required
def unlike_post(postId):
    """
    Post unliking with atomic operation
    """
    try:
        # Atomic delete operation
        result = db.session.execute(
            text(
                """
                DELETE FROM likes 
                WHERE user_id = :user_id 
                AND post_id = :post_id
                AND EXISTS (SELECT 1 FROM posts WHERE id = :post_id)
            """
            ),
            {"user_id": current_user.id, "post_id": postId},
        )

        db.session.commit()

        if result.rowcount > 0:
            return {"message": "Like removed"}, 200
        else:
            # Check if post exists
            post_exists = db.session.execute(
                text("SELECT 1 FROM posts WHERE id = :post_id"), {"post_id": postId}
            ).fetchone()

            if not post_exists:
                return {"errors": {"message": "Post not found"}}, 404
            else:
                return {"errors": {"message": "Post not liked"}}, 400

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error unliking post {postId}: {str(e)}")
        return {"errors": {"message": "Error removing like"}}, 500
