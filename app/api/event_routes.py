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
@event_routes.route("/")
def all_events():
    """
    Query for all events and returns them in a list of event dictionaries - with pagination and optimized loading
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
    Query for event by id and returns that event in a dictionary - optimized loading
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
    Delete a given event by its id - optimized with batch operations
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


# ! EVENT IMAGES
@event_routes.route("/<int:eventId>/images", methods=["GET", "POST"])
@login_required
def add_event_image(eventId):
    """
    Add an event image by the event's id - optimized authorization check
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
    Update event image - optimized authorization check
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


# ! EVENT - ATTENDEES
@event_routes.route("/<int:eventId>/attend-event", methods=["GET", "POST"])
@login_required
def attend_event(eventId):
    """
    Attend an event - optimized with single query and batch operations
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

    # Prevent the organizer from attending as a member
    if event.groups.organizer_id == current_user.id:
        return {
            "message": "User is the organizer and is currently attending the event"
        }, 403

    # Check if the user is already attending using in-memory check
    user_already_attending = any(
        attendance.user_id == current_user.id for attendance in event.attendances
    )

    if user_already_attending:
        return {"message": "Currently attending the event"}, 400

    # Parse JSON request body
    data = request.get_json()
    user_id = data.get("user_id") if data else current_user.id
    event_id = data.get("event_id") if data else eventId

    # Ensure data is valid
    if user_id != current_user.id:
        return jsonify({"message": "Invalid user ID"}), 400

    try:
        new_attendance = Attendance(event_id=event_id, user_id=user_id)
        db.session.add(new_attendance)
        db.session.commit()

        return {"message": "Successfully attended the event"}, 200

    except Exception as e:
        db.session.rollback()
        return {"errors": {"message": "Error attending event"}}, 500


@event_routes.route("/<int:eventId>/leave-event/<int:attendeeId>", methods=["DELETE"])
@login_required
def leave_event(eventId, attendeeId):
    """
    Leave an event - optimized with single query
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
            return {"message": "The organizer must attend the event"}, 403

        try:
            db.session.delete(attendee)
            db.session.commit()
            return {"message": "You have successfully left the event"}, 200
        except Exception as e:
            db.session.rollback()
            return {"errors": {"message": "Error leaving event"}}, 500

    # If the current user is trying to remove another attendee
    if event.groups.organizer_id != current_user.id:
        return {"message": "Only the organizer can remove attendees"}, 403

    if attendeeId == event.groups.organizer_id:
        return {"message": "The organizer must attend the event"}, 400

    try:
        db.session.delete(attendee)
        db.session.commit()
        return {"message": "Attendee successfully removed from the event"}, 200
    except Exception as e:
        db.session.rollback()
        return {"errors": {"message": "Error removing attendee"}}, 500


# from flask import Blueprint, request, abort, render_template, jsonify
# from flask_login import login_required, current_user
# from app.models import (
#     db,
#     Group,
#     User,
#     Membership,
#     Attendance,
#     Venue,
#     Event,
#     EventImage,
# )

# from app.forms import EventForm, EventImageForm
# from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3
# from sqlalchemy.orm import joinedload, selectinload

# event_routes = Blueprint("events", __name__)


# # ! EVENTS
# @event_routes.route("/")
# def all_events():
#     """
#     Query for all events and returns them in a list of event dictionaries - with pagination
#     """
#     page = request.args.get("page", 1, type=int)
#     per_page = min(request.args.get("per_page", 20, type=int), 50)

#     events_query = (
#         db.session.query(Event)
#         .options(
#             joinedload(Event.groups).joinedload(Group.organizer),
#             joinedload(Event.venues),
#             selectinload(Event.attendances),
#             selectinload(Event.event_images),
#         )
#         .order_by(Event.start_date)
#     )

#     events = events_query.paginate(page=page, per_page=per_page, error_out=False)

#     return jsonify(
#         {
#             "events": [event.to_dict() for event in events.items],
#             "pagination": {
#                 "page": page,
#                 "pages": events.pages,
#                 "per_page": per_page,
#                 "total": events.total,
#                 "has_next": events.has_next,
#                 "has_prev": events.has_prev,
#             },
#         }
#     )


