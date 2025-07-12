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

    # Relationships with lazy loading
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

    def to_dict_auth(self):
        """Ultra-lightweight version for authentication - fastest possible loading"""

        # Get user's groups with organizerId included
        user_groups = []

        # Add groups where user is a member
        if hasattr(self, "memberships") and self.memberships:
            for membership in self.memberships:
                if membership.group:
                    group_data = {
                        "id": membership.group.id,
                        "name": membership.group.name,
                        "about": (
                            membership.group.about[:100] + "..."
                            if len(membership.group.about) > 100
                            else membership.group.about
                        ),
                        "image": membership.group.image,
                        "city": membership.group.city,
                        "state": membership.group.state,
                        "type": membership.group.type,
                        "organizerId": membership.group.organizer_id,
                        "numMembers": (
                            len(membership.group.memberships)
                            if hasattr(membership.group, "memberships")
                            else 0
                        ),
                    }
                    # Avoid duplicates
                    if not any(g["id"] == group_data["id"] for g in user_groups):
                        user_groups.append(group_data)

        # Add groups where user is organizer
        if hasattr(self, "groups") and self.groups:
            for group in self.groups:
                group_data = {
                    "id": group.id,
                    "name": group.name,
                    "about": (
                        group.about[:100] + "..."
                        if len(group.about) > 100
                        else group.about
                    ),
                    "image": group.image,
                    "city": group.city,
                    "state": group.state,
                    "type": group.type,
                    "organizerId": group.organizer_id,
                    "numMembers": (
                        len(group.memberships) if hasattr(group, "memberships") else 0
                    ),
                }
                # Avoid duplicates
                if not any(g["id"] == group_data["id"] for g in user_groups):
                    user_groups.append(group_data)

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
            "group": user_groups,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_dict_auth_with_complete_data(self):
        """Authentication version that includes ALL user's groups and events for home page"""

        # Collect ALL groups (both as member and organizer)
        all_user_groups = []

        # Add groups where user is a member
        if hasattr(self, "memberships") and self.memberships:
            for membership in self.memberships:
                if membership.group:
                    group_data = {
                        "id": membership.group.id,
                        "name": membership.group.name,
                        "about": (
                            membership.group.about[:100] + "..."
                            if len(membership.group.about) > 100
                            else membership.group.about
                        ),
                        "image": membership.group.image,
                        "city": membership.group.city,
                        "state": membership.group.state,
                        "type": membership.group.type,
                        "organizerId": membership.group.organizer_id,
                        "numMembers": (
                            len(membership.group.memberships)
                            if hasattr(membership.group, "memberships")
                            else 0
                        ),
                    }
                    # Avoid duplicates
                    if not any(g["id"] == group_data["id"] for g in all_user_groups):
                        all_user_groups.append(group_data)

        # Add groups where user is organizer
        if hasattr(self, "groups") and self.groups:
            for group in self.groups:
                group_data = {
                    "id": group.id,
                    "name": group.name,
                    "about": (
                        group.about[:100] + "..."
                        if len(group.about) > 100
                        else group.about
                    ),
                    "image": group.image,
                    "city": group.city,
                    "state": group.state,
                    "type": group.type,
                    "organizerId": group.organizer_id,
                    "numMembers": (
                        len(group.memberships) if hasattr(group, "memberships") else 0
                    ),
                }
                # Avoid duplicates
                if not any(g["id"] == group_data["id"] for g in all_user_groups):
                    all_user_groups.append(group_data)

        # Collect ALL events user is attending
        user_events = []
        if hasattr(self, "attendances") and self.attendances:
            for attendance in self.attendances:
                if attendance.event:
                    event_data = {
                        "id": attendance.event.id,
                        "name": attendance.event.name,
                        "description": (
                            attendance.event.description[:100] + "..."
                            if len(attendance.event.description) > 100
                            else attendance.event.description
                        ),
                        "type": attendance.event.type,
                        "capacity": attendance.event.capacity,
                        "image": attendance.event.image,
                        "startDate": (
                            attendance.event.start_date.isoformat()
                            if attendance.event.start_date
                            else None
                        ),
                        "endDate": (
                            attendance.event.end_date.isoformat()
                            if attendance.event.end_date
                            else None
                        ),
                        "numAttendees": (
                            len(attendance.event.attendances)
                            if hasattr(attendance.event, "attendances")
                            else 0
                        ),
                        "groupInfo": {
                            "name": (
                                attendance.event.groups.name
                                if attendance.event.groups
                                else "Unknown Group"
                            )
                        },
                        "venueInfo": (
                            {
                                "address": attendance.event.venues.address,
                                "city": attendance.event.venues.city,
                                "state": attendance.event.venues.state,
                            }
                            if attendance.event.venues
                            else None
                        ),
                    }
                    user_events.append(event_data)

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
            # ALL user's groups (member + organizer)
            "group": all_user_groups,
            # ALL user's events (through attendances)
            "events": user_events,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_dict_list(self):
        """For user lists - minimal data"""
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

    def to_dict_feed(self):
        """For profile feed - minimal data to reduce load time"""
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

    def to_dict_profile(self, posts=None, comments=None):
        """
        Method specifically for profile page.
        Returns all necessary data with efficient structure.
        """

        # Collect ALL groups (both as member and organizer) efficiently
        all_user_groups = []

        # Add groups where user is a member
        if hasattr(self, "memberships") and self.memberships:
            for membership in self.memberships:
                if membership.group:
                    group_data = {
                        "id": membership.group.id,
                        "name": membership.group.name,
                        "about": membership.group.about,
                        "image": membership.group.image,
                        "city": membership.group.city,
                        "state": membership.group.state,
                        "type": membership.group.type,
                        "organizerId": membership.group.organizer_id,
                        "numMembers": (
                            len(membership.group.memberships)
                            if hasattr(membership.group, "memberships")
                            else 0
                        ),
                    }
                    # Avoid duplicates
                    if not any(g["id"] == group_data["id"] for g in all_user_groups):
                        all_user_groups.append(group_data)

        # Add groups where user is organizer
        if hasattr(self, "groups") and self.groups:
            for group in self.groups:
                group_data = {
                    "id": group.id,
                    "name": group.name,
                    "about": group.about,
                    "image": group.image,
                    "city": group.city,
                    "state": group.state,
                    "type": group.type,
                    "organizerId": group.organizer_id,
                    "numMembers": (
                        len(group.memberships) if hasattr(group, "memberships") else 0
                    ),
                }
                # Avoid duplicates
                if not any(g["id"] == group_data["id"] for g in all_user_groups):
                    all_user_groups.append(group_data)

        # Collect ALL events user is attending
        user_events = []
        if hasattr(self, "attendances") and self.attendances:
            for attendance in self.attendances:
                if attendance.event:
                    event_data = {
                        "id": attendance.event.id,
                        "name": attendance.event.name,
                        "description": attendance.event.description,
                        "type": attendance.event.type,
                        "capacity": attendance.event.capacity,
                        "image": attendance.event.image,
                        "startDate": (
                            attendance.event.start_date.isoformat()
                            if attendance.event.start_date
                            else None
                        ),
                        "endDate": (
                            attendance.event.end_date.isoformat()
                            if attendance.event.end_date
                            else None
                        ),
                        "numAttendees": (
                            len(attendance.event.attendances)
                            if hasattr(attendance.event, "attendances")
                            else 0
                        ),
                        "groupInfo": {
                            "id": (
                                attendance.event.groups.id
                                if attendance.event.groups
                                else None
                            ),
                            "name": (
                                attendance.event.groups.name
                                if attendance.event.groups
                                else "Unknown Group"
                            ),
                        },
                        "venueInfo": (
                            {
                                "address": attendance.event.venues.address,
                                "city": attendance.event.venues.city,
                                "state": attendance.event.venues.state,
                            }
                            if attendance.event.venues
                            else None
                        ),
                    }
                    user_events.append(event_data)

        # Use provided posts or get from self.posts
        user_posts = []
        posts_to_process = (
            posts
            if posts is not None
            else (self.posts if hasattr(self, "posts") else [])
        )

        if posts_to_process:
            # Sort posts by creation date and limit to 20 most recent
            sorted_posts = sorted(
                posts_to_process,
                key=lambda p: p.created_at or datetime.min,
                reverse=True,
            )[:20]

            for post in sorted_posts:
                post_data = {
                    "id": post.id,
                    "title": post.title,
                    "caption": post.caption,
                    "image": post.image,
                    "creator": post.creator,
                    "likes": (
                        len(post.post_likes) if hasattr(post, "post_likes") else 0
                    ),
                    "numComments": (
                        len(post.post_comments) if hasattr(post, "post_comments") else 0
                    ),
                    "createdAt": (
                        post.created_at.isoformat() if post.created_at else None
                    ),
                    "updatedAt": (
                        post.updated_at.isoformat() if post.updated_at else None
                    ),
                    "user": {
                        "id": self.id,
                        "username": self.username,
                        "firstName": self.first_name,
                        "lastName": self.last_name,
                        "profileImage": self.profile_image_url,
                    },
                }
                user_posts.append(post_data)

        # Use provided comments or get from self.user_comments
        user_comments = []
        comments_to_process = (
            comments
            if comments is not None
            else (self.user_comments if hasattr(self, "user_comments") else [])
        )

        if comments_to_process:
            # Sort comments by creation date and limit to 10 most recent
            sorted_comments = sorted(
                comments_to_process,
                key=lambda c: c.created_at or datetime.min,
                reverse=True,
            )[:10]

            for comment in sorted_comments:
                comment_data = {
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
                user_comments.append(comment_data)

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
            # Complete data for profile display
            "group": all_user_groups,
            "events": user_events,
            "posts": user_posts,
            "userComments": user_comments,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

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

    def to_dict(self):
        """Basic dict method - includes essential data only"""
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

    def to_dict_create(self):
        """For post creation responses - minimal data"""
        return {
            "id": self.id,
            "username": self.username,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "profileImage": self.profile_image_url,
        }
