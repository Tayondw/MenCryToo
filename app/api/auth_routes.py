from flask import Blueprint, request, abort, redirect, session
from app.models import User, db, Tag
from app.forms import LoginForm
from app.forms import SignUpForm
from flask_login import current_user, login_user, logout_user, login_required
from app.aws import get_unique_filename, upload_file_to_s3
from sqlalchemy.orm import selectinload, joinedload
import os
import pathlib
import requests
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from pip._vendor import cachecontrol
import google.auth.transport.requests
from tempfile import NamedTemporaryFile
import json

auth_routes = Blueprint("auth", __name__)


@auth_routes.route("/")
def authenticate():
    """
    Authenticates a user with optimized loading.
    """
    if current_user.is_authenticated:
        # Use optimized query with selective loading
        user = (
            db.session.query(User)
            .options(
                selectinload(User.users_tags),
                selectinload(User.memberships)
                .joinedload(User.memberships.property.mapper.class_.group)
                .load_only("id", "name", "image"),
                selectinload(User.posts).load_only(
                    "id", "title", "likes", "created_at", "updated_at"
                ),
                selectinload(User.attendances).load_only("id", "event_id"),
            )
            .filter(User.id == current_user.id)
            .first()
        )

        if user:
            return user.to_dict_optimized()

    return {"errors": {"message": "Unauthorized"}}, 401


@auth_routes.route("/login", methods=["POST"])
def login():
    """
    Logs a user in with optimized response
    """
    form = LoginForm()
    # Get the csrf_token from the request cookie and put it into the
    # form manually to validate_on_submit can be used
    form["csrf_token"].data = request.cookies["csrf_token"]
    if form.validate_on_submit():
        # Add the user to the session, we are logged in!
        user = User.query.filter(User.email == form.data["email"]).first()
        login_user(user)

        # Return minimal user data for faster response
        return user.to_dict_minimal()
    return form.errors, 401


@auth_routes.route("/logout")
def logout():
    """
    Logs a user out
    """
    logout_user()
    return {"message": "User logged out"}


@auth_routes.route("/signup", methods=["POST"])
def sign_up():
    """
    Creates a new user and logs them in
    """
    form = SignUpForm()
    form["csrf_token"].data = request.cookies["csrf_token"]
    if form.validate_on_submit():
        profile_image_url = form.profileImage.data

        if not profile_image_url:
            return {"message": "An image is required to create a profile."}, 400

        try:
            profile_image_url.filename = get_unique_filename(profile_image_url.filename)
            upload = upload_file_to_s3(profile_image_url)
        except Exception as e:
            return {"message": f"Image upload failed: {str(e)}"}, 500

        if "url" not in upload:
            return {
                "message": upload.get(
                    "errors", "Image upload failed. Please try again."
                )
            }, 400

        url = upload["url"]

        user = User(
            first_name=form.data["firstName"],
            last_name=form.data["lastName"],
            username=form.data["username"],
            email=form.data["email"],
            password=form.data["password"],
            bio=form.data["bio"],
            profile_image_url=url,
        )

        # Update the user's tags
        selected_tags = form.userTags.data  # This returns a list of selected tags
        tags_to_add = Tag.query.filter(Tag.name.in_(selected_tags)).all()
        user.users_tags = tags_to_add

        db.session.add(user)
        db.session.commit()
        login_user(user)

        # Return minimal data for faster response
        return user.to_dict_minimal()
    return form.errors, 401


@auth_routes.route("/unauthorized")
def unauthorized():
    """
    Returns unauthorized JSON when flask-login authentication fails
    """
    return {"errors": {"message": "Unauthorized"}}, 401


