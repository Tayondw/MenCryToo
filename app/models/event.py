from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime
from .attendance import attendances


class Event(db.Model):
    __tablename__ = "events"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("venues.id")), nullable=True
    )
    group_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("groups.id")), nullable=False
    )
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(150), nullable=False)
    type = db.Column(db.Enum("outdoor", "indoor"), default="indoor", nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationship attributes
    venues = db.relationship("Venue", back_populates="events")
    groups = db.relationship("Group", back_populates="events")
    event_images = db.relationship(
        "EventImage", back_populates="event", cascade="all, delete-orphan"
    )
    event_attendances = db.relationship(
        "User",
        secondary=attendances,
        back_populates="user_attendances",
        cascade="all, delete-orphan",
    )

    def to_dict(self):

        organizer = self.group.organizer.to_dict()
        #   group = [group.to_dict() for group in self.groups]
        #   venue = [venue.to_dict() for venue in self.venues]
        image = {event_image.id: event_image.to_dict() for event_image in self.event_images}

        organizerInfo = {
            "firstName": organizer["first_name"],
            "lastName": organizer["last_name"],
            "email": organizer["email"],
            "profileImage": organizer["profileImage"],
        }

        groupInfo = {
            "id": self.group.id,
            "name": self.group.name,
            "organizerId": self.group.organizerId,
            "type": self.group.type,
            "city": self.group.city,
            "state": self.group.state,
        }

        venueInfo = {
            "id": self.venue.id,
            "groupId": self.venue.groupId,
            "address": self.venue.address,
            "city": self.venue.city,
            "state": self.venue.state,
            "latitude": self.venue.latitude,
            "longitude": self.venue.longitude,
        }

        return {
            "id": self.id,
            "eventImage": image,
            "venueId": self.venue_id,
            "venueInfo": venueInfo,
            "groupId": self.group_id,
            "groupInfo": groupInfo,
            "organizer": organizer,
            "organizerInfo": organizerInfo,
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "capacity": self.capacity,
            "startDate": self.start_date,
            "endDate": self.end_date,
            "attendees": len(self.event_attendances),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
