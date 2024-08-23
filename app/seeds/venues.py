from app.models import db, Venue, environment, SCHEMA
from sqlalchemy.sql import text
from app.seeds.data.venues import venues


def seed_venues():
    for venue_data in venues:
        venue = Venue(**venue_data)
        db.session.add(venue)
    db.session.commit()


def undo_venues():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.venues RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM venues"))
    db.session.commit()
