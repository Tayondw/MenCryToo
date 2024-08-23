from app.models import db, Comment, User, Post, environment, SCHEMA
from sqlalchemy.sql import text
from app.seeds.data.comments import comments


def seed_comments():
    for comment_data in comments:
        comment = Comment(
            user_id=comment_data["user_id"],
            post_id=comment_data["post_id"],
            comment=comment_data["comment"],
            parent_id=comment_data["parent_id"],
        )
        db.session.add(comment)
    db.session.commit()


def undo_comments():
    if environment == "production":
        db.session.execute(
            f"TRUNCATE table {SCHEMA}.comments RESTART IDENTITY CASCADE;"
        )
    else:
        db.session.execute(text("DELETE FROM comments"))

    db.session.commit()
