from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class CommentLike(db.Model):
    __tablename__ = "comment_likes"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("users.id")), nullable=False
    )
    comment_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("comments.id")), nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.now)

    # Relationships
    user = db.relationship("User", backref="comment_likes")
    comment = db.relationship("Comment", backref="comment_likes")

    # Unique constraint to prevent duplicate likes
    __table_args__ = (
        db.UniqueConstraint("user_id", "comment_id", name="unique_user_comment_like"),
        {"schema": SCHEMA} if environment == "production" else {},
    )

    def __repr__(self):
        return f"<CommentLike user_id: {self.user_id} comment_id: {self.comment_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "commentId": self.comment_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
