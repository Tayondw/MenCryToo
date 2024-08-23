from flask import Blueprint, request, abort
from flask_login import login_required, current_user
from app.models import (
    db,
    Group,
    GroupImage,
    User,
    Memberships,
)
from app.forms import GroupForm, GroupImageForm
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3

group_image_routes = Blueprint("group_images", __name__)


@group_image_routes.route("<int:imageId>", methods=["DELETE"])
@login_required
def delete_group_image(imageId):
    """
    Deletes a group image if the user is authorized.

    Returns:
        401 Unauthorized if the current user is not the group's organizer.
        404 Not Found if the group or image does not exist.
    """

    group_image = GroupImage.query.get(imageId)
    group = Group.query.get(group_image.group_id)

    # Check if the image exists
    if not group_image:
        return {"errors": {"message": "Not Found"}}, 404

    # Check if the current user is the group organizer
    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    # Remove the image from S3
    remove_file_from_s3(group_image.group_image)

    # Delete the image record from the database
    db.session.delete(group_image)
    db.session.commit()

    return {"message": "Group image deleted successfully"}, 200
