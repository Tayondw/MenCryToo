from flask import Blueprint, jsonify, render_template, request, redirect, abort
from flask_login import login_required, current_user
from app.models import (
    db,
    User,
    Group,
    Event,
    Post,
    UserTags,
    Tag,
    Attendance,
    Membership,
    Comment,
    Venue,
)
from app.forms import UserForm, EditUserForm, PostForm, EditPostForm
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import func
import requests
import json

user_routes = Blueprint("users", __name__)


@user_routes.route("/")
@login_required
def users():
    """
    Query for all users and returns them in a list of user dictionaries  - minimal data only
    """
    users = (
        db.session.query(User)
        .options(
            selectinload(User.users_tags),
            selectinload(User.memberships),
            selectinload(User.attendances),
        )
        .all()
    )

    return jsonify({"users": [user.to_dict_minimal() for user in users]})


@user_routes.route("/<int:userId>")
@login_required
def user(userId):
    """
    Query for a user by id and returns that user in a dictionary - single user fetch
    """
    user = (
        db.session.query(User)
        .options(
            joinedload(User.posts).joinedload(Post.post_comments),
            joinedload(User.posts).joinedload(Post.post_likes),
            selectinload(User.user_comments),
            selectinload(User.memberships).joinedload(Membership.group),
            selectinload(User.attendances),
            selectinload(User.users_tags),
            selectinload(User.groups),
        )
        .filter(User.id == userId)
        .first()
    )

    if not user:
        return jsonify({"errors": {"message": "User not found"}}), 404

    return jsonify(
        user.to_dict(
            posts=True,
            user_comments=True,
            memberships=True,
            attendances=True,
            users_tags=True,
            group=True,
            events=True,
        )
    )


@user_routes.route("/profile-feed")
@login_required
def view_all_profiles():
    """
    Query for all users with a profile and returns them in a list of user dictionaries -  return minimal data
    """

    users = (
        db.session.query(User)
        .filter(User.profile_image_url.isnot(None))
        .options(selectinload(User.users_tags))
        .all()
    )

    return jsonify({"users_profile": [user.to_dict_minimal() for user in users]})


@user_routes.route("/<int:userId>/profile/update", methods=["POST"])
@login_required
def update_profile(userId):
    user_to_edit = User.query.get(userId)

    if not user_to_edit:
        return {"errors": {"message": "Not Found"}}, 404

    if user_to_edit.id != current_user.id:
        return {
            "errors": {
                "message": "User is not the current user and cannot create a profile for another user"
            }
        }, 404

    form = EditUserForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        profile_image = form.profileImage.data

        if profile_image:
            try:
                profile_image.filename = get_unique_filename(profile_image.filename)
                upload = upload_file_to_s3(profile_image)
            except Exception as e:
                return {"message": f"Image upload failed: {str(e)}"}, 500

            if "url" not in upload:
                return {
                    "message": upload.get(
                        "errors", "Image upload failed. Please try again."
                    )
                }, 400

            # Remove the old image from S3
            if user_to_edit.profile_image_url:
                remove_file_from_s3(user_to_edit.profile_image_url)
            user_to_edit.profile_image_url = upload["url"]

        # Update the existing user with profile details
        user_to_edit.first_name = form.data["firstName"]
        user_to_edit.last_name = form.data["lastName"]
        user_to_edit.bio = form.data["bio"]
        user_to_edit.username = form.data["username"]
        user_to_edit.email = form.data["email"]

        # Optimized tag update - clear existing and add new
        if form.userTags.data:
            user_to_edit.users_tags.clear()
            selected_tags = form.userTags.data
            tags_to_add = Tag.query.filter(Tag.name.in_(selected_tags)).all()
            user_to_edit.users_tags.extend(tags_to_add)

        db.session.commit()

        # Return optimized response
        return {
            "profile": user_to_edit.to_dict(
                posts=True,
                user_comments=True,
                memberships=True,
                attendances=True,
                users_tags=True,
                group=True,
                events=True,
            )
        }, 201

    return form.errors, 400


