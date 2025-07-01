from .db import db, environment, SCHEMA, add_prefix_for_prod
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.ext.associationproxy import association_proxy
from flask_login import UserMixin
from datetime import datetime
from .like import likes
from .member import Membership
from .attendance import Attendance
from .user_tag import user_tags
from sqlalchemy.orm import joinedload


class User(db.Model, UserMixin):
    __tablename__ = "users"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True, index=True)
    first_name = db.Column(db.String(20), nullable=False, index=True)
    last_name = db.Column(db.String(20), nullable=False, index=True)
    username = db.Column(db.String(40), nullable=False, unique=True, index=True)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    hashed_password = db.Column(db.String(255), nullable=False)
    bio = db.Column(db.String(500), nullable=True)
    profile_image_url = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # Optimized relationships with lazy loading
    posts = db.relationship("Post", back_populates="user", lazy="select")
    user_likes = db.relationship(
        "Post", secondary=likes, back_populates="post_likes", lazy="select"
    )
    user_comments = db.relationship(
        "Comment", back_populates="commenter", lazy="select"
    )
    attendances = db.relationship("Attendance", back_populates="user", lazy="select")
    memberships = db.relationship("Membership", back_populates="user", lazy="select")
    users_tags = db.relationship(
        "Tag", secondary=user_tags, back_populates="tags_users", lazy="select"
    )
    groups = db.relationship("Group", back_populates="organizer", lazy="select")
    events = association_proxy("attendances", "event")
    group = association_proxy("memberships", "group")

    @property
    def password(self):
        return self.hashed_password

    @password.setter
    def password(self, password):
        if password == "OAUTH":
            self.hashed_password = "OAUTH"
            return
        else:
            self.hashed_password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict_auth_optimized(self):
        """Ultra-lightweight version for authentication - fastest possible loading"""
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "username": self.username,
            "email": self.email,
            "bio": self.bio,
            "profileImage": self.profile_image_url,
            "usersTags": (
                [{"id": tag.id, "name": tag.name} for tag in self.users_tags]
                if hasattr(self, "users_tags")
                else []
            ),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_dict_list_optimized(self):
        """Optimized for user lists - minimal data"""
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "username": self.username,
            "email": self.email,
            "profileImage": self.profile_image_url,
            "usersTags": (
                [{"id": tag.id, "name": tag.name} for tag in self.users_tags]
                if hasattr(self, "users_tags")
                else []
            ),
        }

    def to_dict_feed_optimized(self):
        """Optimized for profile feed - minimal data to reduce load time"""
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "username": self.username,
            "email": self.email,
            "bio": self.bio,
            "profileImage": self.profile_image_url,
            "usersTags": (
                [{"id": tag.id, "name": tag.name} for tag in self.users_tags]
                if hasattr(self, "users_tags")
                else []
            ),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_dict_profile_optimized(self, posts=None, comments=None):
        """Optimized version for profile page that accepts pre-loaded data"""
        result = {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "username": self.username,
            "email": self.email,
            "bio": self.bio,
            "profileImage": self.profile_image_url,
            "usersTags": (
                [{"id": tag.id, "name": tag.name} for tag in self.users_tags]
                if hasattr(self, "users_tags")
                else []
            ),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

        # Add membership info if available
        if hasattr(self, "memberships"):
            result["userMembership"] = [
                {
                    "id": membership.id,
                    "groupId": membership.group_id,
                    "userId": membership.user_id,
                    "group": (
                        {
                            "id": membership.group.id,
                            "name": membership.group.name,
                            "image": membership.group.image,
                            "city": membership.group.city,
                            "state": membership.group.state,
                        }
                        if membership.group
                        else None
                    ),
                }
                for membership in self.memberships
            ]

        # Add attendance info if available
        if hasattr(self, "attendances"):
            result["userAttendances"] = [
                {
                    "id": attendance.id,
                    "eventId": attendance.event_id,
                    "userId": attendance.user_id,
                }
                for attendance in self.attendances
            ]

        # Add group info if available
        if hasattr(self, "groups"):
            result["groups"] = [
                {
                    "id": group.id,
                    "name": group.name,
                    "image": group.image,
                }
                for group in self.groups
            ]

        # Use provided posts to avoid triggering additional queries
        if posts is not None:
            result["posts"] = [
                {
                    "id": post.id,
                    "title": post.title,
                    "caption": post.caption,
                    "image": post.image,
                    "likes": len(post.post_likes) if hasattr(post, "post_likes") else 0,
                    "creator": post.creator,
                    "createdAt": (
                        post.created_at.isoformat() if post.created_at else None
                    ),
                    "updatedAt": (
                        post.updated_at.isoformat() if post.updated_at else None
                    ),
                    "user": self.to_dict_list_optimized(),
                }
                for post in posts
            ]

        # Use provided comments to avoid triggering additional queries
        if comments is not None:
            result["userComments"] = [
                {
                    "id": comment.id,
                    "userId": comment.user_id,
                    "postId": comment.post_id,
                    "comment": comment.comment,
                    "username": self.username,
                    "parentId": comment.parent_id,
                    "created_at": (
                        comment.created_at.isoformat() if comment.created_at else None
                    ),
                    "updated_at": (
                        comment.updated_at.isoformat() if comment.updated_at else None
                    ),
                }
                for comment in comments
            ]

        return result

    def to_dict_minimal(self):
        """Lightweight version for lists and references - fastest loading"""
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "username": self.username,
            "email": self.email,
            "profileImage": self.profile_image_url,
        }

    def to_dict_optimized(self):
        """Optimized version for authentication - includes essential data only"""
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "username": self.username,
            "email": self.email,
            "bio": self.bio,
            "profileImage": self.profile_image_url,
            "usersTags": (
                [{"id": tag.id, "name": tag.name} for tag in self.users_tags]
                if hasattr(self, "users_tags")
                else []
            ),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_dict_no_posts(self):
        """Medium weight version without posts"""
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "username": self.username,
            "email": self.email,
            "bio": self.bio,
            "profileImage": self.profile_image_url,
            "likes": len(self.user_likes) if hasattr(self, "_user_likes_count") else 0,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    # Legacy methods kept for backward compatibility but optimized
    def to_dict(
        self,
        posts=False,
        user_comments=False,
        memberships=False,
        attendances=False,
        users_tags=False,
        events=False,
        group=False,
    ):
        """Full version - use sparingly as it can trigger many queries"""
        dict_user = self.to_dict


