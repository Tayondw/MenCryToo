from app.models import db, Group, GroupImage, User, Membership, environment, SCHEMA
from sqlalchemy.sql import text
from app.seeds.data.groups import groups
from app.seeds.data.group_images import group_images


def seed_groups():
    # Retrieve all users once for later lookup
    all_users = User.query.all()
    user_map = {user.username: user for user in all_users}

    for group_data in groups:
        group = Group(
            organizer_id=group_data["organizer_id"],
            name=group_data["name"],
            about=group_data["about"],
            type=group_data["type"],
            city=group_data["city"],
            state=group_data["state"],
            image=group_data["image"],
        )
        db.session.add(group)
        db.session.flush()  # Ensure the group.id is available before adding memberships

        for username in group_data["memberships"]:
            user = user_map.get(username)
            if user:
                if not any(
                    membership.user_id == user.id for membership in group.memberships
                ):
                    membership = Membership(group_id=group.id, user_id=user.id)
                    db.session.add(membership)
            else:
                print(f"User with username {username} not found")

    #   for username in group_data["memberships"]:
    #       user = user_map.get(username)
    #       if user:
    #           if user not in group.memberships:
    #               group.memberships.append(user)
    #       else:
    #           print(f"User with username {username} not found")

    db.session.commit()


# def seed_group_images():
#     for group_image_data in group_images:
#         group_image = GroupImage(**group_image_data)
#         db.session.add(group_image)
#     db.session.commit()


def undo_groups():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.groups RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM groups"))
    db.session.commit()


# def undo_group_images():
#     if environment == "production":
#         db.session.execute(
#             f"TRUNCATE table {SCHEMA}.group_images RESTART IDENTITY CASCADE;"
#         )
#     else:
#         db.session.execute(text("DELETE FROM group_images"))
#     db.session.commit()
