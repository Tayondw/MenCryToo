from .db import db, environment, SCHEMA, add_prefix_for_prod


user_tags = db.Table(
    "user_tags",
    db.Model.metadata,
    db.Column(
        "user_id",
        db.Integer,
        db.ForeignKey(add_prefix_for_prod("users.id")),
        primary_key=True,
    ),
    db.Column(
        "tag_id",
        db.Integer,
        db.ForeignKey(add_prefix_for_prod("tags.id")),
        primary_key=True,
    ),
)

if environment == "production":
    user_tags.schema = SCHEMA
