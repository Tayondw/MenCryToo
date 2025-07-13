from flask import Blueprint, request, abort, redirect, session
from app.models import User, db, Tag, Event, Attendance, Group, Membership, Post, Comment
from app.forms import LoginForm
from app.forms import SignUpForm
from flask_login import current_user, login_user, logout_user, login_required
from app.aws import get_unique_filename, upload_file_to_s3
from sqlalchemy.orm import selectinload, joinedload, load_only
from sqlalchemy import func
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
    Authenticates a user with optimized response handling.
    Returns 200 with user data for authenticated users, 200 with null for unauthenticated.
    """
    if not current_user.is_authenticated:
        # Return structured response instead of 401 error
        return {"user": None, "authenticated": False}, 200

    try:
        # Load user with ALL groups and events relationships
        user = (
            db.session.query(User)
            .options(
                # Load user tags
                selectinload(User.users_tags).load_only("id", "name"),
                # Load groups where user is a MEMBER
                selectinload(User.memberships)
                .joinedload(Membership.group)
                .options(
                    load_only(
                        "id",
                        "name",
                        "about",
                        "image",
                        "city",
                        "state",
                        "type",
                        "organizer_id",
                    ),
                    selectinload(Group.memberships).load_only("id"),  # For member count
                ),
                # Load groups where user is ORGANIZER
                selectinload(User.groups).options(
                    load_only(
                        "id",
                        "name",
                        "about",
                        "image",
                        "city",
                        "state",
                        "type",
                        "organizer_id",
                    ),
                    selectinload(Group.memberships).load_only("id"),  # For member count
                ),
                # Load events user is ATTENDING
                selectinload(User.attendances)
                .joinedload(Attendance.event)
                .options(
                    load_only(
                        "id",
                        "name",
                        "description",
                        "type",
                        "capacity",
                        "image",
                        "start_date",
                        "end_date",
                        "group_id",
                        "venue_id",
                    ),
                    # Load group info for each event
                    joinedload(Event.groups).load_only("name"),
                    # Load venue info for each event
                    joinedload(Event.venues).load_only("address", "city", "state"),
                    # Load attendee count
                    selectinload(Event.attendances).load_only("id"),
                ),
            )
            .filter(User.id == current_user.id)
            .first()
        )

        if user:
            return {
                "user": user.to_dict_auth_with_complete_data(),
                "authenticated": True,
            }
        else:
            return {"user": None, "authenticated": False}, 200

    except Exception as e:
        print(f"Auth error: {str(e)}")
        return {"user": None, "authenticated": False}, 200


@auth_routes.route("/login", methods=["POST"])
def login():
    """
    Logs a user in with minimal response data for faster login
    """
    form = LoginForm()
    # Get the csrf_token from the request cookie and put it into the
    # form manually to validate_on_submit can be used
    form["csrf_token"].data = request.cookies["csrf_token"]
    if form.validate_on_submit():
        # Add the user to the session, we are logged in!
        user = User.query.filter(User.email == form.data["email"]).first()
        login_user(user)

        # Return only essential data for login
        return user.to_dict_auth()
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

        # Update the user's tags efficiently
        selected_tags = form.userTags.data
        if selected_tags:
            tags_to_add = Tag.query.filter(Tag.name.in_(selected_tags)).all()
            user.users_tags = tags_to_add

        db.session.add(user)
        db.session.commit()
        login_user(user)

        # Return minimal data for faster response
        return user.to_dict_auth()
    return form.errors, 401


@auth_routes.route("/profile")
@login_required
def get_profile():
    """
    Endpoint specifically for the profile page.
    Returns all data needed for profile display in a single efficient query.
    """
    if current_user.is_authenticated:
        # Single query with selective loading
        user = (
            db.session.query(User)
            .options(
                # Load user tags
                selectinload(User.users_tags).load_only("id", "name"),
                # Load groups where user is a MEMBER
                selectinload(User.memberships)
                .joinedload(Membership.group)
                .options(
                    load_only(
                        "id",
                        "name",
                        "about",
                        "image",
                        "city",
                        "state",
                        "type",
                        "organizer_id",
                    ),
                    selectinload(Group.memberships).load_only("id"),  # For count
                ),
                # Load groups where user is ORGANIZER
                selectinload(User.groups).options(
                    load_only(
                        "id",
                        "name",
                        "about",
                        "image",
                        "city",
                        "state",
                        "type",
                        "organizer_id",
                    ),
                    selectinload(Group.memberships).load_only("id"),  # For count
                ),
                # Load events user is ATTENDING
                selectinload(User.attendances)
                .joinedload(Attendance.event)
                .options(
                    load_only(
                        "id",
                        "name",
                        "description",
                        "type",
                        "capacity",
                        "image",
                        "start_date",
                        "end_date",
                        "group_id",
                        "venue_id",
                    ),
                    joinedload(Event.groups).load_only("id", "name"),
                    joinedload(Event.venues).load_only("address", "city", "state"),
                    selectinload(Event.attendances).load_only("id"),  # For count
                ),
                # Load posts WITHOUT automatic comment loading to avoid N+1
                selectinload(User.posts).options(
                    load_only(
                        "id",
                        "title",
                        "caption",
                        "image",
                        "creator",
                        "created_at",
                        "updated_at",
                    ),
                    selectinload(Post.post_likes).load_only("id"),  # For count
                    # Remove automatic comment loading to prevent N+1 queries
                ),
                # Load recent comments (limited for performance)
                selectinload(User.user_comments).load_only(
                    "id",
                    "user_id",
                    "post_id",
                    "comment",
                    "parent_id",
                    "created_at",
                    "updated_at",
                ),
            )
            .filter(User.id == current_user.id)
            .first()
        )

        if user:
            # Get comment counts for all user's posts in a single query
            post_ids = [post.id for post in user.posts]
            comment_counts = {}

            if post_ids:
                # Efficient bulk query for comment counts
                comment_count_results = (
                    db.session.query(
                        Comment.post_id, func.count(Comment.id).label("comment_count")
                    )
                    .filter(Comment.post_id.in_(post_ids))
                    .group_by(Comment.post_id)
                    .all()
                )

                comment_counts = {
                    result.post_id: result.comment_count
                    for result in comment_count_results
                }

            # Create the profile dict with enhanced post data
            profile_data = user.to_dict_profile()

            # Enhance posts with comment counts
            if "posts" in profile_data and profile_data["posts"]:
                for post_data in profile_data["posts"]:
                    post_id = post_data.get("id")
                    if post_id:
                        # Add the comment count to each post
                        post_data["comments"] = comment_counts.get(post_id, 0)

            return profile_data

    return {"errors": {"message": "Unauthorized"}}, 401

@auth_routes.route("/unauthorized")
def unauthorized():
    """
    Returns unauthorized JSON when flask-login authentication fails
    """
    return {"errors": {"message": "Unauthorized"}}, 401


# from flask import Blueprint, request, abort, redirect, session
# from app.models import User, db, Tag, Event, Attendance, Group, Membership, Post
# from app.forms import LoginForm
# from app.forms import SignUpForm
# from flask_login import current_user, login_user, logout_user, login_required
# from app.aws import get_unique_filename, upload_file_to_s3
# from sqlalchemy.orm import selectinload, joinedload, load_only
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
#     Authenticates a user with complete groups and events data for home page display.
#     """
#     if current_user.is_authenticated:
#         # Load user with ALL groups and events relationships
#         user = (
#             db.session.query(User)
#             .options(
#                 # Load user tags
#                 selectinload(User.users_tags).load_only("id", "name"),
#                 # Load groups where user is a MEMBER
#                 selectinload(User.memberships)
#                 .joinedload(Membership.group)
#                 .options(
#                     load_only(
#                         "id",
#                         "name",
#                         "about",
#                         "image",
#                         "city",
#                         "state",
#                         "type",
#                         "organizer_id",
#                     ),
#                     selectinload(Group.memberships).load_only("id"),  # For member count
#                 ),
#                 # Load groups where user is ORGANIZER
#                 selectinload(User.groups).options(
#                     load_only(
#                         "id",
#                         "name",
#                         "about",
#                         "image",
#                         "city",
#                         "state",
#                         "type",
#                         "organizer_id",
#                     ),
#                     selectinload(Group.memberships).load_only("id"),  # For member count
#                 ),
#                 # Load events user is ATTENDING
#                 selectinload(User.attendances)
#                 .joinedload(Attendance.event)
#                 .options(
#                     load_only(
#                         "id",
#                         "name",
#                         "description",
#                         "type",
#                         "capacity",
#                         "image",
#                         "start_date",
#                         "end_date",
#                         "group_id",
#                         "venue_id",
#                     ),
#                     # Load group info for each event
#                     joinedload(Event.groups).load_only("name"),
#                     # Load venue info for each event
#                     joinedload(Event.venues).load_only("address", "city", "state"),
#                     # Load attendee count
#                     selectinload(Event.attendances).load_only("id"),
#                 ),
#             )
#             .filter(User.id == current_user.id)
#             .first()
#         )

