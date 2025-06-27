from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime
from .member import Membership
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm import joinedload


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
        """Lightweight version for lists"""
        return {
            "id": self.id,
            "name": self.name,
            "about": self.about,
            "type": self.type,
            "city": self.city,
            "state": self.state,
            "image": self.image,
            "numMembers": (
                len(self.memberships) if hasattr(self, "_member_count") else 0
            ),
        }

    def to_dict(self, include_events=True, include_members=True):
        """Optimized full version"""
        base_dict = {
            "id": self.id,
            "organizerId": self.organizer_id,
            "name": self.name,
            "about": self.about,
            "type": self.type,
            "city": self.city,
            "state": self.state,
            "image": self.image,
            "numMembers": len(self.memberships),
        }

        # Only include organizer minimal info
        if self.organizer:
            base_dict["organizer"] = self.organizer.to_dict_minimal()

        if include_events:
            base_dict["events"] = [event.to_dict() for event in self.events]

        if include_members:
            base_dict["members"] = [member.to_dict() for member in self.memberships]

        # Only include venues if they exist
        if self.venues:
            base_dict["venues"] = [venue.to_dict() for venue in self.venues]

        # Only include group images if they exist
        if self.group_images:
            base_dict["groupImage"] = [img.to_dict() for img in self.group_images]

        return base_dict
