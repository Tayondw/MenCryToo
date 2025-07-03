from flask import Blueprint, request, abort, render_template, jsonify
from flask_login import login_required, current_user
from app.models import (
    db,
    Group,
    User,
    Membership,
    Attendance,
    Venue,
    Event,
    EventImage,
)

from app.forms import EventForm, EventImageForm
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import func

event_routes = Blueprint("events", __name__)


# ! EVENTS
@event_routes.route("")
def all_events():
    """
    Query for all events and returns them in a list of event dictionaries
    """
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 50)

    # Optimized query with selective loading
    events_query = (
        db.session.query(Event)
        .options(
            joinedload(Event.groups)
            .load_only("id", "name", "organizer_id", "type", "city", "state", "image")
            .joinedload(Group.organizer)
            .load_only(
                "id", "username", "first_name", "last_name", "profile_image_url"
            ),
            joinedload(Event.venues).load_only(
                "id", "address", "city", "state", "latitude", "longitude"
            ),
            selectinload(Event.attendances).load_only("id", "user_id"),
            selectinload(Event.event_images).load_only("id", "event_image"),
        )
        .order_by(Event.start_date)
    )

    events = events_query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "events": [event.to_dict_minimal() for event in events.items],
            "pagination": {
                "page": page,
                "pages": events.pages,
                "per_page": per_page,
                "total": events.total,
                "has_next": events.has_next,
                "has_prev": events.has_prev,
            },
        }
    )


@event_routes.route("/<int:eventId>")
def event(eventId):
    """
    Query for event by id and returns that event in a dictionary
    """
    # Use optimized query with selective loading
    event = (
        db.session.query(Event)
        .options(
            joinedload(Event.groups)
            .load_only(
                "id", "name", "organizer_id", "type", "city", "state", "about", "image"
            )
            .joinedload(Group.organizer)
            .load_only(
                "id", "username", "first_name", "last_name", "profile_image_url"
            ),
            joinedload(Event.venues).load_only(
                "id", "address", "city", "state", "latitude", "longitude"
            ),
            selectinload(Event.attendances)
            .load_only("id", "user_id")
            .joinedload(Attendance.user)
            .load_only(
                "id", "username", "first_name", "last_name", "profile_image_url"
            ),
            selectinload(Event.event_images).load_only("id", "event_image"),
        )
        .filter(Event.id == eventId)
        .first()
    )

    if not event:
        return jsonify({"errors": {"message": "Event not found"}}), 404

    return jsonify(event.to_dict())


@event_routes.route("/<int:eventId>", methods=["DELETE"])
@login_required
def delete_event(eventId):
    """
    Delete a given event by its id
    """
    # Use get instead of filter for single record
    event_to_delete = Event.query.get(eventId)

    if not event_to_delete:
        return {"errors": {"message": "Not Found"}}, 404

    # Load group with minimal data
    group = (
        Group.query.options(db.load_only("organizer_id"))
        .filter_by(id=event_to_delete.group_id)
        .first()
    )
    if current_user.id != group.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    try:
        # Batch delete operations for better performance
        db.session.execute(
            EventImage.__table__.delete().where(EventImage.event_id == eventId)
        )
        db.session.execute(
            Attendance.__table__.delete().where(Attendance.event_id == eventId)
        )

        # Remove image from S3 if it exists
        if event_to_delete.image:
            remove_file_from_s3(event_to_delete.image)

        db.session.delete(event_to_delete)
        db.session.commit()

        return {"message": "Event deleted successfully"}, 200

    except Exception as e:
        db.session.rollback()
        return {"errors": {"message": "Error deleting event"}}, 500


# ! EVENT - ATTENDEES (FIXED WITH AUTO-ORGANIZER ATTENDANCE)
@event_routes.route("/<int:eventId>/attend-event", methods=["GET", "POST"])
@login_required
def attend_event(eventId):
    """
    Attend an event
    """
    # Get event and group data in one optimized query
    event = (
        db.session.query(Event)
        .options(
            joinedload(Event.groups).load_only("organizer_id"),
            selectinload(Event.attendances).load_only("user_id"),
        )
        .filter(Event.id == eventId)
        .first()
    )

    if not event:
        return {"errors": {"message": "Event Not Found"}}, 404

    # Check if the user is the organizer
    if event.groups.organizer_id == current_user.id:
        # Organizer is automatically attending - check if attendance record exists
        organizer_already_attending = any(
            attendance.user_id == current_user.id for attendance in event.attendances
        )

        if not organizer_already_attending:
            # Create attendance record for organizer if it doesn't exist
            try:
                new_attendance = Attendance(event_id=eventId, user_id=current_user.id)
                db.session.add(new_attendance)
                db.session.commit()

                return {
                    "message": "As the organizer, you are automatically attending this event",
                    "isOrganizer": True,
                    "attending": True,
                }, 200
            except Exception as e:
                db.session.rollback()
                return {
                    "errors": {"message": "Error setting organizer attendance"}
                }, 500
        else:
            return {
                "message": "You are the organizer and are already attending this event",
                "isOrganizer": True,
                "attending": True,
            }, 200

    # Check if the user is already attending using in-memory check
    user_already_attending = any(
        attendance.user_id == current_user.id for attendance in event.attendances
    )

    if user_already_attending:
        return {"message": "You are already attending this event"}, 400

    # Parse JSON request body
    data = request.get_json() if request.is_json else {}
    user_id = data.get("user_id", current_user.id)
    event_id = data.get("event_id", eventId)

    # Ensure data is valid
    if user_id != current_user.id:
        return {"message": "Invalid user ID"}, 400

    try:
        new_attendance = Attendance(event_id=event_id, user_id=user_id)
        db.session.add(new_attendance)
        db.session.commit()

        return {
            "message": "Successfully joined the event",
            "attending": True,
            "isOrganizer": False,
        }, 200

    except Exception as e:
        db.session.rollback()
        return {"errors": {"message": "Error attending event"}}, 500


