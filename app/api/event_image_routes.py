from flask import Blueprint, request, abort
from flask_login import login_required, current_user
from app.models import (
    db,
    Group,
    User,
    Memberships,
    Event,
    EventImage,
)

from app.aws import remove_file_from_s3

event_image_routes = Blueprint("event_images", __name__)


# ! GROUP IMAGES
@event_image_routes.route("<int:imageId>", methods=["DELETE"])
@login_required
def delete_event_image(imageId):
    """
    Deletes an event image if the user is authorized.

    Returns:
        401 Unauthorized if the current user is not the group's organizer.
        404 Not Found if the event or image does not exist.
    """

    event_image = EventImage.query.get(imageId)
    event = Event.query.get(event_image.event_id)
    group = Group.query.get(event.group_id)

    # check if there is event
    if not event:
        return {"errors": {"message": "Not Found"}}, 404

    # Check if the image exists
    if not event_image:
        return {"errors": {"message": "Not Found"}}, 404

    # Check if the current user is the group organizer
    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    # Remove the image from S3
    remove_file_from_s3(event_image.event_image)

    # Delete the image record from the database
    db.session.delete(event_image)
    db.session.commit()

    return {"message": "Event image deleted successfully"}, 200
