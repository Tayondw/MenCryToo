from .db import db, environment, SCHEMA, add_prefix_for_prod


class Attendance(db.Model):
    __tablename__ = "attendances"

    if environment == "production":
        __table_args__ = {"schema": SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("users.id")), nullable=False
    )
    event_id = db.Column(
        db.Integer, db.ForeignKey(add_prefix_for_prod("events.id")), nullable=False
    )

    user = db.relationship("User", back_populates="attendances")
    event = db.relationship("Event", back_populates="attendances")

    def to_dict(self):
        return {
            "id": self.id,
            "eventId": self.event_id,
            "userId": self.user_id,
            "user": self.user.to_dict_no_posts() if self.user else None,
        }


# attendances = db.Table(
#     "attendances",
#     db.Model.metadata,
#     db.Column(
#         "user_id",
#         db.Integer,
#         db.ForeignKey(add_prefix_for_prod("users.id")),
#         primary_key=True,
#     ),
#     db.Column(
#         "event_id",
#         db.Integer,
#         db.ForeignKey(add_prefix_for_prod("events.id")),
#         primary_key=True,
#     ),
# )

# if environment == "production":
#     attendances.schema = SCHEMA
