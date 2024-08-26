from flask import Blueprint, jsonify, render_template, request, redirect, abort
from flask_login import login_required, current_user
from app.models import db, User, Group, Event, Post, UserTags, Tag
from app.forms import UserForm
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3

user_routes = Blueprint("users", __name__)


@user_routes.route("/")
@login_required
def users():
    """
    Query for all users and returns them in a list of user dictionaries
    """
    users = User.query.all()
    return {
        "users": [
            user.to_dict(
                posts=True,
                user_comments=True,
                user_memberships=True,
                user_attendances=True,
                users_tags=True,
            )
            for user in users
        ]
    }


@user_routes.route("/<int:userId>")
@login_required
def user(userId):
    """
    Query for a user by id and returns that user in a dictionary
    """
    user = User.query.get(userId)
    return user.to_dict(
        posts=True,
        user_comments=True,
        user_memberships=True,
        user_attendances=True,
        users_tags=True,
    )


@user_routes.route("/profile-feed")
@login_required
def view_all_profiles():
    """
    Query for all users with a profile and returns them in a list of user dictionaries
    """

    users = User.query.filter(User.profile_image_url.isnot(None)).all()
    return {
        "users-profile": [
            user.to_dict(
                posts=True,
                user_comments=True,
                user_memberships=True,
                user_attendances=True,
                users_tags=True,
            )
            for user in users
        ]
    }


@user_routes.route("/<int:userId>/profile/create", methods=["GET", "POST"])
@login_required
def create_profile(userId):
    """
    Create a profile linked to the current user and submit to the database.

    renders an empty form on get requests, validates and submits form on post requests

    The commented out code was to test if the post request works
    """
    user = User.query.get(userId)

    if not user:
        return {"errors": {"message": "Not Found"}}, 404

    if user.profile_image_url:
        return {"errors": {"message": "User already has a profile"}}, 404

    if user.id != current_user.id:
        return {
            "errors": {
                "message": "User is not the current user and cannot create a profile for another user"
            }
        }, 404

    form = UserForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        profile_image = form.profile_image.data

        if not profile_image:
            return {"message": "An image is required to create a profile."}, 400

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

        url = upload["url"]

        # Update the existing user with profile details
        user.first_name = form.data["first_name"]
        user.last_name = form.data["last_name"]
        user.bio = form.data["bio"]
        user.profile_image_url = url

        # Update the user's tags
        selected_tags = form.user_tags.data  # This returns a list of selected tags
        tags_to_add = Tag.query.filter(Tag.name.in_(selected_tags)).all()
        user.users_tags = tags_to_add

        db.session.commit()
        return {
            "profile": user.to_dict(
                posts=True,
                user_comments=True,
                user_memberships=True,
                user_attendances=True,
                users_tags=True,
            )
        }, 201

    #     if form.errors:
    #         print(form.errors)
    #         return render_template(
    #             "user_form.html", form=form, id=userId, errors=form.errors
    #         )

    #     return render_template("user_form.html", form=form, id=userId, errors=None)
    return form.errors, 400


@user_routes.route("/<int:userId>/profile/update", methods=["GET", "POST"])
@login_required
def update_profile(userId):
    """
    Update a profile linked to the current user and submit to the database.

    renders an empty form on get requests, validates and submits form on post requests

    The commented out code was to test if the post request works
    """
    user_to_edit = User.query.get(userId)

    if not user_to_edit:
        return {"errors": {"message": "Not Found"}}, 404

    if user_to_edit.id != current_user.id:
        return {
            "errors": {
                "message": "User is not the current user and cannot create a profile for another user"
            }
        }, 404

    form = UserForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        profile_image = form.profile_image.data

        if not profile_image:
            return {"message": "An image is required to create a profile."}, 400

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
        remove_file_from_s3(user_to_edit.profile_image_url)

        url = upload["url"]

        # Update the existing user with profile details
        user_to_edit.first_name = form.data["first_name"]
        user_to_edit.last_name = form.data["last_name"]
        user_to_edit.bio = form.data["bio"]
        user_to_edit.profile_image_url = url

        # Update the user's tags
        selected_tags = form.user_tags.data  # This returns a list of selected tags
        tags_to_add = Tag.query.filter(Tag.name.in_(selected_tags)).all()
        user_to_edit.users_tags = tags_to_add

        db.session.commit()
        return {
            "profile": user_to_edit.to_dict(
                posts=True,
                user_comments=True,
                user_memberships=True,
                user_attendances=True,
                users_tags=True,
            )
        }, 201

    #     if form.errors:
    #             print(form.errors)
    #             return render_template(
    #                     "user_form.html", form=form, id=userId, type="update", errors=form.errors
    #                 )

    #     return render_template(
    #             "user_form.html", form=form, id=userId, type="update", errors=None
    #         )
    return form.errors, 400


@user_routes.route("/<int:userId>/profile/delete", methods=["DELETE"])
@login_required
def delete_profile(userId):
    user = User.query.get(userId)

    if not user:
        return jsonify({"errors": {"message": "user not found"}}), 404

    if user.id != current_user.id:
        return jsonify({"errors": {"message": "Unauthorized"}}), 403

    # Clear profile-related fields
    user.first_name = None
    user.last_name = None
    user.bio = None
    user.profile_image_url = None
    user.users_tags = []

    db.session.commit()
    return jsonify({"message": "Profile deleted successfully"}), 200


@user_routes.route("/<int:userId>/add-tags", methods=["POST"])
@login_required
def add_tags(userId):
    user = User.query.get(userId)

    if not user:
        return jsonify({"errors": {"message": "User not found"}}), 404

    if user.id != current_user.id:
        return jsonify({"errors": {"message": "Unauthorized"}}), 403

    form = request.json
    new_tag_names = form.get("tags", [])

    # Fetch existing tags
    existing_tags = user.users_tags
    existing_tag_names = {tag.name for tag in existing_tags}

    # Fetch or create new tags
    for tag_name in new_tag_names:
        if tag_name not in existing_tag_names:
            tag = Tag.query.filter_by(name=tag_name).first()
            if not tag:
                tag = Tag(name=tag_name)
                db.session.add(tag)
            user.users_tags.append(tag)

    db.session.commit()
    return jsonify({"message": "Tags added successfully"}), 200
