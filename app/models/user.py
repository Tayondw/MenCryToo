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

    id = db.Column(db.Integer, primary_key=True)
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

    def to_dict_minimal(self):
        """Lightweight version for lists and references"""
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "username": self.username,
            "email": self.email,
            "profileImage": self.profile_image_url,
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
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }

    def to_dict_for_profile_feed(self):
        """Special method for profile feed that includes tags and posts"""
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "username": self.username,
            "email": self.email,
            "bio": self.bio,
            "profileImage": self.profile_image_url,
            "usersTags": [tag.to_dict() for tag in self.users_tags],
            "posts": [post.to_dict() for post in self.posts],
            "userComments": [comment.to_dict() for comment in self.user_comments],
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }

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
        """Full version - use sparingly"""
        dict_user = self.to_dict_no_posts()

        if posts:
            dict_user["posts"] = [post.to_dict() for post in self.posts]
        if user_comments:
            dict_user["userComments"] = [
                comment.to_dict() for comment in self.user_comments
            ]
        if memberships:
            dict_user["userMembership"] = [
                membership.to_dict() for membership in self.memberships
            ]
        if attendances:
            dict_user["userAttendances"] = [
                attendance.to_dict() for attendance in self.attendances
            ]
        if users_tags:
            dict_user["usersTags"] = [tag.to_dict() for tag in self.users_tags]
        if events:
            dict_user["events"] = [event.to_dict() for event in self.events]
        if group:
            dict_user["group"] = [group.to_dict() for group in self.group]

        return dict_user
