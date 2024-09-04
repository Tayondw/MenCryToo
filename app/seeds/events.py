from app.models import db, Event, EventImage, User, environment, SCHEMA
from sqlalchemy.sql import text
from app.seeds.data.events import events
from app.seeds.data.event_images import event_images


def seed_events():
    # Retrieve all users once for later lookup
    all_users = User.query.all()
    user_map = {user.username: user for user in all_users}
    for event_data in events:
        event = Event(
            group_id=event_data["group_id"],
            venue_id=event_data["venue_id"],
            name=event_data["name"],
            description=event_data["description"],
            type=event_data["type"],
            capacity=event_data["capacity"],
            image=event_data["image"],
            start_date=event_data["start_date"],
            end_date=event_data["end_date"],
        )
        db.session.add(event)
        db.session.flush()  # Ensure the event.id is available before adding attendees

        for username in event_data["event_attendances"]:
            user = user_map.get(username)
            if user:
                if user not in event.event_attendances:
                    event.event_attendances.append(user)
            else:
                print(f"User with username {username} not found")
    db.session.commit()


# def seed_event_images():
#     for event_image_data in event_images:
#         event_image = EventImage(**event_image_data)
#         db.session.add(event_image)
#     db.session.commit()


def undo_events():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.events RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM events"))
    db.session.commit()


# def undo_event_images():
#     if environment == "production":
#         db.session.execute(
#             f"TRUNCATE table {SCHEMA}.event_images RESTART IDENTITY CASCADE;"
#         )
#     else:
#         db.session.execute(text("DELETE FROM event_images"))
#     db.session.commit()
