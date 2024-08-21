from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class GroupImage(db.Model):
    __tablename__ = "group_images"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("groups.id")), nullable=False
    )
    group_image = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    group = db.relationship("Group", back_populates="group_images")

    def to_dict(self):
        return {"id": self.id, "groupId": self.group_id, "groupImage": self.group_image}
