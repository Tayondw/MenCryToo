from app.models import db, Event, EventImage, environment, SCHEMA
from sqlalchemy.sql import text
from app.seeds.data.events import events
from app.seeds.data.event_images import event_images

def seed_events():
      for event_data in events:
            event = Event(**event_data)
            db.session.add(event)
      db.session.commit()

def seed_event_images():
    for event_image_data in event_images:
        event_image = EventImage(**event_image_data)
        db.session.add(event_image)
    db.session.commit()


def undo_events():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.events RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM events"))
    db.session.commit()


def undo_event_images():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.event_images RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM event_images"))
    db.session.commit()
