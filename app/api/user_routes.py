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
from sqlalchemy import func, and_
import requests
import json

user_routes = Blueprint("users", __name__)


@user_routes.route("/")
@login_required
def users():
    """
    Query for all users with pagination and minimal data loading
    """
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 50, type=int), 100)

    # Load only essential data for user list
    users_query = db.session.query(User).options(
        selectinload(User.users_tags).load_only("id", "name"),
    )

    users = users_query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "users": [user.to_dict_list() for user in users.items],
            "pagination": {
                "page": page,
                "pages": users.pages,
                "per_page": per_page,
                "total": users.total,
                "has_next": users.has_next,
                "has_prev": users.has_prev,
            },
        }
    )


@user_routes.route("/<int:userId>")
@login_required
def user(userId):
    """
    Query for a user by id with loading strategy
    """
    # Load user with minimal essential data first
    user = (
        db.session.query(User)
        .options(
            selectinload(User.users_tags).load_only("id", "name"),
            selectinload(User.memberships)
            .joinedload(Membership.group)
            .load_only("id", "name", "image", "city", "state"),
            selectinload(User.attendances).load_only("id", "event_id"),
            selectinload(User.groups).load_only("id", "name", "image"),
        )
        .filter(User.id == userId)
        .first()
    )

    if not user:
        return jsonify({"errors": {"message": "User not found"}}), 404

    # Load posts with pagination and minimal data
    posts = (
        db.session.query(Post)
        .options(
            selectinload(Post.post_likes).load_only("id"),
        )
        .filter(Post.creator == userId)
        .order_by(Post.created_at.desc())
        .limit(20)  # Limit recent posts
        .all()
    )

    # Load recent comments only
    comments = (
        db.session.query(Comment)
        .filter(Comment.user_id == userId)
        .order_by(Comment.created_at.desc())
        .limit(10)  # Limit recent comments
        .all()
    )

    return jsonify(user.to_dict_profile(posts=posts, comments=comments))


@user_routes.route("/profile-feed")
@login_required
def view_all_profiles():
    """
    Profile feed with reduced data loading
    """
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 50)

    # Get current user's tags for similarity matching
    current_user_tags = (
        db.session.query(Tag.id)
        .join(UserTags)
        .filter(UserTags.c.user_id == current_user.id)
        .subquery()
    )

    # Find users with similar tags (at least one common tag)
    users_query = (
        db.session.query(User)
        .join(UserTags)
        .join(current_user_tags, UserTags.c.tag_id == current_user_tags.c.id)
        .filter(
            and_(
                User.profile_image_url.isnot(None),
                User.id != current_user.id,  # Exclude current user
            )
        )
        .options(
            selectinload(User.users_tags).load_only("id", "name"),
        )
        .distinct()
    )

    users = users_query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "users_profile": [user.to_dict_feed() for user in users.items],
            "pagination": {
                "page": page,
                "pages": users.pages,
                "per_page": per_page,
                "total": users.total,
                "has_next": users.has_next,
                "has_prev": users.has_prev,
            },
        }
    )