# @event_routes.route("/<int:eventId>")
# def event(eventId):
#     """
#     Query for event by id and returns that event in a dictionary
#     """

#     event = (
#         db.session.query(Event)
#         .options(
#             joinedload(Event.groups).joinedload(Group.organizer),
#             joinedload(Event.venues),
#             selectinload(Event.attendances).joinedload(Attendance.user),
#             selectinload(Event.event_images),
#         )
#         .filter(Event.id == eventId)
#         .first()
#     )

#     if not event:
#         return jsonify({"errors": {"message": "Event not found"}}), 404

#     return jsonify(event.to_dict())


# @event_routes.route("/<int:eventId>", methods=["DELETE"])
# @login_required
# def delete_event(eventId):
#     """
#     will delete a given event by its id

#     Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

#     Returns 404 Not Found if the group or event is not in the database

#     The commented out code was to test if the delete request works
#     """
#     event_to_delete = Event.query.get(eventId)

#     if not event_to_delete:
#         return {"errors": {"message": "Not Found"}}, 404

#     group = Group.query.get(event_to_delete.group_id)
#     if current_user.id != group.organizer_id:
#         return {"errors": {"message": "Unauthorized"}}, 401

#     try:
#         # Delete associated data in batch
#         EventImage.query.filter_by(event_id=eventId).delete(synchronize_session=False)
#         Attendance.query.filter_by(event_id=eventId).delete(synchronize_session=False)

#         # Remove image from S3 if it exists
#         if event_to_delete.image:
#             remove_file_from_s3(event_to_delete.image)

#         db.session.delete(event_to_delete)
#         db.session.commit()

#         return {"message": "Event deleted successfully"}, 200

#     except Exception as e:
#         db.session.rollback()
#         return {"errors": {"message": "Error deleting event"}}, 500


# # ! EVENT IMAGES
# @event_routes.route("/<int:eventId>/images", methods=["GET", "POST"])
# @login_required
# def add_event_image(eventId):
#     """
#     will add an event image by the event's id

#     Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

#     Returns 404 Not Found if the event or image is not in the database

#     The commented out code was to test if the post request works
#     """

#     event = Event.query.get(eventId)
#     if not event:
#         return {"errors": {"message": "Not Found"}}, 404

#     group = Group.query.get(event.group_id)
#     if current_user.id != group.organizer_id:
#         return {"errors": {"message": "Unauthorized"}}, 401

#     form = EventImageForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]

#     if form.validate_on_submit():
#         event_image = form.event_image.data

#         if event_image:
#             try:
#                 event_image.filename = get_unique_filename(event_image.filename)
#                 upload = upload_file_to_s3(event_image)

#                 if "url" not in upload:
#                     return {"message": "unable to locate url"}, 400

#                 url = upload["url"]
#                 new_event_image = EventImage(event_id=eventId, event_image=url)
#                 db.session.add(new_event_image)
#                 db.session.commit()

#                 return {"event_image": new_event_image.to_dict()}, 201

#             except Exception as e:
#                 return {"message": f"Image upload failed: {str(e)}"}, 500
#         else:
#             return {"message": "Event image is None"}, 400

#     #     if form.errors:
#     #         print(form.errors)
#     #         return render_template(
#     #             "event_image_form.html", form=form, id=eventId, errors=form.errors
#     #         )
#     #     return render_template("event_image_form.html", form=form, id=eventId, errors=None)

#     return form.errors, 400


# @event_routes.route("/<int:eventId>/images/<int:imageId>/edit", methods=["POST"])
# @login_required
# def edit_event_images(eventId, imageId):
#     """
#     will generate an update event image form on get requests and validate/save on post requests

#     Returns 401 Unauthorized if the current user's id does not match the groups' organizer id

#     Returns 404 Not Found if the group is not in the database or if the group image is not found in the database

#     The commented out code was to test if the post request works
#     """

#     event_image = EventImage.query.get(imageId)

#     event = Event.query.get(eventId)

#     group = Group.query.get(event.group_id)

