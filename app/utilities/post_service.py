from app.models import db, User, Post


def add_like_to_post(user_id, post_id):
    user = User.query.get(user_id)
    post = Post.query.get(post_id)

    if user and post:
        post.post_likes.append(user)
        post.like_count += 1  # Increment the like count
        db.session.commit()
        return True
    return False


def remove_like_from_post(user_id, post_id):
    user = User.query.get(user_id)
    post = Post.query.get(post_id)

    if user and post:
        post.post_likes.remove(user)
        post.like_count -= 1  # Decrement the like count
        db.session.commit()
        return True
    return False
