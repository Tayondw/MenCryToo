from random import sample, randint
from app.seeds.data.users import users

groups = [
    {
        "organizer_id": 1,
        "name": "I NEED MORE THAN A SNICKERS",
        "about": "this is for those with anger",
        "type": "in-person",
        "city": "Tucker",
        "state": "GA",
        "group_memberships": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "organizer_id": 2,
        "name": "FREE ME FROM MY THOUGHTS",
        "about": "this is for those with anxiety",
        "type": "in-person",
        "city": "San Francisco",
        "state": "CA",
        "group_memberships": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "organizer_id": 3,
        "name": "I WANT TO FEEL BETTER",
        "about": "this is for those with depression",
        "type": "in-person",
        "city": "Austin",
        "state": "TX ",
        "group_memberships": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "organizer_id": 4,
        "name": "AND NOW THAT I'M OLDER, I'LL NEVER BE SOBER",
        "about": "That one Childish Gambino song",
        "type": "in-person",
        "city": "Alexandria",
        "state": "VA",
        "group_memberships": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "organizer_id": 5,
        "name": "THAT ONE DIANA ROSS SONG",
        "about": "this is for those who need guidance coming out",
        "type": "in-person",
        "city": "Atlanta",
        "state": "GA",
        "group_memberships": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "organizer_id": 6,
        "name": "WOO-SAH!",
        "about": "this is for those with stress",
        "type": "in-person",
        "city": "Seattle",
        "state": "WA",
        "group_memberships": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "organizer_id": 7,
        "name": "THE PAST IS IN FRONT OF ME",
        "about": "this is for those with trauma",
        "type": "online",
        "city": "New York City",
        "state": "NY",
        "group_memberships": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "organizer_id": 8,
        "name": "WHAT DO THE LONELY DO AT CHRISTMAS TIME?",
        "about": "this is for those with relationship issues",
        "type": "online",
        "city": "Petaluma",
        "state": "CA",
        "group_memberships": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "organizer_id": 9,
        "name": "LET IT GO!",
        "about": "this is for those with grief",
        "type": "online",
        "city": "Boston",
        "state": "MA",
        "group_memberships": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "organizer_id": 10,
        "name": "NOT GETTING ANY PENNIES FOR THESE THOUGHTS",
        "about": "this is for those with suicidal thoughts",
        "type": "online",
        "city": "Chicago",
        "state": "MI",
        "group_memberships": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
]