# from flask import Blueprint, request, abort, redirect, session
# from app.models import User, db, Tag, Group, Post, Membership, Attendance
# from app.forms import LoginForm
# from app.forms import SignUpForm
# from flask_login import current_user, login_user, logout_user, login_required
# from app.aws import get_unique_filename, upload_file_to_s3
# from sqlalchemy.orm import selectinload, joinedload
# import os
# import pathlib
# import requests
# from google.oauth2 import id_token
# from google_auth_oauthlib.flow import Flow
# from pip._vendor import cachecontrol
# import google.auth.transport.requests
# from tempfile import NamedTemporaryFile
# import json

# auth_routes = Blueprint("auth", __name__)


# @auth_routes.route("/")
# def authenticate():
#     """
#     Authenticates a user.
#     """
#     if current_user.is_authenticated:
#         # Eager load all relationships in one query
#         user = (
#             db.session.query(User)
#             .options(
#                 selectinload(User.posts).selectinload(Post.post_likes),
#                 selectinload(User.posts).selectinload(Post.post_comments),
#                 selectinload(User.user_comments),
#                 selectinload(User.memberships).selectinload(Membership.group),
#                 selectinload(User.attendances).selectinload(Attendance.event),
#                 selectinload(User.users_tags),
#                 selectinload(User.groups),
#                 selectinload(User.events),
#             )
#             .filter(User.id == current_user.id)
#             .first()
#         )

#         return user.to_dict(
#             posts=True,
#             user_comments=True,
#             memberships=True,
#             attendances=True,
#             users_tags=True,
#             events=True,
#             group=True,
#         )
#     return {"errors": {"message": "Unauthorized"}}, 401


# @auth_routes.route("/login", methods=["POST"])
# def login():
#     """
#     Logs a user in
#     """
#     form = LoginForm()
#     # Get the csrf_token from the request cookie and put it into the
#     # form manually to validate_on_submit can be used
#     form["csrf_token"].data = request.cookies["csrf_token"]
#     if form.validate_on_submit():
#         # Add the user to the session, we are logged in!
#         user = User.query.filter(User.email == form.data["email"]).first()
#         login_user(user)
#         return user.to_dict(
#             posts=True,
#             user_comments=True,
#             memberships=True,
#             attendances=True,
#             users_tags=True,
#             events=True,
#             group=True,
#         )
#     return form.errors, 401


# @auth_routes.route("/logout")
# def logout():
#     """
#     Logs a user out
#     """
#     logout_user()
#     return {"message": "User logged out"}


# @auth_routes.route("/signup", methods=["POST"])
# def sign_up():
#     """
#     Creates a new user and logs them in
#     """
#     form = SignUpForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]
#     if form.validate_on_submit():
#         profile_image_url = form.profileImage.data

#         if not profile_image_url:
#             return {"message": "An image is required to create a profile."}, 400

#         try:
#             profile_image_url.filename = get_unique_filename(profile_image_url.filename)
#             upload = upload_file_to_s3(profile_image_url)
#         except Exception as e:
#             return {"message": f"Image upload failed: {str(e)}"}, 500

#         if "url" not in upload:
#             return {
#                 "message": upload.get(
#                     "errors", "Image upload failed. Please try again."
#                 )
#             }, 400

#         url = upload["url"]

#         user = User(
#             first_name=form.data["firstName"],
#             last_name=form.data["lastName"],
#             username=form.data["username"],
#             email=form.data["email"],
#             password=form.data["password"],
#             bio=form.data["bio"],
#             profile_image_url=url,
#         )

#         # Update the user's tags
#         selected_tags = form.userTags.data  # This returns a list of selected tags
#         tags_to_add = Tag.query.filter(Tag.name.in_(selected_tags)).all()
#         user.users_tags = tags_to_add

#         db.session.add(user)
#         db.session.commit()
#         login_user(user)
#         return user.to_dict()
#     return form.errors, 401


# @auth_routes.route("/unauthorized")
# def unauthorized():
#     """
#     Returns unauthorized JSON when flask-login authentication fails
#     """
#     return {"errors": {"message": "Unauthorized"}}, 401
