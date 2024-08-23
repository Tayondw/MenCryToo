from app.models import db, Group, GroupImage, environment, SCHEMA
from sqlalchemy.sql import text
from app.seeds.data.groups import groups
from app.seeds.data.group_images import group_images


def seed_groups():
    for group_data in groups:
        group = Group(**group_data)
        db.session.add(group)
    db.session.commit()


def seed_group_images():
    for group_image_data in group_images:
        group_image = GroupImage(**group_image_data)
        db.session.add(group_image)
    db.session.commit()


def undo_groups():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.groups RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM groups"))
    db.session.commit()


def undo_group_images():
    if environment == "production":
        db.session.execute(
            f"TRUNCATE table {SCHEMA}.group_images RESTART IDENTITY CASCADE;"
        )
    else:
        db.session.execute(text("DELETE FROM group_images"))
    db.session.commit()
