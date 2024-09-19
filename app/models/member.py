from .db import db, environment, SCHEMA, add_prefix_for_prod


class Membership(db.Model):
    __tablename__ = "memberships"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("users.id")), nullable=False
    )
    group_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("groups.id")), nullable=False
    )

    # You can add relationships if needed
    user = db.relationship("User", back_populates="memberships")
    group = db.relationship("Group", back_populates="memberships")

    def to_dict(self):
        return {
            "id": self.id,
            "groupId": self.group_id,
            "userId": self.user_id,
            "user": self.user.to_dict_no_posts() if self.user else None,
            # "group": self.group.to_dict() if self.group else None,
        }


# members = db.Table(
#     "members",
#     db.Model.metadata,
#     db.Column(
#         "user_id",
#         db.Integer,
#         db.ForeignKey(add_prefix_for_prod("users.id")),
#         primary_key=True,
#     ),
#     db.Column(
#         "group_id",
#         db.Integer,
#         db.ForeignKey(add_prefix_for_prod("groups.id")),
#         primary_key=True,
#     ),
# )

# if environment == "production":
#     members.schema = SCHEMA
