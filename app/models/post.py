from .db import db, environment, SCHEMA, add_prefix_for_prod
from .like import likes
from datetime import datetime
from app.models import User
from sqlalchemy.orm import validates


class Post(db.Model):
    __tablename__ = "posts"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
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

    user = db.relationship(
        "User", back_populates="posts", lazy="joined"
    )  # Eager load user
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

    def add_like(self, user_id):
        """Optimized like addition with duplicate check"""
        try:
            # Check if already liked in one query
            existing_like = (
                db.session.query(likes)
                .filter(likes.c.user_id == user_id, likes.c.post_id == self.id)
                .first()
            )

            if existing_like:
                return False

            user = User.query.get(user_id)
            if user:
                self.post_likes.append(user)
                db.session.commit()
                return True
            return False
        except Exception as e:
            db.session.rollback()
            return False

    def remove_like(self, user_id):
        """Optimized like removal"""
        try:
            user = User.query.get(user_id)
            if user and user in self.post_likes:
                self.post_likes.remove(user)
                db.session.commit()
                return True
            return False
        except Exception as e:
            db.session.rollback()
            return False

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
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
            "user": self.user.to_dict_minimal() if self.user else None,
        }

    def to_dict(self, post_comments=False, post_likes=False):
        """full dictionary representation"""
        dict_post = {
            "id": self.id,
            "title": self.title,
            "caption": self.caption,
            "creator": self.creator,
            "image": self.image,
            "likes": len(self.post_likes),
            "user": self.user.to_dict_minimal() if self.user else None,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
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