# @user_routes.route("/<int:userId>/profile/update", methods=["POST"])
# @login_required
# def update_profile(userId):
#     """
#     Update a profile linked to the current user and submit to the database.

#     renders an empty form on get requests, validates and submits form on post requests

#     The commented out code was to test if the post request works
#     """
#     user_to_edit = User.query.get(userId)

#     if not user_to_edit:
#         return {"errors": {"message": "Not Found"}}, 404

#     if user_to_edit.id != current_user.id:
#         return {
#             "errors": {
#                 "message": "User is not the current user and cannot create a profile for another user"
#             }
#         }, 404

#     form = UserForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]

#     if form.validate_on_submit():
#         profile_image = form.profileImage.data

#         if not profile_image:
#             return {"message": "An image is required to create a profile."}, 400

#         try:
#             profile_image.filename = get_unique_filename(profile_image.filename)
#             upload = upload_file_to_s3(profile_image)
#         except Exception as e:
#             return {"message": f"Image upload failed: {str(e)}"}, 500

#         if "url" not in upload:
#             return {
#                 "message": upload.get(
#                     "errors", "Image upload failed. Please try again."
#                 )
#             }, 400

#         # Remove the old image from S3
#         remove_file_from_s3(user_to_edit.profile_image_url)

#         url = upload["url"]

#         # Update the existing user with profile details
#         user_to_edit.first_name = form.data["firstName"]
#         user_to_edit.last_name = form.data["lastName"]
#         user_to_edit.bio = form.data["bio"]
#         user_to_edit.profile_image_url = url

#         # Update the user's tags
#         selected_tags = form.userTags.data  # This returns a list of selected tags
#         tags_to_add = Tag.query.filter(Tag.name.in_(selected_tags)).all()
#         user_to_edit.users_tags = tags_to_add

#         db.session.commit()
#         return {
#             "profile": user_to_edit.to_dict(
#                 posts=True,
#                 user_comments=True,
#                 user_memberships=True,
#                 user_attendances=True,
#                 users_tags=True,
#             )
#         }, 201

#     #     if form.errors:
#     #             print(form.errors)
#     #             return render_template(
#     #                     "user_form.html", form=form, id=userId, type="update", errors=form.errors
#     #                 )

#     #     return render_template(
#     #             "user_form.html", form=form, id=userId, type="update", errors=None
#     #         )
#     return form.errors, 400


