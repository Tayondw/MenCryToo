from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime
from .member import members


class Group(db.Model):
    __tablename__ = "groups"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    organizer_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("users.id")), nullable=False
    )
    name = db.Column(db.String(50), nullable=False)
    about = db.Column(db.String(150), nullable=False)
    type = db.Column(
        db.Enum("online", "in-person", name="group_location"),
        default="online",
        nullable=False,
    )
    city = db.Column(db.String(30), nullable=False)
    state = db.Column(db.String(2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationship attributes
    organizers = db.relationship("User", back_populates="groups")
    events = db.relationship("Event", back_populates="groups")
    venues = db.relationship("Venue", back_populates="groups")
    group_memberships = db.relationship(
        "User",
        secondary=members,
        back_populates="user_memberships",
    )
    group_images = db.relationship(
        "GroupImage", back_populates="group", cascade="all, delete-orphan"
    )

    def to_dict(self):
        events = [event.to_dict() for event in self.events if event.group_id == self.id]
        venues = [venue.to_dict() for venue in self.venues if venue.group_id == self.id]
        organizer = self.organizers.to_dict()
        members = {member.id: member.to_dict() for member in self.group_memberships}
        image = {
            group_image.id: group_image.to_dict() for group_image in self.group_images
        }
        return {
            "id": self.id,
            "organizerId": self.organizer_id,
            "name": self.name,
            "about": self.about,
            "type": self.type,
            "city": self.city,
            "state": self.state,
            "events": events,
            "venues": venues,
            "organizer": organizer,
            "groupImage": image,
            "numMembers": len(self.group_memberships),
            "members": members,
        }