@user_routes.route("/<int:userId>/profile/update", methods=["POST"])
@login_required
def update_profile(userId):
    """
    Profile update with minimal data return
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

        # Update user fields
        user_to_edit.first_name = form.data["firstName"]
        user_to_edit.last_name = form.data["lastName"]
        user_to_edit.bio = form.data["bio"]
        user_to_edit.username = form.data["username"]
        user_to_edit.email = form.data["email"]

        # Efficient tag update
        if form.userTags.data:
            # Clear existing tags and add new ones in one operation
            user_to_edit.users_tags.clear()
            selected_tags = form.userTags.data
            tags_to_add = Tag.query.filter(Tag.name.in_(selected_tags)).all()
            user_to_edit.users_tags.extend(tags_to_add)

        db.session.commit()

        # Return minimal response for faster update
        return {"profile": user_to_edit.to_dict_auth()}, 201

    return form.errors, 400


@user_routes.route("/<int:userId>/profile/delete", methods=["DELETE"])
@login_required
def delete_profile(userId):
    """
    Profile deletion with efficient batch operations
    """
    user = User.query.get(userId)

    if not user:
        return jsonify({"errors": {"message": "user not found"}}), 404

    if user.id != current_user.id:
        return jsonify({"errors": {"message": "Unauthorized"}}), 403

    try:
        # Use efficient bulk delete operations
        # Delete in correct order to avoid foreign key constraints

        # Delete attendances
        db.session.execute(
            "DELETE FROM attendances WHERE user_id = :user_id", {"user_id": userId}
        )

        # Delete memberships
        db.session.execute(
            "DELETE FROM memberships WHERE user_id = :user_id", {"user_id": userId}
        )

        # Delete comments
        db.session.execute(
            "DELETE FROM comments WHERE user_id = :user_id", {"user_id": userId}
        )

        # Delete post likes
        db.session.execute(
            "DELETE FROM likes WHERE user_id = :user_id", {"user_id": userId}
        )

        # Delete posts
        db.session.execute(
            "DELETE FROM posts WHERE creator = :user_id", {"user_id": userId}
        )

        # Delete user tags
        db.session.execute(
            "DELETE FROM user_tags WHERE user_id = :user_id", {"user_id": userId}
        )

        # Handle groups organized by the user
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
    """
    Tag addition
    """
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

        # Get or create new tags efficiently
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
    Create post with single form processing
    """
    # Verify user exists
    user = User.query.get(userId)
    if not user:
        return {"errors": {"message": "Not Found"}}, 404

    # Check authorization
    if current_user.id != userId:
        return {"errors": {"message": "Unauthorized"}}, 401

    # Get form data directly from request
    title = request.form.get("title", "").strip()
    caption = request.form.get("caption", "").strip()
    image_file = request.files.get("image")

    # Manual validation (no WTF forms to avoid formData conflicts)
    errors = {}

    if not title or len(title) < 5 or len(title) > 25:
        errors["title"] = "Title must be between 5 and 25 characters"

    if not caption or len(caption) < 50 or len(caption) > 500:
        errors["caption"] = "Caption must be between 50 and 500 characters"

    if not image_file or image_file.filename == "":
        errors["image"] = "An image is required to create a post"

    if errors:
        return {"errors": errors}, 400

    try:
        # Handle image upload
        image_file.filename = get_unique_filename(image_file.filename)
        upload = upload_file_to_s3(image_file)

        if "url" not in upload:
            return {
                "message": upload.get(
                    "errors", "Image upload failed. Please try again."
                )
            }, 400

        # Create post
        new_post = Post(
            creator=userId,
            title=title,
            caption=caption,
            image=upload["url"],
        )

        db.session.add(new_post)
        db.session.commit()

        # Return minimal post data
        return {"post": new_post.to_dict_create()}, 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating post: {str(e)}")
        return {"errors": {"server": "Failed to create post. Please try again."}}, 500


@user_routes.route("/<int:userId>/posts/<int:postId>", methods=["POST"])
@login_required
def edit_post(userId, postId):
    """
    Edit post with single form processing
    """
    post_to_edit = Post.query.get(postId)
    if not post_to_edit:
        return {"errors": {"message": "Not Found"}}, 404

    user = User.query.get(userId)
    if not user:
        return {"errors": {"message": "Not Found"}}, 404

    if current_user.id != userId:
        return {"errors": {"message": "Unauthorized"}}, 401

    # Get form data directly from request
    title = request.form.get("title", "").strip()
    caption = request.form.get("caption", "").strip()
    image_file = request.files.get("image")

    # Manual validation
    errors = {}

    if not title or len(title) < 5 or len(title) > 25:
        errors["title"] = "Title must be between 5 and 25 characters"

    if not caption or len(caption) < 50 or len(caption) > 500:
        errors["caption"] = "Caption must be between 50 and 500 characters"

    if errors:
        return {"errors": errors}, 400

    try:
        # Update post fields
        post_to_edit.title = title
        post_to_edit.caption = caption

        # Handle image update if provided
        if image_file and image_file.filename != "":
            image_file.filename = get_unique_filename(image_file.filename)
            upload = upload_file_to_s3(image_file)

            if "url" not in upload:
                return {"message": "Upload failed"}, 400

            # Remove old image from S3
            if post_to_edit.image:
                remove_file_from_s3(post_to_edit.image)

            post_to_edit.image = upload["url"]

        db.session.commit()
        return {"post": post_to_edit.to_dict_create()}, 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating post: {str(e)}")
        return {"errors": {"server": "Failed to update post. Please try again."}}, 500
