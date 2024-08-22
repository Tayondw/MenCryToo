from app.models import db, User, Post, environment, SCHEMA
from sqlalchemy.sql import text
from .data.posts import posts


def seed_posts():
    for post_data in posts:
        post = Post(
            creator=post_data["creator"],
            title=post_data["title"],
            caption=post_data["caption"],
            image=post_data["image"],
        )
        for user_id in post_data["post_likes"]:
            user = User.query.get(user_id)  # Adjust according to how you're querying
            post.post_likes.append(user)
        db.session.add(post)
    db.session.commit()


# Uses a raw SQL query to TRUNCATE or DELETE the users table. SQLAlchemy doesn't
# have a built in function to do this. With postgres in production TRUNCATE
# removes all the data from the table, and RESET IDENTITY resets the auto
# incrementing primary key, CASCADE deletes any dependent entities.  With
# sqlite3 in development you need to instead use DELETE to remove all data and
# it will reset the primary keys for you as well.
def undo_posts():
    if environment == "production":
        db.session.execute(
            f"TRUNCATE table {SCHEMA}.likes RESTART IDENTITY CASCADE;"
        )
        db.session.execute(f"TRUNCATE table {SCHEMA}.posts RESTART IDENTITY CASCADE;")
        db.session.execute(f"TRUNCATE table {SCHEMA}.users RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM likes"))
        db.session.execute(text("DELETE FROM posts"))

    db.session.commit()