#     # check if there is event
#     if not event:
#         return {"errors": {"message": "Not Found"}}, 404

#     # check if there is a event image to edit
#     if not event_image:
#         return {"errors": {"message": "Not Found"}}, 404

#     # check if current user is group organizer - group organizer is only allowed to update
#     if current_user.id != group.organizer_id:
#         return {"errors": {"message": "Unauthorized"}}, 401

#     form = EventImageForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]
#     if form.validate_on_submit():
#         edit_event_image = form.data["event_image"] or edit_event_image.group_image
#         edit_event_image.filename = get_unique_filename(edit_event_image.filename)
#         upload = upload_file_to_s3(edit_event_image)

#         if "url" not in upload:
#             return {"message": "Upload failed"}, 400

#         # Remove the old image from S3
#         remove_file_from_s3(event_image.event_image)

#         event_image.event_image = upload["url"]
#         db.session.commit()
#         return {"event_image": event_image.to_dict()}, 200
#     # return {"message": "Image updated successfully"}

#     return form.errors, 400


# #     return render_template(
# #         "event_image_form.html",
# #         form=form,
# #         type="update",
# #         eventId=eventId,
# #         event_image=event_image,
# #     )


# # ! EVENT - ATTENDEES
# @event_routes.route("/<int:eventId>/attend-event", methods=["GET", "POST"])
# @login_required
# def attend_event(eventId):
#     event = Event.query.get(eventId)
#     if not event:
#         return {"errors": {"message": "Event Not Found"}}, 404

#     group = Group.query.get(event.group_id)

#     # Prevent the organizer from attending as a member
#     if group.organizer_id == current_user.id:
#         return {
#             "message": "User is the organizer and is currently attending the event"
#         }, 403

#     # Check if the user is already attending
#     existing_attendance = Attendance.query.filter_by(
#         event_id=eventId, user_id=current_user.id
#     ).first()

#     if existing_attendance:
#         return {"message": "Currently attending the event"}, 400

#     # Parse JSON request body
#     data = request.get_json()
#     user_id = data.get("user_id") if data else current_user.id
#     event_id = data.get("event_id") if data else eventId

#     # Ensure data is valid
#     if user_id != current_user.id:
#         return jsonify({"message": "Invalid user ID"}), 400

#     try:
#         new_attendance = Attendance(event_id=event_id, user_id=user_id)
#         db.session.add(new_attendance)
#         db.session.commit()

#         return {"message": "Successfully attended the event"}, 200

#     except Exception as e:
#         db.session.rollback()
#         return {"errors": {"message": "Error attending event"}}, 500


# @event_routes.route("/<int:eventId>/leave-event/<int:attendeeId>", methods=["DELETE"])
# @login_required
# def leave_event(eventId, attendeeId):
#     event = Event.query.get(eventId)
#     if not event:
#         return {"errors": {"message": "Event not found"}}, 404

#     group = Group.query.get(event.group_id)

#     # Check if the attendee exists
#     attendee = Attendance.query.filter_by(event_id=eventId, user_id=attendeeId).first()
#     if not attendee:
#         return {"message": "User is not an attendee of this event"}, 400

#     # If the current user is trying to leave the event
#     if attendeeId == current_user.id:
#         if group.organizer_id == current_user.id:
#             return {"message": "The organizer must attend the event"}, 403

#         try:
#             db.session.delete(attendee)
#             db.session.commit()
#             return {"message": "You have successfully left the event"}, 200
#         except Exception as e:
#             db.session.rollback()
#             return {"errors": {"message": "Error leaving event"}}, 500

#     # If the current user is trying to remove another attendee
#     if group.organizer_id != current_user.id:
#         return {"message": "Only the organizer can remove attendees"}, 403

#     if attendeeId == group.organizer_id:
#         return {"message": "The organizer must attend the event"}, 400

#     try:
#         db.session.delete(attendee)
#         db.session.commit()
#         return {"message": "Attendee successfully removed from the event"}, 200
#     except Exception as e:
#         db.session.rollback()
#         return {"errors": {"message": "Error removing attendee"}}, 500
