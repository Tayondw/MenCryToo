from .db import db, environment, SCHEMA, add_prefix_for_prod
from .like import likes
from datetime import datetime
from sqlalchemy.orm import validates
from sqlalchemy import text


class Post(db.Model):
    __tablename__ = "posts"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True, index=True)
    title = db.Column(db.String(50), nullable=False, index=True)
    caption = db.Column(db.String(250), nullable=False)
    creator = db.Column(
        db.Integer,
        db.ForeignKey(add_prefix_for_prod("users.id")),
        nullable=False,
        index=True,
    )
    image = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # Optimized relationships
    user = db.relationship("User", back_populates="posts", lazy="joined")
    post_likes = db.relationship(
        "User", secondary=likes, back_populates="user_likes", lazy="select"
    )
    post_comments = db.relationship(
        "Comment", back_populates="post", cascade="all, delete-orphan", lazy="select"
    )

    @validates("title")
    def validate_title(self, key, title):
        if not title or len(title.strip()) < 5:
            raise ValueError("Title must be at least 5 characters long")
        return title.strip()

    @validates("caption")
    def validate_caption(self, key, caption):
        if not caption or len(caption.strip()) < 5:
            raise ValueError("Caption must be at least 5 characters long")
        return caption.strip()

    def add_like_optimized(self, user_id):
        """Optimized like addition using raw SQL for better performance"""
        try:
            # Check if already liked using raw SQL
            result = db.session.execute(
                text(
                    "SELECT 1 FROM likes WHERE user_id = :user_id AND post_id = :post_id"
                ),
                {"user_id": user_id, "post_id": self.id},
            ).fetchone()

            if result:
                return False

            # Add like using raw SQL
            db.session.execute(
                text(
                    "INSERT INTO likes (user_id, post_id) VALUES (:user_id, :post_id)"
                ),
                {"user_id": user_id, "post_id": self.id},
            )
            db.session.commit()
            return True

        except Exception as e:
            db.session.rollback()
            return False

    def remove_like_optimized(self, user_id):
        """Optimized like removal using raw SQL"""
        try:
            result = db.session.execute(
                text(
                    "DELETE FROM likes WHERE user_id = :user_id AND post_id = :post_id"
                ),
                {"user_id": user_id, "post_id": self.id},
            )

            if result.rowcount > 0:
                db.session.commit()
                return True
            return False

        except Exception as e:
            db.session.rollback()
            return False

    def get_like_count(self):
        """Get like count efficiently"""
        result = db.session.execute(
            text("SELECT COUNT(*) FROM likes WHERE post_id = :post_id"),
            {"post_id": self.id},
        ).scalar()
        return result or 0

    def to_dict_feed_optimized(self):
        """Ultra-lightweight version for feeds - fastest loading"""
        return {
            "id": self.id,
            "title": self.title,
            "caption": (
                self.caption[:100] + "..." if len(self.caption) > 100 else self.caption
            ),
            "creator": self.creator,
            "image": self.image,
            "likes": (
                len(self.post_likes)
                if hasattr(self, "post_likes") and self.post_likes
                else 0
            ),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "user": (
                {
                    "id": self.user.id,
                    "username": self.user.username,
                    "profileImage": self.user.profile_image_url,
                }
                if self.user
                else None
            ),
        }

    def to_dict_detail_optimized(self):
        """Optimized for single post view with comments"""
        return {
            "id": self.id,
            "title": self.title,
            "caption": self.caption,
            "creator": self.creator,
            "image": self.image,
            "likes": (
                len(self.post_likes)
                if hasattr(self, "post_likes") and self.post_likes
                else 0
            ),
            "user": (
                {
                    "id": self.user.id,
                    "username": self.user.username,
                    "firstName": self.user.first_name,
                    "lastName": self.user.last_name,
                    "profileImage": self.user.profile_image_url,
                }
                if self.user
                else None
            ),
            "postComments": (
                [
                    {
                        "id": comment.id,
                        "userId": comment.user_id,
                        "postId": comment.post_id,
                        "comment": comment.comment,
                        "username": (
                            comment.commenter.username
                            if comment.commenter
                            else "Unknown"
                        ),
                        "parentId": comment.parent_id,
                        "created_at": (
                            comment.created_at.isoformat()
                            if comment.created_at
                            else None
                        ),
                        "updated_at": (
                            comment.updated_at.isoformat()
                            if comment.updated_at
                            else None
                        ),
                    }
                    for comment in self.post_comments
                ]
                if hasattr(self, "post_comments")
                else []
            ),
            "postLikes": (
                [
                    {
                        "id": user.id,
                        "username": user.username,
                    }
                    for user in self.post_likes
                ]
                if hasattr(self, "post_likes")
                else []
            ),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_dict_create_optimized(self):
        """Minimal version for post creation responses"""
        return {
            "id": self.id,
            "title": self.title,
            "caption": self.caption,
            "creator": self.creator,
            "image": self.image,
            "likes": 0,  # New posts start with 0 likes
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_dict_minimal(self):
        """Lightweight version for lists - fastest loading"""
        return {
            "id": self.id,
            "title": self.title,
            "caption": (
                self.caption[:100] + "..." if len(self.caption) > 100 else self.caption
            ),
            "creator": self.creator,
            "image": self.image,
            "likes": len(self.post_likes) if hasattr(self, "_likes_count") else 0,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    # Legacy methods for backward compatibility
    def add_like(self, user_id):
        """Legacy method - use add_like_optimized instead"""
        return self.add_like_optimized(user_id)

    def remove_like(self, user_id):
        """Legacy method - use remove_like_optimized instead"""
        return self.remove_like_optimized(user_id)

    def to_dict(self, post_comments=False, post_likes=False):
        """Legacy full dictionary representation - use optimized versions instead"""
        dict_post = {
            "id": self.id,
            "title": self.title,
            "caption": self.caption,
            "creator": self.creator,
            "image": self.image,
            "likes": (
                len(self.post_likes)
                if hasattr(self, "post_likes") and self.post_likes
                else 0
            ),
            "user": (
                {
                    "id": self.user.id,
                    "username": self.user.username,
                    "firstName": self.user.first_name,
                    "lastName": self.user.last_name,
                    "profileImage": self.user.profile_image_url,
                }
                if self.user
                else None
            ),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

        if post_comments:
            dict_post["postComments"] = [
                comment.to_dict() for comment in self.post_comments
            ]
        if post_likes:
            dict_post["postLikes"] = [
                user.to_dict_minimal() for user in self.post_likes
            ]
        return dict_post

    def __repr__(self):
        return (
            f"<Post id: {self.id} by: {self.user.username if self.user else 'Unknown'}>"
        )


# from .db import db, environment, SCHEMA, add_prefix_for_prod
# from .like import likes
# from datetime import datetime
# from app.models import User
# from sqlalchemy.orm import validates


# class Post(db.Model):
#     __tablename__ = "posts"

#     if environment == "production":
#         __table_args__ = {"schema": SCHEMA}

#     id = db.Column(db.Integer, primary_key=True)
#     title = db.Column(db.String(50), nullable=False, index=True)
#     caption = db.Column(db.String(250), nullable=False)
#     creator = db.Column(
#         db.Integer,
#         db.ForeignKey(add_prefix_for_prod("users.id")),
#         nullable=False,
#         index=True,
#     )
#     image = db.Column(db.String(500), nullable=False)
#     created_at = db.Column(db.DateTime, default=datetime.now, index=True)
#     updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

#     user = db.relationship(
#         "User", back_populates="posts", lazy="joined"
#     )  # Eager load user
#     post_likes = db.relationship(
#         "User", secondary=likes, back_populates="user_likes", lazy="select"
#     )
#     post_comments = db.relationship(
#         "Comment", back_populates="post", cascade="all, delete-orphan", lazy="select"
#     )

#     @validates("title")
#     def validate_title(self, key, title):
#         if not title or len(title.strip()) < 5:
#             raise ValueError("Title must be at least 5 characters long")
#         return title.strip()

#     @validates("caption")
#     def validate_caption(self, key, caption):
#         if not caption or len(caption.strip()) < 5:
#             raise ValueError("Caption must be at least 5 characters long")
#         return caption.strip()

#     def add_like(self, user_id):
#         """Optimized like addition with duplicate check"""
#         try:
#             # Check if already liked in one query
#             existing_like = (
#                 db.session.query(likes)
#                 .filter(likes.c.user_id == user_id, likes.c.post_id == self.id)
#                 .first()
#             )

#             if existing_like:
#                 return False

#             user = User.query.get(user_id)
#             if user:
#                 self.post_likes.append(user)
#                 db.session.commit()
#                 return True
#             return False
#         except Exception as e:
#             db.session.rollback()
#             return False

#     def remove_like(self, user_id):
#         """Optimized like removal"""
#         try:
#             user = User.query.get(user_id)
#             if user and user in self.post_likes:
#                 self.post_likes.remove(user)
#                 db.session.commit()
#                 return True
#             return False
#         except Exception as e:
#             db.session.rollback()
#             return False

#     def to_dict_minimal(self):
#         """Lightweight version for lists"""
#         return {
#             "id": self.id,
#             "title": self.title,
#             "caption": (
#                 self.caption[:100] + "..." if len(self.caption) > 100 else self.caption
#             ),
#             "creator": self.creator,
#             "image": self.image,
#             "likes": len(self.post_likes) if hasattr(self, "_likes_count") else 0,
#             "createdAt": self.created_at.isoformat(),
#         }

#     def to_dict(self, post_comments=False, post_likes=False):
#         """full dictionary representation"""
#         dict_post = {
#             "id": self.id,
#             "title": self.title,
#             "caption": self.caption,
#             "creator": self.creator,
#             "image": self.image,
#             "likes": len(self.post_likes),
#             "user": self.user.to_dict_minimal() if self.user else None,
#             "createdAt": self.created_at.isoformat(),
#             "updatedAt": self.updated_at.isoformat(),
#         }

#         if post_comments:
#             dict_post["postComments"] = [
#                 comment.to_dict() for comment in self.post_comments
#             ]
#         if post_likes:
#             dict_post["postLikes"] = [
#                 user.to_dict_minimal() for user in self.post_likes
#             ]
#         return dict_post

#     def __repr__(self):
#         return (
#             f"<Post id: {self.id} by: {self.user.username if self.user else 'Unknown'}>"
#         )