# from .db import db, environment, SCHEMA, add_prefix_for_prod
# from werkzeug.security import generate_password_hash, check_password_hash
# from sqlalchemy.ext.associationproxy import association_proxy
# from flask_login import UserMixin
# from datetime import datetime
# from .like import likes
# from .member import Membership
# from .attendance import Attendance
# from .user_tag import user_tags
# from sqlalchemy.orm import joinedload


# class User(db.Model, UserMixin):
#     __tablename__ = "users"

#     if environment == "production":
#         __table_args__ = {"schema": SCHEMA}

#     id = db.Column(db.Integer, primary_key=True)
#     first_name = db.Column(db.String(20), nullable=False, index=True)
#     last_name = db.Column(db.String(20), nullable=False, index=True)
#     username = db.Column(db.String(40), nullable=False, unique=True, index=True)
#     email = db.Column(db.String(255), nullable=False, unique=True, index=True)
#     hashed_password = db.Column(db.String(255), nullable=False)
#     bio = db.Column(db.String(500), nullable=True)
#     profile_image_url = db.Column(db.String(500), nullable=False)
#     created_at = db.Column(db.DateTime, default=datetime.now, index=True)
#     updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

#     # Optimized relationships with lazy loading
#     posts = db.relationship("Post", back_populates="user", lazy="select")
#     user_likes = db.relationship(
#         "Post", secondary=likes, back_populates="post_likes", lazy="select"
#     )
#     user_comments = db.relationship(
#         "Comment", back_populates="commenter", lazy="select"
#     )
#     attendances = db.relationship("Attendance", back_populates="user", lazy="select")
#     memberships = db.relationship("Membership", back_populates="user", lazy="select")
#     users_tags = db.relationship(
#         "Tag", secondary=user_tags, back_populates="tags_users", lazy="select"
#     )
#     groups = db.relationship("Group", back_populates="organizer", lazy="select")
#     events = association_proxy("attendances", "event")
#     group = association_proxy("memberships", "group")

#     @property
#     def password(self):
#         return self.hashed_password

#     @password.setter
#     def password(self, password):
#         if password == "OAUTH":
#             self.hashed_password = "OAUTH"
#             return
#         else:
#             self.hashed_password = generate_password_hash(password)

#     def check_password(self, password):
#         return check_password_hash(self.password, password)

#     def to_dict_minimal(self):
#         """Lightweight version for lists and references"""
#         return {
#             "id": self.id,
#             "firstName": self.first_name,
#             "lastName": self.last_name,
#             "username": self.username,
#             "email": self.email,
#             "profileImage": self.profile_image_url,
#         }

#     def to_dict_no_posts(self):
#         """Medium weight version without posts"""
#         return {
#             "id": self.id,
#             "firstName": self.first_name,
#             "lastName": self.last_name,
#             "username": self.username,
#             "email": self.email,
#             "bio": self.bio,
#             "profileImage": self.profile_image_url,
#             "likes": len(self.user_likes) if hasattr(self, "_user_likes_count") else 0,
#             "createdAt": self.created_at,
#             "updatedAt": self.updated_at,
#         }

#     def to_dict_for_profile_feed(self):
#         """Special method for profile feed that includes tags and posts"""
#         return {
#             "id": self.id,
#             "firstName": self.first_name,
#             "lastName": self.last_name,
#             "username": self.username,
#             "email": self.email,
#             "bio": self.bio,
#             "profileImage": self.profile_image_url,
#             "usersTags": [tag.to_dict() for tag in self.users_tags],
#             "posts": [post.to_dict() for post in self.posts],
#             "userComments": [comment.to_dict() for comment in self.user_comments],
#             "createdAt": self.created_at,
#             "updatedAt": self.updated_at,
#         }

#     def to_dict(
#         self,
#         posts=False,
#         user_comments=False,
#         memberships=False,
#         attendances=False,
#         users_tags=False,
#         events=False,
#         group=False,
#     ):
#         """Full version - use sparingly"""
#         dict_user = self.to_dict_no_posts()

#         if posts:
#             dict_user["posts"] = [post.to_dict() for post in self.posts]
#         if user_comments:
#             dict_user["userComments"] = [
#                 comment.to_dict() for comment in self.user_comments
#             ]
#         if memberships:
#             dict_user["userMembership"] = [
#                 membership.to_dict() for membership in self.memberships
#             ]
#         if attendances:
#             dict_user["userAttendances"] = [
#                 attendance.to_dict() for attendance in self.attendances
#             ]
#         if users_tags:
#             dict_user["usersTags"] = [tag.to_dict() for tag in self.users_tags]
#         if events:
#             dict_user["events"] = [event.to_dict() for event in self.events]
#         if group:
#             dict_user["group"] = [group.to_dict() for group in self.group]

#         return dict_user
