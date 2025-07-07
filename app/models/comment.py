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
    comment = db.Column(db.String(500), nullable=False)  # Increased from 255 to 500
    parent_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("comments.id")), nullable=True
    )
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationship attributes
    commenter = db.relationship("User", back_populates="user_comments")
    post = db.relationship("Post", back_populates="post_comments")

    # Self-referencing relationship for nested comments (replies)
    replies = db.relationship(
        "Comment",
        backref=db.backref("parent", remote_side=[id]),
        lazy="select",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"< Comment id: {self.id} by: {self.commenter.username if self.commenter else 'Unknown'} >"

    def to_dict(self, include_replies=False, max_depth=5, current_depth=0):
        """
        Convert comment to dictionary with optional nested replies
        """
        base_dict = {
            "id": self.id,
            "userId": self.user_id,
            "postId": self.post_id,
            "comment": self.comment,
            "parentId": self.parent_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

        # Add commenter info if available
        if self.commenter:
            base_dict["commenter"] = {
                "id": self.commenter.id,
                "username": self.commenter.username,
                "firstName": self.commenter.first_name,
                "lastName": self.commenter.last_name,
                "profileImage": self.commenter.profile_image_url,
            }
        else:
            base_dict["username"] = "Unknown"

        # Include replies if requested and within depth limit
        if (
            include_replies
            and current_depth < max_depth
            and hasattr(self, "replies")
            and self.replies
        ):
            base_dict["replies"] = [
                reply.to_dict(
                    include_replies=True,
                    max_depth=max_depth,
                    current_depth=current_depth + 1,
                )
                for reply in sorted(self.replies, key=lambda x: x.created_at)
            ]
            base_dict["replyCount"] = len(self.replies)
        else:
            base_dict["replies"] = []
            base_dict["replyCount"] = (
                len(self.replies) if hasattr(self, "replies") and self.replies else 0
            )

        return base_dict

    def to_dict_minimal(self):
        """
        Minimal dictionary representation for performance
        """
        return {
            "id": self.id,
            "userId": self.user_id,
            "postId": self.post_id,
            "comment": (
                self.comment[:100] + "..." if len(self.comment) > 100 else self.comment
            ),
            "parentId": self.parent_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "username": self.commenter.username if self.commenter else "Unknown",
        }

    def to_dict_with_thread_info(self):
        """
        Dictionary with threading information
        """
        base_dict = self.to_dict()

        # Add thread depth and position info
        depth = self.get_thread_depth()
        base_dict["threadDepth"] = depth
        base_dict["isReply"] = self.parent_id is not None
        base_dict["hasReplies"] = hasattr(self, "replies") and len(self.replies) > 0

        # Add parent comment info if this is a reply
        if self.parent_id and hasattr(self, "parent") and self.parent:
            base_dict["parentComment"] = {
                "id": self.parent.id,
                "username": (
                    self.parent.commenter.username
                    if self.parent.commenter
                    else "Unknown"
                ),
                "comment": (
                    self.parent.comment[:50] + "..."
                    if len(self.parent.comment) > 50
                    else self.parent.comment
                ),
            }

        return base_dict

    def get_thread_depth(self):
        """
        Calculate the depth of this comment in the thread
        """
        depth = 0
        current = self
        while current.parent_id is not None:
            depth += 1
            # Avoid infinite loops
            if depth > 10:
                break
            current = current.parent if hasattr(current, "parent") else None
            if not current:
                break
        return depth

    def get_thread_root(self):
        """
        Get the root comment of this thread
        """
        current = self
        while current.parent_id is not None:
            if hasattr(current, "parent") and current.parent:
                current = current.parent
            else:
                break
        return current

    def get_all_replies(self):
        """
        Get all replies in this comment's thread (recursive)
        """
        all_replies = []

        def collect_replies(comment):
            if hasattr(comment, "replies") and comment.replies:
                for reply in comment.replies:
                    all_replies.append(reply)
                    collect_replies(reply)

        collect_replies(self)
        return all_replies

    def count_total_replies(self):
        """
        Count total number of replies (including nested)
        """
        return len(self.get_all_replies())

    def is_editable_by(self, user_id):
        """
        Check if comment can be edited by user
        """
        return self.user_id == user_id

    def is_deletable_by(self, user_id):
        """
        Check if comment can be deleted by user
        """
        return self.user_id == user_id

    def get_mention_username(self):
        """
        Extract @username from comment if it's a reply
        """
        import re

        if self.parent_id and self.comment:
            match = re.match(r"@(\w+)", self.comment.strip())
            return match.group(1) if match else None
        return None

    def get_comment_without_mention(self):
        """
        Get comment text without the @username mention
        """
        import re

        if self.parent_id and self.comment:
            # Remove @username from start of comment
            cleaned = re.sub(r"^@\w+\s*", "", self.comment.strip())
            return cleaned
        return self.comment

    @classmethod
    def get_comments_for_post(cls, post_id, page=1, per_page=20, include_replies=True):
        """
        Get comments for a post with pagination and optional threading
        """
        from sqlalchemy.orm import joinedload

        query = cls.query.options(
            joinedload(cls.commenter).load_only(
                "id", "username", "first_name", "last_name", "profile_image_url"
            )
        ).filter(cls.post_id == post_id)

        if not include_replies:
            query = query.filter(cls.parent_id.is_(None))

        query = query.order_by(cls.created_at.desc())

        return query.paginate(page=page, per_page=per_page, error_out=False)

    @classmethod
    def get_recent_comments(cls, page=1, per_page=20):
        """
        Get recent comments across all posts
        """
        from sqlalchemy.orm import joinedload

        query = (
            cls.query.options(
                joinedload(cls.commenter).load_only(
                    "id", "username", "first_name", "last_name", "profile_image_url"
                ),
                joinedload(cls.post).load_only("id", "title"),
            )
            .filter(cls.parent_id.is_(None))  # Only root comments
            .order_by(cls.created_at.desc())
        )

        return query.paginate(page=page, per_page=per_page, error_out=False)

    @classmethod
    def search_comments(cls, search_term, post_id=None):
        """
        Search comments by text content
        """
        from sqlalchemy.orm import joinedload

        query = cls.query.options(
            joinedload(cls.commenter).load_only(
                "id", "username", "first_name", "last_name", "profile_image_url"
            )
        )

        if post_id:
            query = query.filter(cls.post_id == post_id)

        query = query.filter(cls.comment.ilike(f"%{search_term}%")).order_by(
            cls.created_at.desc()
        )

        return query.all()


# from .db import db, environment, SCHEMA, add_prefix_for_prod
# from datetime import datetime


# class Comment(db.Model):
#     __tablename__ = "comments"

#     if environment == "production":
#         __table_args__ = {"schema": SCHEMA}

#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(
#         db.Integer, db.ForeignKey(add_prefix_for_prod("users.id")), nullable=False
#     )
#     post_id = db.Column(
#         db.Integer, db.ForeignKey(add_prefix_for_prod("posts.id")), nullable=False
#     )
#     comment = db.Column(db.String(255), nullable=False)
#     parent_id = db.Column(
#         db.Integer, db.ForeignKey(add_prefix_for_prod("comments.id")), nullable=True
#     )
#     created_at = db.Column(db.DateTime, default=datetime.now)
#     updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

#     # Relationship attributes
#     commenter = db.relationship("User", back_populates="user_comments")
#     post = db.relationship("Post", back_populates="post_comments")

#     # Self-referencing relationship for nested comments (replies)
#     replies = db.relationship("Comment", backref=db.backref("parent", remote_side=[id]))

#     def __repr__(self):
#         return f"< Comment id: {self.id} by: {self.commenter.username} >"

#     def to_dict(self):
#         return {
#             "id": self.id,
#             "userId": self.user_id,
#             "postId": self.post_id,
#             "comment": self.comment,
#             "username": self.commenter.username,
#             "parentId": self.parent_id,
#             "created_at": self.created_at,
#             "updated_at": self.updated_at,
#         }
