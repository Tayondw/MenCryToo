from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime
from .member import Membership
from sqlalchemy.ext.associationproxy import association_proxy


class Group(db.Model):
    __tablename__ = "groups"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    organizer_id = db.Column(
        db.Integer,
        db.ForeignKey(add_prefix_for_prod("users.id")),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(50), nullable=False, index=True)
    about = db.Column(db.String(150), nullable=False)
    type = db.Column(
        db.Enum("online", "in-person", name="group_location"),
        default="online",
        nullable=False,
        index=True,
    )
    city = db.Column(db.String(30), nullable=False, index=True)
    state = db.Column(db.String(2), nullable=False, index=True)
    image = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    organizer = db.relationship(
        "User", back_populates="groups", lazy="joined"
    )  # Eager load organizer
    events = db.relationship("Event", back_populates="groups", lazy="select")
    venues = db.relationship("Venue", back_populates="groups", lazy="select")
    memberships = db.relationship(
        "Membership",
        back_populates="group",
        cascade="all, delete-orphan",
        lazy="select",
    )
    group_images = db.relationship(
        "GroupImage",
        back_populates="group",
        cascade="all, delete-orphan",
        lazy="select",
    )
    users = association_proxy("memberships", "user")

    def to_dict_minimal(self):
        """Lightweight version for lists - optimized for performance"""
        return {
            "id": self.id,
            "name": self.name,
            "about": self.about[:100] + "..." if len(self.about) > 100 else self.about,
            "type": self.type,
            "city": self.city,
            "state": self.state,
            "image": self.image,
            "numMembers": len(self.memberships) if self.memberships else 0,
            "numEvents": len(self.events) if self.events else 0,
            "organizerId": self.organizer_id,
            "organizerName": (
                self.organizer.username
                if hasattr(self, "organizer") and self.organizer
                else None
            ),
        }

    def to_dict(self, include_events=True, include_members=True):
        """full version - selective loading for members"""
        base_dict = {
            "id": self.id,
            "organizerId": self.organizer_id,
            "name": self.name,
            "about": self.about,
            "type": self.type,
            "city": self.city,
            "state": self.state,
            "image": self.image,
            "numMembers": len(self.memberships) if self.memberships else 0,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

        # Only include organizer minimal info if loaded
        if hasattr(self, "organizer") and self.organizer:
            base_dict["organizer"] = {
                "id": self.organizer.id,
                "username": self.organizer.username,
                "firstName": self.organizer.first_name,
                "lastName": self.organizer.last_name,
                "profileImage": self.organizer.profile_image_url,
                "email": self.organizer.email,
            }

        # Conditionally include events - use minimal data to avoid deep loading
        if include_events and hasattr(self, "events") and self.events:
            base_dict["events"] = [
                {
                    "id": event.id,
                    "name": event.name,
                    "description": (
                        event.description[:100] + "..."
                        if len(event.description) > 100
                        else event.description
                    ),
                    "type": event.type,
                    "capacity": event.capacity,
                    "image": event.image,
                    "startDate": event.start_date.isoformat(),
                    "endDate": event.end_date.isoformat(),
                    "numAttendees": (
                        len(event.attendances)
                        if hasattr(event, "attendances") and event.attendances
                        else 0
                    ),
                }
                for event in self.events
            ]

        # Always ensure members array exists and handle organizer properly
        if include_members:
            members_list = []

            # First, add all existing members
            if hasattr(self, "memberships") and self.memberships:
                for membership in self.memberships:
                    if hasattr(membership, "user") and membership.user:
                        member_dict = {
                            "id": membership.id,
                            "groupId": membership.group_id,
                            "userId": membership.user_id,
                            "user": {
                                "id": membership.user.id,
                                "username": membership.user.username,
                                "firstName": membership.user.first_name,
                                "lastName": membership.user.last_name,
                                "profileImage": membership.user.profile_image_url,
                            },
                            # Mark organizer in members list
                            "isOrganizer": membership.user_id == self.organizer_id,
                        }
                        members_list.append(member_dict)

            # If organizer is not in members list, add them
            organizer_in_members = any(
                member["userId"] == self.organizer_id for member in members_list
            )

            if (
                not organizer_in_members
                and hasattr(self, "organizer")
                and self.organizer
            ):
                # Add organizer as a member
                organizer_member = {
                    "id": f"organizer_{self.organizer_id}",  # Temporary ID for organizer
                    "groupId": self.id,
                    "userId": self.organizer_id,
                    "user": {
                        "id": self.organizer.id,
                        "username": self.organizer.username,
                        "firstName": self.organizer.first_name,
                        "lastName": self.organizer.last_name,
                        "profileImage": self.organizer.profile_image_url,
                    },
                    "isOrganizer": True,
                }
                members_list.append(organizer_member)

            # Sort members with organizer first
            members_list.sort(
                key=lambda x: (not x.get("isOrganizer", False), x["user"]["firstName"])
            )

            base_dict["members"] = members_list

        # Only include venues if they exist and are loaded
        if hasattr(self, "venues") and self.venues:
            base_dict["venues"] = [
                {
                    "id": venue.id,
                    "groupId": venue.group_id,
                    "address": venue.address,
                    "city": venue.city,
                    "state": venue.state,
                    "zipCode": venue.zip_code,
                    "latitude": venue.latitude,
                    "longitude": venue.longitude,
                }
                for venue in self.venues
            ]

        # Only include group images if they exist and are loaded
        if hasattr(self, "group_images") and self.group_images:
            base_dict["groupImage"] = [
                {"id": img.id, "groupId": img.group_id, "groupImage": img.group_image}
                for img in self.group_images
            ]

        return base_dict
