from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class EventImage(db.Model):
    __tablename__ = "event_images"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("events.id")), nullable=False
    )
    event_image = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now())
    updated_at = db.Column(db.DateTime, default=datetime.now())

    event = db.relationship("Event", back_populates="event_images")

    def to_dict(self):
        return {"id": self.id, "eventId": self.event_id, "eventImage": self.event_image}