@user_routes.route("/<int:userId>/profile/delete", methods=["DELETE"])
@login_required
def delete_profile(userId):
    """Optimized profile deletion with batch operations"""
    user = User.query.get(userId)

    if not user:
        return jsonify({"errors": {"message": "user not found"}}), 404

    if user.id != current_user.id:
        return jsonify({"errors": {"message": "Unauthorized"}}), 403

    # Batch delete related data for better performance
    try:
        # Delete in correct order to avoid foreign key constraints
        Attendance.query.filter_by(user_id=userId).delete(synchronize_session=False)
        Membership.query.filter_by(user_id=userId).delete(synchronize_session=False)
        Comment.query.filter_by(user_id=userId).delete(synchronize_session=False)
        Post.query.filter_by(creator=userId).delete(synchronize_session=False)

        # Handle groups organized by the user - batch operation
        groups_to_delete = Group.query.filter_by(organizer_id=userId).all()
        for group in groups_to_delete:
            # Delete events and venues associated with this group
            Event.query.filter_by(group_id=group.id).delete(synchronize_session=False)
            Venue.query.filter_by(group_id=group.id).delete(synchronize_session=False)
            db.session.delete(group)

        # Delete the user
        db.session.delete(user)
        db.session.commit()

        return jsonify({"message": "Profile deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"errors": {"message": "Error deleting profile"}}), 500


@user_routes.route("/<int:userId>/add-tags", methods=["POST"])
@login_required
def add_tags(userId):
    user = User.query.get(userId)

    if not user:
        return jsonify({"errors": {"message": "User not found"}}), 404

    if user.id != current_user.id:
        return jsonify({"errors": {"message": "Unauthorized"}}), 403

    form = request.json
    new_tag_names = form.get("userTags", [])

    if not new_tag_names:
        return jsonify({"message": "No tags provided"}), 400

    try:
        # Get existing user tags in one query
        existing_tag_names = {tag.name for tag in user.users_tags}

        # Get or create new tags in batch
        tags_to_add = []
        for tag_name in new_tag_names:
            if tag_name not in existing_tag_names:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                tags_to_add.append(tag)

        # Flush to get IDs for new tags
        db.session.flush()

        # Add tags to user
        user.users_tags.extend(tags_to_add)
        db.session.commit()

        return jsonify({"message": "Tags added successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"errors": {"message": "Error adding tags"}}), 500


@user_routes.route("<int:userId>/posts/create", methods=["POST"])
@login_required
def create_post(userId):
    """
    Create a new post linked to the current user and submit to the database

    renders an empty form on get requests, validates and submits form on post requests

    The commented out code was to test if the post request works
    """
    # Verify user exists
    user = User.query.get(userId)
    if not user:
        return {"errors": {"message": "Not Found"}}, 404

    # Check authorization
    if current_user.id != userId:
        return {"errors": {"message": "Unauthorized"}}, 401

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

        if "url" not in upload:
            return {
                "message": upload.get(
                    "errors", "Image upload failed. Please try again."
                )
            }, 400

        url = upload["url"]
        create_post = Post(
            creator=userId,
            title=form.data["title"],
            caption=form.data["caption"],
            image=url,
        )

        db.session.add(create_post)
        db.session.commit()

        # Load the post with relationships for response
        post_with_relations = (
            db.session.query(Post)
            .options(
                joinedload(Post.user),
                selectinload(Post.post_likes),
                selectinload(Post.post_comments),
            )
            .filter(Post.id == create_post.id)
            .first()
        )

        return {
            "post": post_with_relations.to_dict(post_likes=True, post_comments=True)
        }, 201

    #     if form.errors:
    #         print(form.errors)
    #         return render_template("post_form.html", form=form, errors=form.errors)
    #     return render_template("post_form.html", form=form, errors=None)

    return form.errors, 400


@user_routes.route("/<int:userId>/posts/<int:postId>", methods=["POST"])
def edit_post(userId, postId):
    """
    will generate an update post form on get requests and validate/save on post requests

    Returns 401 Unauthorized if the current user's id does not match the post's user id

    Returns 404 Not Found if the post is not in the database or if the user is not found in the database

    The commented out code was to test if the post request works
    """

    post_to_edit = Post.query.get(postId)

    if not post_to_edit:
        return {"errors": {"message": "Not Found"}}, 404

    user = User.query.get(userId)
    if not user:
        return {"errors": {"message": "Not Found"}}, 404

    if current_user.id != userId:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = EditPostForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        post_to_edit.creator = userId
        post_to_edit.title = form.data["title"]
        post_to_edit.caption = form.data["caption"]

        if form.image.data:
            post_image = form.image.data
            post_image.filename = get_unique_filename(post_image.filename)

            upload = upload_file_to_s3(post_image)
            if "url" not in upload:
                return {"message": "Upload failed"}, 400

            # Remove the old image from S3
            if post_to_edit.image:
                remove_file_from_s3(post_to_edit.image)
            post_to_edit.image = upload["url"]

        db.session.commit()

        # Load updated post with relationships
        updated_post = (
            db.session.query(Post)
            .options(
                joinedload(Post.user),
                selectinload(Post.post_comments).joinedload(Comment.commenter),
                selectinload(Post.post_likes),
            )
            .filter(Post.id == postId)
            .first()
        )

        return {"post": updated_post.to_dict(post_comments=True, post_likes=True)}, 200
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
        # Return current post data if no form submission
        current_post = (
            db.session.query(Post)
            .options(
                joinedload(Post.user),
                selectinload(Post.post_comments).joinedload(Comment.commenter),
                selectinload(Post.post_likes),
            )
            .filter(Post.id == postId)
            .first()
        )

        return {"post": current_post.to_dict(post_comments=True, post_likes=True)}, 200
