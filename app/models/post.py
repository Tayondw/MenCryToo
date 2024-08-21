from .db import db, environment, SCHEMA, add_prefix_for_prod
from .like import likes
from datetime import datetime


class Post(db.Model):
    __tablename__ = "posts"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(50), nullable=False)
    caption = db.Column(db.String(250), nullable=False)
    creator = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("users.id")), nullable=False
    )
    image = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now())
    updated_at = db.Column(db.DateTime, default=datetime.now())

    # Relationship attributes
    user = db.relationship(
        "User",
        back_populates="posts",
    )

    post_likes = db.relationship(
        "User",
        secondary=likes,
        back_populates="user_likes",
    )

    def __repr__(self):
        return f"< Post id: {self.id} by: {self.user.username} >"

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "caption": self.caption,
            "creator": self.creator,
            "image": self.image,
            "likes": len(self.post_likes),
            "user": self.user.to_dict_no_posts(),
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
