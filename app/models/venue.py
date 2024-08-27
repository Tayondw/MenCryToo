from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class Venue(db.Model):
    __tablename__ = "venues"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("groups.id")), nullable=False
    )
    address = db.Column(db.String(50), nullable=False)
    city = db.Column(db.String(30), nullable=False)
    state = db.Column(db.String(2), nullable=False)
    zip_code = db.Column(db.String(5), nullable=False)
    latitude = db.Column(db.Numeric(scale=10, asdecimal=False), nullable=True)
    longitude = db.Column(db.Numeric(scale=10, asdecimal=False), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationship attributes
    events = db.relationship("Event", back_populates="venues")
    groups = db.relationship("Group", back_populates="venues")

    def to_dict(self):
        return {
            "id": self.id,
            "groupId": self.group_id,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zipCode": self.zip_code,
            "latitude": self.latitude,
            "longitude": self.longitude,
        }
