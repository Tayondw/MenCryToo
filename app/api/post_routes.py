from flask import Blueprint, request, abort, redirect, render_template, jsonify
from flask_login import login_required, current_user
from app.models import db, User, Post, Comment, Likes
from app.forms import PostForm, CommentForm
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3

post_routes = Blueprint("posts", __name__)


# ! POSTS
@post_routes.route("/feed")
@login_required
def all_posts():
    """
    Query for all posts and returns them in a list of post dictionaries
    """
    posts = Post.query.order_by(Post.created_at.desc()).all()

    if not posts:
        return jsonify({"errors": {"message": "Not Found"}}), 404

    return jsonify({"posts": [post.to_dict(post_comments=True, post_likes=True) for post in posts]})


@post_routes.route("/<int:postId>")
@login_required
def post(postId):
    """
    Query for post by id and returns that post in a dictionary
    """

    post = Post.query.get(postId)

    if not post:
        return jsonify({"errors": {"message": "Not Found"}}), 404

    return jsonify(post.to_dict(post_comments=True, post_likes=True))


@post_routes.route("/<int:postId>/delete", methods=["DELETE"])
@login_required
def delete_post(postId):
    """
    will delete a given post by its id

    Returns 401 Unauthorized if the current user's id does not match the post's user id

    Returns 404 Not Found if the post is not in the database or if the user is not found in the database

    The commented out code was to test if the delete request works
    """

    post_to_delete = Post.query.get(postId)

    # check if there is a post to delete
    if not post_to_delete:
        return {"errors": {"message": "Not Found"}}, 404

    user = User.query.get(post_to_delete.creator)

    # check if there is a user who created the post
    if not user:
        return {"errors": {"message": "Not Found"}}, 404

    # check if current user is post creator - post creator is only allowed to update
    if current_user.id != post_to_delete.creator:
        return {"errors": {"message": "Unauthorized"}}, 401

    # Delete associated post comments
    Comment.query.filter_by(post_id=postId).delete()

    # Delete associated post likes (use db.session for many-to-many table)
    db.session.execute(Likes.delete().where(Likes.c.post_id == postId))

    # Delete associated post likes
    #     Likes.query.filter_by(post_id=postId).delete()

    db.session.delete(post_to_delete)
    db.session.commit()
    return {"message": "post deleted"}


#     return redirect("/api/posts/")


# ! POST - COMMENTS
@post_routes.route("/<int:postId>/comments", methods=["GET", "POST"])
@login_required
def add_comment(postId):

    post = Post.query.get(postId)

    if not post:
        return jsonify({"error": "Post not found"}), 404

    form = CommentForm()
    form["csrf_token"].data = request.cookies["csrf_token"]
    if form.validate_on_submit():
        comment = Comment(
            post_id=postId, user_id=current_user.id, comment=form.comment.data
        )
        db.session.add(comment)
        db.session.commit()
        return jsonify(comment.to_dict()), 201
    #   return redirect(f"/api/posts/{postId}")
    #     elif form.errors:
    #         print(form.errors)
    #         return render_template(
    #                 "comment_form.html", form=form, id=postId, errors=form.errors
    #             )

    #     else:
    #         current_data = Post.query.get(postId)
    #         print(current_data)
    #         form.process(obj=current_data)
    #         return render_template(
    #                 "comment_form.html", form=form, id=postId, errors=None
    #             )
    return jsonify({"errors": form.errors}), 400


@post_routes.route("/<int:postId>/comments/<int:commentId>", methods=["DELETE"])
@login_required
def delete_comment(postId, commentId):
    comment = Comment.query.get(commentId)
    if not comment or comment.post_id != postId:
        return jsonify({"errors": {"message": "Comment not found"}}), 404

    if comment.user_id != current_user.id:
        return jsonify({"errors": {"message": "Unauthorized"}}), 403

    db.session.delete(comment)
    db.session.commit()
    return jsonify({"message": "Comment deleted successfully"}), 200


# ! POST - LIKES
@post_routes.route("/<int:postId>/like", methods=["POST"])
@login_required
def like_post(postId):
    post = Post.query.get(postId)
    if not post:
        return {"errors": {"message": "Post not found"}}, 404

    if post.add_like(current_user.id):
        return {"message": "Like added"}, 200
    return {"errors": {"message": "Failed to add like"}}, 400


@post_routes.route("/<int:postId>/unlike", methods=["POST"])
@login_required
def unlike_post(postId):
    post = Post.query.get(postId)
    if not post:
        return {"errors": {"message": "Post not found"}}, 404

    if post.remove_like(current_user.id):
        return {"message": "Like removed"}, 200
    return {"errors": {"message": "Failed to remove like"}}, 400
