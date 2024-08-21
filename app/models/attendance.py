from .db import db, environment, SCHEMA, add_prefix_for_prod

attendances = db.Table(
    "attendances",
    db.Model.metadata,
    db.Column(
        "user_id",
        db.Integer,
        db.ForeignKey(add_prefix_for_prod("users.id")),
        primary_key=True,
    ),
    db.Column(
        "event_id",
        db.Integer,
        db.ForeignKey(add_prefix_for_prod("events.id")),
        primary_key=True,
    ),
)

if environment == "production":
    attendances.schema = SCHEMA
