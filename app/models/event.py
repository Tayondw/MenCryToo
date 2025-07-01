from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime
from .attendance import Attendance
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm import validates


class Event(db.Model):
    __tablename__ = "events"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(
        db.Integer,
        db.ForeignKey(add_prefix_for_prod("venues.id")),
        nullable=True,
        index=True,
    )
    group_id = db.Column(
        db.Integer,
        db.ForeignKey(add_prefix_for_prod("groups.id")),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(50), nullable=False, index=True)
    description = db.Column(db.String(150), nullable=False)
    type = db.Column(
        db.Enum("online", "in-person", name="event_location"),
        default="online",
        nullable=False,
        index=True,
    )
    capacity = db.Column(db.Integer, nullable=False)
    image = db.Column(db.String(500), nullable=True)
    start_date = db.Column(db.DateTime, nullable=False, index=True)
    end_date = db.Column(db.DateTime, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.now, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    venues = db.relationship("Venue", back_populates="events", lazy="joined")
    groups = db.relationship("Group", back_populates="events", lazy="joined")
    event_images = db.relationship(
        "EventImage",
        back_populates="event",
        cascade="all, delete-orphan",
        lazy="select",
    )
    attendances = db.relationship(
        "Attendance",
        back_populates="event",
        cascade="all, delete-orphan",
        lazy="select",
    )
    users = association_proxy("attendances", "user")

    @validates("start_date", "end_date")
    def validate_dates(self, key, date_value):
        if key == "end_date" and hasattr(self, "start_date") and self.start_date:
            if date_value <= self.start_date:
                raise ValueError("End date must be after start date")
        return date_value

    @validates("capacity")
    def validate_capacity(self, key, capacity):
        if capacity < 2:
            raise ValueError("Capacity must be at least 2")
        if capacity > 1000:
            raise ValueError("Capacity cannot exceed 1000")
        return capacity

    def to_dict_minimal(self):
        """Lightweight version for lists - optimized for performance"""
        return {
            "id": self.id,
            "name": self.name,
            "description": (
                self.description[:100] + "..."
                if len(self.description) > 100
                else self.description
            ),
            "type": self.type,
            "capacity": self.capacity,
            "image": self.image,
            "startDate": self.start_date.isoformat(),
            "endDate": self.end_date.isoformat(),
            "numAttendees": len(self.attendances) if self.attendances else 0,
            "groupId": self.group_id,
            "groupName": (
                self.groups.name if hasattr(self, "groups") and self.groups else None
            ),
        }

    def to_dict(self):
        """Full dictionary representation - optimized to avoid N+1 queries"""
        # Get organizer info efficiently
        organizer = None
        if (
            hasattr(self, "groups")
            and self.groups
            and hasattr(self.groups, "organizer")
            and self.groups.organizer
        ):
            organizer = {
                "id": self.groups.organizer.id,
                "firstName": self.groups.organizer.first_name,
                "lastName": self.groups.organizer.last_name,
                "username": self.groups.organizer.username,
                "profileImage": self.groups.organizer.profile_image_url,
            }

        # Get group info efficiently
        group_info = None
        if hasattr(self, "groups") and self.groups:
            group_info = {
                "id": self.groups.id,
                "name": self.groups.name,
                "organizerId": self.groups.organizer_id,
                "type": self.groups.type,
                "city": self.groups.city,
                "state": self.groups.state,
                "about": getattr(self.groups, "about", ""),
                "image": self.groups.image,
            }

        # Get venue info efficiently
        venue_info = {
            "id": self.venues.id if self.venues else None,
            "groupId": self.venues.group_id if self.venues else None,
            "address": self.venues.address if self.venues else None,
            "city": self.venues.city if self.venues else None,
            "state": self.venues.state if self.venues else None,
            "latitude": self.venues.latitude if self.venues else None,
            "longitude": self.venues.longitude if self.venues else None,
        }

        # Get attendees efficiently
        attendees_list = []
        if hasattr(self, "attendances") and self.attendances:
            for attendance in self.attendances:
                attendee_data = {
                    "id": attendance.id,
                    "eventId": attendance.event_id,
                    "userId": attendance.user_id,
                }

                # Add user info if available and loaded
                if hasattr(attendance, "user") and attendance.user:
                    attendee_data["user"] = {
                        "id": attendance.user.id,
                        "username": attendance.user.username,
                        "firstName": attendance.user.first_name,
                        "lastName": attendance.user.last_name,
                        "profileImage": attendance.user.profile_image_url,
                    }

                attendees_list.append(attendee_data)

        return {
            "id": self.id,
            "image": self.image,
            "eventImage": [
                {"id": img.id, "eventId": img.event_id, "eventImage": img.event_image}
                for img in (self.event_images or [])
            ],
            "venueId": self.venue_id,
            "venueInfo": venue_info,
            "groupId": self.group_id,
            "groupInfo": group_info,
            "organizer": organizer,
            "organizerInfo": organizer,
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "capacity": self.capacity,
            "startDate": self.start_date.isoformat(),
            "endDate": self.end_date.isoformat(),
            "attendees": attendees_list,
            "numAttendees": len(attendees_list),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self):
        return f"<Event {self.name} - {self.start_date}>"


# from .db import db, environment, SCHEMA, add_prefix_for_prod
# from datetime import datetime
# from .attendance import Attendance
# from sqlalchemy.ext.associationproxy import association_proxy
# from sqlalchemy.orm import validates


# class Event(db.Model):
#     __tablename__ = "events"

#     if environment == "production":
#         __table_args__ = {"schema": SCHEMA}

#     id = db.Column(db.Integer, primary_key=True)
#     venue_id = db.Column(
#         db.Integer,
#         db.ForeignKey(add_prefix_for_prod("venues.id")),
#         nullable=True,
#         index=True,
#     )
#     group_id = db.Column(
#         db.Integer,
#         db.ForeignKey(add_prefix_for_prod("groups.id")),
#         nullable=False,
#         index=True,
#     )
#     name = db.Column(db.String(50), nullable=False, index=True)
#     description = db.Column(db.String(150), nullable=False)
#     type = db.Column(
#         db.Enum("online", "in-person", name="event_location"),
#         default="online",
#         nullable=False,
#         index=True,
#     )
#     capacity = db.Column(db.Integer, nullable=False)
#     image = db.Column(db.String(500), nullable=True)
#     start_date = db.Column(db.DateTime, nullable=False, index=True)
#     end_date = db.Column(db.DateTime, nullable=False, index=True)
#     created_at = db.Column(db.DateTime, default=datetime.now, index=True)
#     updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

#     venues = db.relationship("Venue", back_populates="events", lazy="joined")
#     groups = db.relationship("Group", back_populates="events", lazy="joined")
#     event_images = db.relationship(
#         "EventImage",
#         back_populates="event",
#         cascade="all, delete-orphan",
#         lazy="select",
#     )
#     attendances = db.relationship(
#         "Attendance",
#         back_populates="event",
#         cascade="all, delete-orphan",
#         lazy="select",
#     )
#     users = association_proxy("attendances", "user")

#     @validates("start_date", "end_date")
#     def validate_dates(self, key, date_value):
#         if key == "end_date" and hasattr(self, "start_date") and self.start_date:
#             if date_value <= self.start_date:
#                 raise ValueError("End date must be after start date")
#         return date_value

#     @validates("capacity")
#     def validate_capacity(self, key, capacity):
#         if capacity < 2:
#             raise ValueError("Capacity must be at least 2")
#         if capacity > 1000:
#             raise ValueError("Capacity cannot exceed 1000")
#         return capacity

#     def to_dict_minimal(self):
#         """Lightweight version for lists"""
#         return {
#             "id": self.id,
#             "name": self.name,
#             "description": (
#                 self.description[:100] + "..."
#                 if len(self.description) > 100
#                 else self.description
#             ),
#             "type": self.type,
#             "capacity": self.capacity,
#             "image": self.image,
#             "startDate": self.start_date.isoformat(),
#             "endDate": self.end_date.isoformat(),
#             "numAttendees": (
#                 len(self.attendances) if hasattr(self, "_attendees_count") else 0
#             ),
#         }

#     def to_dict(self):
#         """full dictionary representation"""
#         organizer = None
#         if self.groups and self.groups.organizer:
#             if hasattr(self.groups.organizer, "to_dict_minimal"):
#                 organizer = self.groups.organizer.to_dict_minimal()
#         else:
#             # Fallback to basic user info
#             organizer = {
#                 "id": self.groups.organizer.id,
#                 "firstName": self.groups.organizer.first_name,
#                 "lastName": self.groups.organizer.last_name,
#                 "username": self.groups.organizer.username,
#                 "profileImage": self.groups.organizer.profile_image_url,
#             }

#         organizer_info = None
#         if organizer:
#             organizer_info = {
#                 "firstName": organizer.get("firstName", ""),
#                 "lastName": organizer.get("lastName", ""),
#                 "profileImage": organizer.get("profileImage", ""),
#             }
#             # Only add email if it exists
#             if "email" in organizer:
#                 organizer_info["email"] = organizer["email"]

#         group_info = None
#         if self.groups:
#             group_info = {
#                 "id": self.groups.id,
#                 "name": self.groups.name,
#                 "organizerId": self.groups.organizer_id,
#                 "type": self.groups.type,
#                 "city": self.groups.city,
#                 "state": self.groups.state,
#                 "about": self.groups.about,
#                 "image": self.groups.image,
#             }

#         venue_info = {
#             "id": self.venues.id if self.venues else None,
#             "groupId": self.venues.group_id if self.venues else None,
#             "address": self.venues.address if self.venues else None,
#             "city": self.venues.city if self.venues else None,
#             "state": self.venues.state if self.venues else None,
#             "latitude": self.venues.latitude if self.venues else None,
#             "longitude": self.venues.longitude if self.venues else None,
#         }

#         return {
#             "id": self.id,
#             "image": self.image,
#             "eventImage": [img.to_dict() for img in self.event_images],
#             "venueId": self.venue_id,
#             "venueInfo": venue_info,
#             "groupId": self.group_id,
#             "groupInfo": group_info,
#             "organizer": organizer,
#             "organizerInfo": organizer_info,
#             "name": self.name,
#             "description": self.description,
#             "type": self.type,
#             "capacity": self.capacity,
#             "startDate": self.start_date.isoformat(),
#             "endDate": self.end_date.isoformat(),
#             "attendees": [attendee.to_dict() for attendee in self.attendances],
#             "numAttendees": len(self.attendances),
#             "created_at": self.created_at.isoformat(),
#             "updated_at": self.updated_at.isoformat(),
#         }

#     def __repr__(self):
#         return f"<Event {self.name} - {self.start_date}>"
