from app.models import db, User, Post, environment, SCHEMA
from sqlalchemy.sql import text
from app.seeds.data.posts import posts
from random import sample, randint

# from sqlalchemy.exc import IntegrityError


def seed_posts():
    # Retrieve all users once for later lookup
    all_users = User.query.all()
    user_map = {user.username: user for user in all_users}
    for post_data in posts:
        post = Post(
            creator=post_data["creator"],
            title=post_data["title"],
            caption=post_data["caption"],
            image=post_data["image"],
        )
        # Add predefined likes to the post
        for username in post_data["post_likes"]:
            user = user_map.get(username)
            if user:
                post.post_likes.append(user)
            else:
                print(f"User with username {username} not found")
        print(f"Post: {post.title}, Likes: {len(post.post_likes)}")  # Debugging line
        db.session.add(post)
    db.session.commit()


def seed_posts_minimal():
    """Seed only 10 posts for faster loading"""
    from app.models import db, User, Post
    from app.seeds.data.posts import posts
    from random import sample

    all_users = User.query.all()
    user_map = {user.username: user for user in all_users}

    # Only use first 10 posts
    minimal_posts = posts[:10]

    for post_data in minimal_posts:
        post = Post(
            creator=post_data["creator"],
            title=post_data["title"],
            caption=post_data["caption"],
            image=post_data["image"],
        )

        # Add fewer likes for faster processing
        for username in post_data["post_likes"][:3]:  # Only 3 likes per post
            user = user_map.get(username)
            if user:
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
        db.session.execute(f"TRUNCATE table {SCHEMA}.likes RESTART IDENTITY CASCADE;")
        db.session.execute(f"TRUNCATE table {SCHEMA}.posts RESTART IDENTITY CASCADE;")
        db.session.execute(f"TRUNCATE table {SCHEMA}.users RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM likes"))
        db.session.execute(text("DELETE FROM posts"))

    db.session.commit()
