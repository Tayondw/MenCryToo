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
        return {"errors": {"message": "Not Found"}}, 404

    return {"posts": [post.to_dict() for post in posts]}


@post_routes.route("/<int:postId>")
@login_required
def post(postId):
    """
    Query for post by id and returns that post in a dictionary
    """

    post = Post.query.get(postId)

    if not post:
        return {"errors": {"message": "Not Found"}}, 404

    return post.to_dict()


@post_routes.route("/create", methods=["GET", "POST"])
@login_required
def create_post():
    """
    Create a new post linked to the current user and submit to the database

    renders an empty form on get requests, validates and submits form on post requests

    The commented out code was to test if the post request works
    """

    form = PostForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        post_image = form.image.data

        if not post_image:
            return {"message": "An image is required to create a post."}, 400

        try:
            post_image.filename = get_unique_filename(post_image.filename)
            upload = upload_file_to_s3(post_image)
        except Exception as e:
            return {"message": f"Image upload failed: {str(e)}"}, 500

        # Check if the upload was successful
        if "url" not in upload:
            # if the dictionary doesn't have a url key
            # it means that there was an error when you tried to upload
            # so you send back that error message (and you printed it above)
            return {
                "message": upload.get(
                    "errors", "Image upload failed. Please try again."
                )
            }, 400

        url = upload["url"]
        create_post = Post(
            creator=current_user.id,
            title=form.data["title"],
            caption=form.data["caption"],
            image=url,
        )
        db.session.add(create_post)
        db.session.commit()
        return {"post": create_post.to_dict()}, 201
    #     if form.errors:
    #         print(form.errors)
    #         return render_template("post_form.html", form=form, errors=form.errors)
    #     return render_template("post_form.html", form=form, errors=None)

    return form.errors, 400


@post_routes.route("/<int:postId>/edit", methods=["GET", "POST"])
def edit_post(postId):
    """
    will generate an update post form on get requests and validate/save on post requests

    Returns 401 Unauthorized if the current user's id does not match the post's user id

    Returns 404 Not Found if the post is not in the database or if the user is not found in the database

    The commented out code was to test if the post request works
    """

    post_to_edit = Post.query.get(postId)

    # check if there is a post to edit
    if not post_to_edit:
        return {"errors": {"message": "Not Found"}}, 404

    user = User.query.get(post_to_edit.creator)

    # check if there is a user who created the post
    if not user:
        return {"errors": {"message": "Not Found"}}, 404

    # check if current user is post creator - group creator is only allowed to update
    if current_user.id != post_to_edit.creator:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = PostForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        post_to_edit.creator = current_user.id
        post_to_edit.title = form.data["title"]
        post_to_edit.caption = form.data["caption"]

        if form.image.data:
            post_image = form.image.data

            post_image.filename = get_unique_filename(post_image.filename)

            upload = upload_file_to_s3(post_image)
            if "url" not in upload:
                return {"message": "Upload failed"}, 400

            # Remove the old image from S3
            remove_file_from_s3(post_to_edit.image)
            post_to_edit.image = upload["url"]
        db.session.commit()
        return {"post": post_to_edit.to_dict()}, 200
    #   return redirect(f"/api/posts/{postId}")
    #     elif form.errors:
    #         print(form.errors)
    #         return render_template(
    #             "post_form.html", form=form, type="update", id=postId, errors=form.errors
    #         )

    #     else:
    #         current_data = Post.query.get(postId)
    #         print(current_data)
    #         form.process(obj=current_data)
    #         return render_template(
    #             "post_form.html", form=form, type="update", id=postId, errors=None
    #         )
    elif form.errors:
        return {"errors": form.errors}, 400

    else:
        return {"post": post_to_edit.to_dict()}, 200


@post_routes.route("/<int:postId>/delete", methods=["DELETE"])
@login_required
def delete_group(postId):
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

    # Delete associated post likes
    Likes.query.filter_by(post_id=postId).delete()

    db.session.delete(post_to_delete)
    db.session.commit()
    return {"message": "post deleted"}


#     return redirect("/api/posts/")


# ! POST - COMMENTS
@post_routes.route("/<int:postId>/comments", methods=["POST"])
@login_required
def add_comment(postId):
    form = CommentForm()
    if form.validate_on_submit():
        comment = Comment(
            post_id=postId, user_id=current_user.id, comment=form.comment.data
        )
        db.session.add(comment)
        db.session.commit()
        return jsonify(comment.to_dict()), 201
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
