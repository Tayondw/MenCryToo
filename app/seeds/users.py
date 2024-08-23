from app.models import db, User, Tag, environment, SCHEMA
from sqlalchemy.sql import text
from app.seeds.data.users import users
from app.seeds.data.tags import tags


# Adds a demo user, you can add other users here if you want
def seed_users():
    for user in users:
        db.session.add(
            User(
                first_name=user["first_name"],
                last_name=user["last_name"],
                username=user["username"],
                email=user["email"],
                password=user["password"],
                bio=user["bio"],
                profile_image_url=user["profile_image_url"],
            )
        )
    db.session.commit()


# Seed tags
def seed_tags():
    for tag_data in tags:
        tag = Tag(**tag_data)
        db.session.add(tag)
    db.session.commit()


# Seed tags for users - predefined
user_tag_associations = {
    "demo-user": ["ANGER"],
    "demo-lition": ["ANXIETY"],
    "charley": ["DEPRESSION"],
    "spongebob": ["SUBSTANCE ABUSE"],
    "eye-zik": ["STRESS", "SUBSTANCE ABUSE"],
    "iggy": ["RELATIONSHIPS", "ANGER"],
    "juana-banana": ["TRAUMA", "ANGER"],
    "zak-attack": ["COMING OUT", "DEPRESSION", "ANXIETY"],
    "donny-boy": ["GRIEF", "DEPRESSION"],
    "laustiNfound": ["SUICIDAL THOUGHTS", "DEPRESSION"],
}


def seed_user_tags():
    for username, tag_names in user_tag_associations.items():
        user = User.query.filter_by(username=username).first()
        for tag_name in tag_names:
            tag = Tag.query.filter_by(name=tag_name).first()
            if user and tag:
                user.users_tags.append(tag)
    db.session.commit()


# Uses a raw SQL query to TRUNCATE or DELETE the users table. SQLAlchemy doesn't
# have a built in function to do this. With postgres in production TRUNCATE
# removes all the data from the table, and RESET IDENTITY resets the auto
# incrementing primary key, CASCADE deletes any dependent entities.  With
# sqlite3 in development you need to instead use DELETE to remove all data and
# it will reset the primary keys for you as well.
def undo_users():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.users RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM users"))
    db.session.commit()


def undo_tags():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.tags RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM tags"))
    db.session.commit()


def undo_user_tags():
    if environment == "production":
        db.session.execute(
            f"TRUNCATE table {SCHEMA}.user_tags RESTART IDENTITY CASCADE;"
        )
    else:
        db.session.execute(text("DELETE FROM user_tags"))
    db.session.commit()
