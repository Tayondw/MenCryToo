from flask import Blueprint, jsonify, render_template, request, redirect, abort
from flask_login import login_required, current_user
from app.models import db, User, Group, Event, Post, UserTags, Tag
from app.forms import UserForm
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3

user_routes = Blueprint('users', __name__)


@user_routes.route('/')
@login_required
def users():
    """
    Query for all users and returns them in a list of user dictionaries
    """
    users = User.query.all()
    return {'users': [user.to_dict() for user in users]}


@user_routes.route('/<int:id>')
@login_required
def user(id):
    """
    Query for a user by id and returns that user in a dictionary
    """
    user = User.query.get(id)
    return user.to_dict(
        posts=True,
        user_comments=True,
        user_memberships=True,
        user_attendances=True,
        users_tags=True,
    )


@user_routes.route("/<int:userId>/profile/create", methods=["GET", "POST"])
@login_required
def create_profile(userId):
    """
    Create or update a profile linked to the current user and submit to the database.
    """
    user = User.query.get(userId)

    if not user:
        return {"errors": {"message": "Not Found"}}, 404

    if user.profile_image_url:
        return {"errors": {"message": "User already has a profile"}}, 404

    if user.id != current_user.id:
        return {"errors": {"message": "User is not the current user and cannot create a profile for another user"}}, 404

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

    if form.errors:
        print(form.errors)
        return render_template(
            "user_form.html", form=form, id=userId, errors=form.errors
        )

    return render_template("user_form.html", form=form, id=userId, errors=None)
