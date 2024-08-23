from .db import db, environment, SCHEMA, add_prefix_for_prod
from .user_tag import user_tags


class Tag(db.Model):
    __tablename__ = "tags"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(30), nullable=False)

    # Relationship attributes
    tags_users = db.relationship(
        "User",
        secondary=user_tags,
        back_populates="users_tags",
    )

    def to_dict(self):
        return {"id": self.id, "name": self.name}
