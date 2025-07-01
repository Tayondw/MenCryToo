from flask import Blueprint, request, abort, redirect, render_template, jsonify
from flask_login import login_required, current_user
from app.models import db, User, Post, Comment, Likes
from app.forms import PostForm, CommentForm
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import desc, func

post_routes = Blueprint("posts", __name__)


# ! POSTS
@post_routes.route("/feed")
@login_required
def all_posts():
    """
    Optimized posts feed with pagination and minimal data loading
    """
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 50)

    # Get current user's tags for personalized feed
    current_user_tag_ids = [tag.id for tag in current_user.users_tags]

    if current_user_tag_ids:
        # Show posts from users with similar tags first
        posts_query = (
            db.session.query(Post)
            .join(User, Post.creator == User.id)
            .join(User.users_tags)
            .filter(User.users_tags.any(lambda tag: tag.id.in_(current_user_tag_ids)))
            .options(
                joinedload(Post.user).load_only(
                    "id", "username", "first_name", "last_name", "profile_image_url"
                ),
                selectinload(Post.post_likes).load_only("id"),
            )
            .distinct()
            .order_by(desc(Post.created_at))
        )
    else:
        # Fallback to all posts if user has no tags
        posts_query = (
            db.session.query(Post)
            .options(
                joinedload(Post.user).load_only(
                    "id", "username", "first_name", "last_name", "profile_image_url"
                ),
                selectinload(Post.post_likes).load_only("id"),
            )
            .order_by(desc(Post.created_at))
        )

    posts = posts_query.paginate(page=page, per_page=per_page, error_out=False)

    if not posts.items:
        return jsonify({"errors": {"message": "Not Found"}}), 404

    return jsonify(
        {
            "posts": [post.to_dict_feed_optimized() for post in posts.items],
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


@post_routes.route("/<int:postId>")
@login_required
def post(postId):
    """
    Optimized single post view
    """
    post = (
        db.session.query(Post)
        .options(
            joinedload(Post.user).load_only(
                "id", "username", "first_name", "last_name", "profile_image_url"
            ),
            selectinload(Post.post_comments)
            .joinedload(Comment.commenter)
            .load_only("id", "username"),
            selectinload(Post.post_likes).load_only("id"),
        )
        .filter(Post.id == postId)
        .first()
    )

    if not post:
        return jsonify({"errors": {"message": "Not Found"}}), 404

    return jsonify(post.to_dict_detail_optimized())


@post_routes.route("/<int:postId>/delete", methods=["DELETE"])
@login_required
def delete_post(postId):
    """
    Optimized post deletion with batch operations
    """
    post_to_delete = Post.query.get(postId)

    if not post_to_delete:
        return {"errors": {"message": "Not Found"}}, 404

    if current_user.id != post_to_delete.creator:
        return {"errors": {"message": "Unauthorized"}}, 401

    try:
        # Use efficient bulk delete operations
        # Delete comments
        db.session.execute(
            "DELETE FROM comments WHERE post_id = :post_id", {"post_id": postId}
        )

        # Delete likes
        db.session.execute(
            "DELETE FROM likes WHERE post_id = :post_id", {"post_id": postId}
        )

        # Remove image from S3 if it exists
        if post_to_delete.image:
            remove_file_from_s3(post_to_delete.image)

        db.session.delete(post_to_delete)
        db.session.commit()

        return {"message": "Post deleted successfully"}, 200

    except Exception as e:
        db.session.rollback()
        return {"errors": {"message": "Error deleting post"}}, 500


# ! POST - COMMENTS
@post_routes.route("/<int:postId>/comments", methods=["GET", "POST"])
@login_required
def add_comment(postId):
    """
    Optimized comment addition
    """
    post = Post.query.get(postId)

    if not post:
        return jsonify({"error": "Post not found"}), 404

    form = CommentForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        try:
            comment = Comment(
                post_id=postId, user_id=current_user.id, comment=form.comment.data
            )

            db.session.add(comment)
            db.session.commit()

            # Return minimal comment data
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

        except Exception as e:
            db.session.rollback()
            return jsonify({"errors": {"message": "Error creating comment"}}), 500

    return jsonify({"errors": form.errors}), 400


@post_routes.route("/<int:postId>/comments/<int:commentId>", methods=["DELETE"])
@login_required
def delete_comment(postId, commentId):
    """
    Optimized comment deletion
    """
    comment = Comment.query.filter_by(id=commentId, post_id=postId).first()

    if not comment:
        return jsonify({"errors": {"message": "Comment not found"}}), 404

    if comment.user_id != current_user.id:
        return jsonify({"errors": {"message": "Unauthorized"}}), 403

    try:
        # Delete nested replies efficiently
        db.session.execute(
            "DELETE FROM comments WHERE parent_id = :comment_id",
            {"comment_id": commentId},
        )

        db.session.delete(comment)
        db.session.commit()

        return jsonify({"message": "Comment deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"errors": {"message": "Error deleting comment"}}), 500


# ! POST - LIKES
@post_routes.route("/<int:postId>/like", methods=["POST"])
@login_required
def like_post(postId):
    """
    Optimized post liking
    """
    post = Post.query.get(postId)
    if not post:
        return {"errors": {"message": "Post not found"}}, 404

    try:
        if post.add_like_optimized(current_user.id):
            return {"message": "Like added"}, 200
        return {"errors": {"message": "Post already liked"}}, 400

    except Exception as e:
        db.session.rollback()
        return {"errors": {"message": "Error adding like"}}, 500


@post_routes.route("/<int:postId>/unlike", methods=["POST"])
@login_required
def unlike_post(postId):
    """
    Optimized post unliking
    """
    post = Post.query.get(postId)
    if not post:
        return {"errors": {"message": "Post not found"}}, 404

    try:
        if post.remove_like_optimized(current_user.id):
            return {"message": "Like removed"}, 200
        return {"errors": {"message": "Post not liked"}}, 400

    except Exception as e:
        db.session.rollback()
        return {"errors": {"message": "Error removing like"}}, 500


# from flask import Blueprint, request, abort, redirect, render_template, jsonify
# from flask_login import login_required, current_user
# from app.models import db, User, Post, Comment, Likes
# from app.forms import PostForm, CommentForm
# from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3
# from sqlalchemy.orm import joinedload, selectinload
# from sqlalchemy import desc

# post_routes = Blueprint("posts", __name__)


# # ! POSTS
# @post_routes.route("/feed")
# @login_required
# def all_posts():
#     """
#     Query for all posts and returns them in a list of post dictionaries - with pagination
#     """
#     page = request.args.get("page", 1, type=int)
#     per_page = min(request.args.get("per_page", 20, type=int), 50)

#     posts_query = (
#         db.session.query(Post)
#         .options(
#             joinedload(Post.user),
#             selectinload(Post.post_comments).joinedload(Comment.commenter),
#             selectinload(Post.post_likes),
#         )
#         .order_by(desc(Post.created_at))
#     )

#     posts = posts_query.paginate(page=page, per_page=per_page, error_out=False)

#     if not posts.items:
#         return jsonify({"errors": {"message": "Not Found"}}), 404

#     return jsonify(
#         {
#             "posts": [
#                 post.to_dict(post_comments=True, post_likes=True)
#                 for post in posts.items
#             ],
#             "pagination": {
#                 "page": page,
#                 "pages": posts.pages,
#                 "per_page": per_page,
#                 "total": posts.total,
#                 "has_next": posts.has_next,
#                 "has_prev": posts.has_prev,
#             },
#         }
#     )


# @post_routes.route("/<int:postId>")
# @login_required
# def post(postId):
#     """
#     Query for post by id and returns that post in a dictionary
#     """

#     post = (
#         db.session.query(Post)
#         .options(
#             joinedload(Post.user),
#             selectinload(Post.post_comments).joinedload(Comment.commenter),
#             selectinload(Post.post_likes),
#         )
#         .filter(Post.id == postId)
#         .first()
#     )

#     if not post:
#         return jsonify({"errors": {"message": "Not Found"}}), 404

#     return jsonify(post.to_dict(post_comments=True, post_likes=True))


# @post_routes.route("/<int:postId>/delete", methods=["DELETE"])
# @login_required
# def delete_post(postId):
#     """
#     will delete a given post by its id

#     Returns 401 Unauthorized if the current user's id does not match the post's user id

#     Returns 404 Not Found if the post is not in the database or if the user is not found in the database

#     The commented out code was to test if the delete request works
#     """

#     post_to_delete = Post.query.get(postId)

#     if not post_to_delete:
#         return {"errors": {"message": "Not Found"}}, 404

#     user = User.query.get(post_to_delete.creator)
#     if not user:
#         return {"errors": {"message": "User not found"}}, 404

#     if current_user.id != post_to_delete.creator:
#         return {"errors": {"message": "Unauthorized"}}, 401

#     try:
#         # Delete associated data in batch operations
#         Comment.query.filter_by(post_id=postId).delete(synchronize_session=False)

#         # Delete likes using raw SQL for better performance
#         db.session.execute(Likes.delete().where(Likes.c.post_id == postId))

#         # Delete associated post likes
#         #   Likes.query.filter_by(post_id=postId).delete()

#         # Remove image from S3 if it exists
#         if post_to_delete.image:
#             remove_file_from_s3(post_to_delete.image)

#         db.session.delete(post_to_delete)
#         db.session.commit()

#         return {"message": "Post deleted successfully"}, 200

#     except Exception as e:
#         db.session.rollback()
#         return {"errors": {"message": "Error deleting post"}}, 500


# #     return redirect("/api/posts/")


# # ! POST - COMMENTS
# @post_routes.route("/<int:postId>/comments", methods=["GET", "POST"])
# @login_required
# def add_comment(postId):

#     post = Post.query.get(postId)

#     if not post:
#         return jsonify({"error": "Post not found"}), 404

#     form = CommentForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]

#     if form.validate_on_submit():
#         try:
#             comment = Comment(
#                 post_id=postId, user_id=current_user.id, comment=form.comment.data
#             )

#             db.session.add(comment)
#             db.session.commit()

#             # Load comment with user relationship for response
#             created_comment = (
#                 db.session.query(Comment)
#                 .options(joinedload(Comment.commenter))
#                 .filter(Comment.id == comment.id)
#                 .first()
#             )

#             return jsonify(created_comment.to_dict()), 201

#         except Exception as e:
#             db.session.rollback()
#             return jsonify({"errors": {"message": "Error creating comment"}}), 500

#     #   return redirect(f"/api/posts/{postId}")
#     #     elif form.errors:
#     #         print(form.errors)
#     #         return render_template(
#     #                 "comment_form.html", form=form, id=postId, errors=form.errors
#     #             )

#     #     else:
#     #         current_data = Post.query.get(postId)
#     #         print(current_data)
#     #         form.process(obj=current_data)
#     #         return render_template(
#     #                 "comment_form.html", form=form, id=postId, errors=None
#     #             )
#     return jsonify({"errors": form.errors}), 400


# @post_routes.route("/<int:postId>/comments/<int:commentId>", methods=["DELETE"])
# @login_required
# def delete_comment(postId, commentId):
#     comment = Comment.query.filter_by(id=commentId, post_id=postId).first()

#     if not comment:
#         return jsonify({"errors": {"message": "Comment not found"}}), 404

#     if comment.user_id != current_user.id:
#         return jsonify({"errors": {"message": "Unauthorized"}}), 403

#     try:
#         # Delete nested replies first
#         Comment.query.filter_by(parent_id=commentId).delete(synchronize_session=False)

#         db.session.delete(comment)
#         db.session.commit()

#         return jsonify({"message": "Comment deleted successfully"}), 200

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"errors": {"message": "Error deleting comment"}}), 500


# # ! POST - LIKES
# @post_routes.route("/<int:postId>/like", methods=["POST"])
# @login_required
# def like_post(postId):
#     post = Post.query.get(postId)
#     if not post:
#         return {"errors": {"message": "Post not found"}}, 404

#     try:
#         if post.add_like(current_user.id):
#             return {"message": "Like added"}, 200
#         return {"errors": {"message": "Post already liked"}}, 400

#     except Exception as e:
#         db.session.rollback()
#         return {"errors": {"message": "Error adding like"}}, 500


# @post_routes.route("/<int:postId>/unlike", methods=["POST"])
# @login_required
# def unlike_post(postId):
#     post = Post.query.get(postId)
#     if not post:
#         return {"errors": {"message": "Post not found"}}, 404

#     try:
#         if post.remove_like(current_user.id):
#             return {"message": "Like removed"}, 200
#         return {"errors": {"message": "Post not liked"}}, 400

#     except Exception as e:
#         db.session.rollback()
#         return {"errors": {"message": "Error removing like"}}, 500
