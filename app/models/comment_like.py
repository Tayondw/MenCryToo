from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime


class CommentLike(db.Model):
    __tablename__ = "comment_likes"

    if environment == "production":
        __table_args__ = (
            db.UniqueConstraint(
                "user_id", "comment_id", name="unique_user_comment_like"
            ),
            {"schema": SCHEMA},
        )
    else:
        __table_args__ = (
            db.UniqueConstraint(
                "user_id", "comment_id", name="unique_user_comment_like"
            ),
        )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("users.id")), nullable=False
    )
    comment_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("comments.id")), nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.now)

    # FIXED: Add proper relationships with back_populates
    user = db.relationship("User", backref="user_comment_likes")
    comment = db.relationship("Comment", back_populates="comment_likes")

    def __repr__(self):
        return f"<CommentLike user_id: {self.user_id} comment_id: {self.comment_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "commentId": self.comment_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def toggle_like(cls, user_id, comment_id):
        """
        Toggle a like for a comment - returns (is_liked, like_count)
        """
        try:
            # Check if like already exists
            existing_like = cls.query.filter_by(
                user_id=user_id, comment_id=comment_id
            ).first()

            if existing_like:
                # Unlike - remove the like
                db.session.delete(existing_like)
                is_liked = False
            else:
                # Like - add new like
                new_like = cls(user_id=user_id, comment_id=comment_id)
                db.session.add(new_like)
                is_liked = True

            # Commit the changes
            db.session.commit()

            # Get updated like count
            like_count = cls.query.filter_by(comment_id=comment_id).count()

            return is_liked, like_count

        except Exception as e:
            db.session.rollback()
            raise e

    @classmethod
    def get_like_count(cls, comment_id):
        """Get the total number of likes for a comment"""
        return cls.query.filter_by(comment_id=comment_id).count()

    @classmethod
    def is_liked_by_user(cls, comment_id, user_id):
        """Check if a comment is liked by a specific user"""
        return (
            cls.query.filter_by(comment_id=comment_id, user_id=user_id).first()
            is not None
        )

    @classmethod
    def get_users_who_liked(cls, comment_id):
        """Get all users who liked a specific comment"""
        from .user import User

        return User.query.join(cls).filter(cls.comment_id == comment_id).all()


# from .db import db, environment, SCHEMA, add_prefix_for_prod
# from datetime import datetime


# class CommentLike(db.Model):
#     __tablename__ = "comment_likes"

#     if environment == "production":
#         __table_args__ = {"schema": SCHEMA}

#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(
#         db.Integer, db.ForeignKey(add_prefix_for_prod("users.id")), nullable=False
#     )
#     comment_id = db.Column(
#         db.Integer, db.ForeignKey(add_prefix_for_prod("comments.id")), nullable=False
#     )
#     created_at = db.Column(db.DateTime, default=datetime.now)

#     # Relationships
#     user = db.relationship("User", backref="comment_likes")
#     comment = db.relationship("Comment", backref="comment_likes")

#     # Unique constraint to prevent duplicate likes
#     __table_args__ = (
#         db.UniqueConstraint("user_id", "comment_id", name="unique_user_comment_like"),
#         {"schema": SCHEMA} if environment == "production" else {},
#     )

#     def __repr__(self):
#         return f"<CommentLike user_id: {self.user_id} comment_id: {self.comment_id}>"

#     def to_dict(self):
#         return {
#             "id": self.id,
#             "userId": self.user_id,
#             "commentId": self.comment_id,
#             "createdAt": self.created_at.isoformat() if self.created_at else None,
#         }