#         if user:
#             return user.to_dict_auth_with_complete_data()

#     return {"errors": {"message": "Unauthorized"}}, 401


# @auth_routes.route("/login", methods=["POST"])
# def login():
#     """
#     Logs a user in with minimal response data for faster login
#     """
#     form = LoginForm()
#     # Get the csrf_token from the request cookie and put it into the
#     # form manually to validate_on_submit can be used
#     form["csrf_token"].data = request.cookies["csrf_token"]
#     if form.validate_on_submit():
#         # Add the user to the session, we are logged in!
#         user = User.query.filter(User.email == form.data["email"]).first()
#         login_user(user)

#         # Return only essential data for login
#         return user.to_dict_auth()
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

#         # Update the user's tags efficiently
#         selected_tags = form.userTags.data
#         if selected_tags:
#             tags_to_add = Tag.query.filter(Tag.name.in_(selected_tags)).all()
#             user.users_tags = tags_to_add

#         db.session.add(user)
#         db.session.commit()
#         login_user(user)

#         # Return minimal data for faster response
#         return user.to_dict_auth()
#     return form.errors, 401


# @auth_routes.route("/profile")
# @login_required
# def get_profile():
#     """
#     Endpoint specifically for the profile page.
#     Returns all data needed for profile display in a single efficient query.
#     """
#     if current_user.is_authenticated:
#         # Single query with selective loading
#         user = (
#             db.session.query(User)
#             .options(
#                 # Load user tags
#                 selectinload(User.users_tags).load_only("id", "name"),
#                 # Load groups where user is a MEMBER
#                 selectinload(User.memberships)
#                 .joinedload(Membership.group)
#                 .options(
#                     load_only(
#                         "id",
#                         "name",
#                         "about",
#                         "image",
#                         "city",
#                         "state",
#                         "type",
#                         "organizer_id",
#                     ),
#                     selectinload(Group.memberships).load_only("id"),  # For count
#                 ),
#                 # Load groups where user is ORGANIZER
#                 selectinload(User.groups).options(
#                     load_only(
#                         "id",
#                         "name",
#                         "about",
#                         "image",
#                         "city",
#                         "state",
#                         "type",
#                         "organizer_id",
#                     ),
#                     selectinload(Group.memberships).load_only("id"),  # For count
#                 ),
#                 # Load events user is ATTENDING
#                 selectinload(User.attendances)
#                 .joinedload(Attendance.event)
#                 .options(
#                     load_only(
#                         "id",
#                         "name",
#                         "description",
#                         "type",
#                         "capacity",
#                         "image",
#                         "start_date",
#                         "end_date",
#                         "group_id",
#                         "venue_id",
#                     ),
#                     joinedload(Event.groups).load_only("id", "name"),
#                     joinedload(Event.venues).load_only("address", "city", "state"),
#                     selectinload(Event.attendances).load_only("id"),  # For count
#                 ),
#                 # Load recent posts (limited to 20 for performance)
#                 selectinload(User.posts).options(
#                     load_only(
#                         "id",
#                         "title",
#                         "caption",
#                         "image",
#                         "creator",
#                         "created_at",
#                         "updated_at",
#                     ),
#                     selectinload(Post.post_likes).load_only("id"),  # For count
#                     selectinload(Post.post_comments).load_only("id"),  # For count
#                 ),
#                 # Load recent comments (limited for performance)
#                 selectinload(User.user_comments).load_only(
#                     "id",
#                     "user_id",
#                     "post_id",
#                     "comment",
#                     "parent_id",
#                     "created_at",
#                     "updated_at",
#                 ),
#             )
#             .filter(User.id == current_user.id)
#             .first()
#         )

#         if user:
#             return user.to_dict_profile()

#     return {"errors": {"message": "Unauthorized"}}, 401


# @auth_routes.route("/unauthorized")
# def unauthorized():
#     """
#     Returns unauthorized JSON when flask-login authentication fails
#     """
#     return {"errors": {"message": "Unauthorized"}}, 401


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