@event_routes.route("/<int:eventId>/leave-event/<int:attendeeId>", methods=["DELETE"])
@login_required
def leave_event(eventId, attendeeId):
    """
    Leave an event
    """
    # Get event and attendance data in one query
    event = (
        db.session.query(Event)
        .options(joinedload(Event.groups).load_only("organizer_id"))
        .filter(Event.id == eventId)
        .first()
    )

    if not event:
        return {"errors": {"message": "Event not found"}}, 404

    # Check if the attendee exists
    attendee = Attendance.query.filter_by(event_id=eventId, user_id=attendeeId).first()
    if not attendee:
        return {"message": "User is not an attendee of this event"}, 400

    # If the current user is trying to leave the event
    if attendeeId == current_user.id:
        if event.groups.organizer_id == current_user.id:
            return {
                "message": "As the organizer, you must attend the event. Transfer organizer role to someone else if you cannot attend.",
                "isOrganizer": True,
            }, 403

        try:
            db.session.delete(attendee)
            db.session.commit()
            return {
                "message": "You have successfully left the event",
                "attending": False,
            }, 200
        except Exception as e:
            db.session.rollback()
            return {"errors": {"message": "Error leaving event"}}, 500

    # If the current user is trying to remove another attendee
    if event.groups.organizer_id != current_user.id:
        return {"message": "Only the organizer can remove attendees"}, 403

    if attendeeId == event.groups.organizer_id:
        return {
            "message": "The organizer cannot be removed from the event",
            "isOrganizer": True,
        }, 400

    try:
        db.session.delete(attendee)
        db.session.commit()
        return {"message": "Attendee successfully removed from the event"}, 200
    except Exception as e:
        db.session.rollback()
        return {"errors": {"message": "Error removing attendee"}}, 500


# ! EVENT IMAGES
@event_routes.route("/<int:eventId>/images", methods=["GET", "POST"])
@login_required
def add_event_image(eventId):
    """
    Add an event image by the event's id
    """
    # Optimized query to get event and group data in one query
    event = (
        db.session.query(Event)
        .options(joinedload(Event.groups).load_only("organizer_id"))
        .filter(Event.id == eventId)
        .first()
    )

    if not event:
        return {"errors": {"message": "Not Found"}}, 404

    if current_user.id != event.groups.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = EventImageForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        event_image = form.event_image.data

        if event_image:
            try:
                event_image.filename = get_unique_filename(event_image.filename)
                upload = upload_file_to_s3(event_image)

                if "url" not in upload:
                    return {"message": "unable to locate url"}, 400

                url = upload["url"]
                new_event_image = EventImage(event_id=eventId, event_image=url)
                db.session.add(new_event_image)
                db.session.commit()

                return {"event_image": new_event_image.to_dict()}, 201

            except Exception as e:
                return {"message": f"Image upload failed: {str(e)}"}, 500
        else:
            return {"message": "Event image is None"}, 400

    return form.errors, 400


@event_routes.route("/<int:eventId>/images/<int:imageId>/edit", methods=["POST"])
@login_required
def edit_event_images(eventId, imageId):
    """
    Update event image
    """
    # Get image and check authorization in one query
    event_image = (
        db.session.query(EventImage)
        .join(Event)
        .join(Group)
        .options(
            joinedload(EventImage.event)
            .joinedload(Event.groups)
            .load_only("organizer_id")
        )
        .filter(EventImage.id == imageId, Event.id == eventId)
        .first()
    )

    if not event_image:
        return {"errors": {"message": "Not Found"}}, 404

    if current_user.id != event_image.event.groups.organizer_id:
        return {"errors": {"message": "Unauthorized"}}, 401

    form = EventImageForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        edit_event_image = form.data["event_image"]

        if not edit_event_image:
            return {"message": "No image provided"}, 400

        edit_event_image.filename = get_unique_filename(edit_event_image.filename)
        upload = upload_file_to_s3(edit_event_image)

        if "url" not in upload:
            return {"message": "Upload failed"}, 400

        # Remove the old image from S3
        remove_file_from_s3(event_image.event_image)

        event_image.event_image = upload["url"]
        db.session.commit()
        return {"event_image": event_image.to_dict()}, 200

    return form.errors, 400
