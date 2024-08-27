from app.models import db, Tag, environment, SCHEMA
from sqlalchemy.sql import text
from app.seeds.data.tags import tags


def seed_tags():
    for tag_data in tags:
        tag = Tag(**tag_data)
        db.session.add(tag)
    db.session.commit()


def undo_tags():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.tags RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM tags"))
    db.session.commit()
