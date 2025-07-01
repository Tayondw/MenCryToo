from flask import Blueprint, request, abort
from flask_login import login_required, current_user
from app.models import (
    db,
    Group,
    GroupImage,
    User,
    Membership,
)
from app.aws import remove_file_from_s3
from sqlalchemy.orm import joinedload

group_image_routes = Blueprint("group_images", __name__)


@group_image_routes.route("<int:imageId>", methods=["DELETE"])
@login_required
def delete_group_image(imageId):
    """
    Deletes a group image if the user is authorized - optimized with single query
    """
    # Optimized query to get group image and group data in one go
    group_image = (
        db.session.query(GroupImage)
        .join(Group)
        .options(joinedload(GroupImage.group).load_only("organizer_id"))
        .filter(GroupImage.id == imageId)
        .first()
    )

    # Check if the image exists
    if not group_image:
        return {"errors": {"message": "Not Found"}}, 404

    # Check if the current user is the group organizer
    if current_user.id != group_image.group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    try:
        # Remove the image from S3 first (in case of database rollback)
        if group_image.group_image:
            remove_file_from_s3(group_image.group_image)

        # Delete the image record from the database
        db.session.delete(group_image)
        db.session.commit()

        return {"message": "Group image deleted successfully"}, 200

    except Exception as e:
        db.session.rollback()
        return {"errors": {"message": "Error deleting group image"}}, 500


# from flask import Blueprint, request, abort
# from flask_login import login_required, current_user
# from app.models import (
#     db,
#     Group,
#     GroupImage,
#     User,
#     Membership,
# )
# from app.aws import remove_file_from_s3

# group_image_routes = Blueprint("group_images", __name__)


# # ! GROUP IMAGES
# @group_image_routes.route("<int:imageId>", methods=["DELETE"])
# @login_required
# def delete_group_image(imageId):
#     """
#     Deletes a group image if the user is authorized.

#     Returns:
#         401 Unauthorized if the current user is not the group's organizer.
#         404 Not Found if the group or image does not exist.
#     """

#     group_image = GroupImage.query.get(imageId)
#     group = Group.query.get(group_image.group_id)

#     # Check if the image exists
#     if not group_image:
#         return {"errors": {"message": "Not Found"}}, 404

#     # Check if the current user is the group organizer
#     if current_user.id != group.organizer_id:
#         return {"errors": {"message": "Unauthorized"}}, 401

#     # Remove the image from S3
#     remove_file_from_s3(group_image.group_image)

#     # Delete the image record from the database
#     db.session.delete(group_image)
#     db.session.commit()

#     return {"message": "Group image deleted successfully"}, 200
