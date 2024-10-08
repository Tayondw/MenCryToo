from .db import db, environment, SCHEMA, add_prefix_for_prod
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.ext.associationproxy import association_proxy
from flask_login import UserMixin
from datetime import datetime
from .like import likes
from .member import Membership
from .attendance import Attendance
from .user_tag import user_tags


class User(db.Model, UserMixin):
    __tablename__ = "users"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(20), nullable=False)
    last_name = db.Column(db.String(20), nullable=False)
    username = db.Column(db.String(40), nullable=False, unique=True)
    email = db.Column(db.String(255), nullable=False, unique=True)
    hashed_password = db.Column(db.String(255), nullable=False)
    bio = db.Column(db.String(500), nullable=True)
    profile_image_url = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationship attributes
    posts = db.relationship(
        "Post",
        back_populates="user",
    )

    user_likes = db.relationship(
        "Post",
        secondary=likes,
        back_populates="post_likes",
    )

    user_comments = db.relationship(
        "Comment",
        back_populates="commenter",
    )

    attendances = db.relationship("Attendance", back_populates="user")
    #     user_attendances = db.relationship(
    #         "Event",
    #         secondary=attendances,
    #         back_populates="event_attendances",
    #     )

    memberships = db.relationship("Membership", back_populates="user")

    #     user_memberships = db.relationship(
    #         "Group",
    #         secondary=members,
    #         back_populates="group_memberships",
    #     )

    users_tags = db.relationship(
        "Tag",
        secondary=user_tags,
        back_populates="tags_users",
    )

    groups = db.relationship("Group", back_populates="organizer")
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

    def to_dict(
        self,
        posts=False,
        user_comments=False,
        #   user_memberships=False,
        memberships=False,
        attendances=False,
        #   user_attendances=False,
        users_tags=False,
        events=False,
        group=False,
    ):
        dict_user = {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "username": self.username,
            "email": self.email,
            "bio": self.bio,
            "profileImage": self.profile_image_url,  # frontend will look for profileImage b/c that is the declared variable in the state
            "likes": len(self.user_likes),
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }

        if posts:
            dict_user["posts"] = [post.to_dict() for post in self.posts]
        if user_comments:
            dict_user["userComments"] = [
                comment.to_dict() for comment in self.user_comments
            ]
        if memberships:
            dict_user["userMembership"] = [
                user_membership.to_dict() for user_membership in self.memberships
            ]
        #   if user_memberships:
        #       dict_user["userMembership"] = [
        #           user_membership.to_dict() for user_membership in self.user_memberships
        #       ]
        if attendances:
            dict_user["userAttendances"] = [
                user_attendance.to_dict() for user_attendance in self.attendances
            ]
        #   if user_attendances:
        #       dict_user["userAttendances"] = [
        #           user_attendance.to_dict() for user_attendance in self.user_attendances
        #       ]
        if users_tags:
            dict_user["usersTags"] = [
                user_tag.to_dict() for user_tag in self.users_tags
            ]
        if events:
            dict_user["events"] = [event.to_dict() for event in self.events]
        if group:
            dict_user["group"] = [group.to_dict() for group in self.group]
        return dict_user

    def to_dict_no_posts(
        self,
        #   user_memberships=False,
        memberships=False,
        attendances=False,
        #   user_attendances=False,
        users_tags=False,
        events=False,
        group=False,
    ):

        dict_user = {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "username": self.username,
            "email": self.email,
            "bio": self.bio,
            "profileImage": self.profile_image_url,
            "likes": len(self.user_likes),
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }

        if memberships:
            dict_user["userMembership"] = [
                user_membership.to_dict() for user_membership in self.memberships
            ]
        #   if user_memberships:
        #       dict_user["userMembership"] = [
        #           user_membership.to_dict() for user_membership in self.user_memberships
        #       ]
        if attendances:
            dict_user["userAttendances"] = [
                user_attendance.to_dict() for user_attendance in self.attendances
            ]
        #   if user_attendances:
        #       dict_user["userAttendances"] = [
        #           user_attendance.to_dict() for user_attendance in self.user_attendances
        #       ]
        if users_tags:
            dict_user["usersTags"] = [
                user_tag.to_dict() for user_tag in self.users_tags
            ]
        if events:
            dict_user["events"] = [event.to_dict() for event in self.events]
        if group:
            dict_user["group"] = [group.to_dict() for group in self.group]    
        return dict_user
