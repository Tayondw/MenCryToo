from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime
from .attendance import Attendance
from sqlalchemy.ext.associationproxy import association_proxy

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
    type = db.Column(
        db.Enum("online", "in-person", name="event_location"),
        default="online",
        nullable=False,
    )
    capacity = db.Column(db.Integer, nullable=False)
    image = db.Column(db.String(500), nullable=True)
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
    attendances = db.relationship(
        "Attendance", back_populates="event", cascade="all, delete-orphan"
    )
    users = association_proxy("attendances", "user")
    #     event_attendances = db.relationship(
    #         "User",
    #         secondary=attendances,
    #         back_populates="user_attendances",
    #     )

    def to_dict(self):

        organizer = (
            self.groups.organizer.to_dict()
            if self.groups and self.groups.organizer
            else None
        )
        #   group = [group.to_dict() for group in self.groups]
        #   venue = [venue.to_dict() for venue in self.venues]
        image = [event_image.to_dict() for event_image in self.event_images]
        group_image = [
            group_image.to_dict() for group_image in self.groups.group_images
        ]

        attendees = [attendee.to_dict() for attendee in self.attendances]

        organizerInfo = (
            {
                "firstName": organizer["firstName"],
                "lastName": organizer["lastName"],
                "email": organizer["email"],
                "profileImage": organizer["profileImage"],
            }
            if organizer
            else None
        )

        groupInfo = {
            "id": self.groups.id,
            "name": self.groups.name,
            "organizerId": self.groups.organizer_id,
            "type": self.groups.type,
            "city": self.groups.city,
            "state": self.groups.state,
            "about": self.groups.about,
            "groupImage": group_image,
            "image": self.groups.image,
        }

        venueInfo = {
            "id": self.venues.id if self.venues and self.venues.id else None,
            "groupId": self.venues.group_id if self.venues else None,
            "address": self.venues.address if self.venues else None,
            "city": self.venues.city if self.venues else None,
            "state": self.venues.state if self.venues else None,
            "latitude": self.venues.latitude if self.venues else None,
            "longitude": self.venues.longitude if self.venues else None,
        }

        return {
            "id": self.id,
            "image": self.image,
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
            "attendees": attendees,
            "numAttendees": len(self.attendances),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
