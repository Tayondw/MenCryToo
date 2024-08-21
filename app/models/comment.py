from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class Comment(db.Model):
    __tablename__ = "comments"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("users.id")), nullable=False
    )
    post_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("posts.id")), nullable=False
    )
    comment = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now())
    updated_at = db.Column(db.DateTime, default=datetime.now(), onupdate=datetime.now())

    commenter = db.relationship("User", back_populates="comments")
    post = db.relationship("Post", back_populates="comments")

    def __repr__(self):
        return f"< Comment id: {self.id} by: {self.user.username} >"

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "postId": self.post_id,
            "message": self.message,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
