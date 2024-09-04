from datetime import datetime
from random import sample, randint
from app.seeds.data.users import users


events = [
    {
        "group_id": 1,
        "venue_id": 1,
        "name": "EVENT 1",
        "description": "What we will be doing is assisting those with anger management issues",
        "type": "in-person",
        "capacity": 20,
        "image": "https://mencrytoo.s3.amazonaws.com/event-images/event-1.png",
        "start_date": datetime(2024, 6, 5, 9, 0),
        "end_date": datetime(2024, 6, 5, 17, 0),
        "event_attendances": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "group_id": 2,
        "venue_id": 2,
        "name": "EVENT 2",
        "description": "What we will be doing is assisting those with anxiety disorder",
        "type": "in-person",
        "capacity": 20,
        "image": "https://mencrytoo.s3.amazonaws.com/event-images/allEvents.png",
        "start_date": datetime(2024, 7, 5, 9, 0),
        "end_date": datetime(2024, 7, 5, 17, 0),
        "event_attendances": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "group_id": 3,
        "venue_id": 3,
        "name": "EVENT 3",
        "description": "What we will be doing is assisting those who are battling depression",
        "type": "in-person",
        "capacity": 20,
        "image": "https://mencrytoo.s3.amazonaws.com/event-images/event-growth.png",
        "start_date": datetime(2024, 12, 5, 9, 0),
        "end_date": datetime(2024, 12, 5, 17, 0),
        "event_attendances": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "group_id": 4,
        "venue_id": 4,
        "name": "EVENT 4",
        "description": "What we will be doing is assisting those with substance abuse issues",
        "type": "in-person",
        "capacity": 25,
        "image": "https://mencrytoo.s3.amazonaws.com/event-images/event.png",
        "start_date": datetime(2024, 11, 5, 9, 0),
        "end_date": datetime(2024, 11, 5, 17, 0),
        "event_attendances": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "group_id": 5,
        "venue_id": 5,
        "name": "EVENT 5",
        "description": "What we will be doing is assisting those who need guidance in coming out to loved ones and being their authentic selves",
        "type": "in-person",
        "capacity": 30,
        "image": "https://mencrytoo.s3.amazonaws.com/event-images/meetup-1.png",
        "start_date": datetime(2024, 9, 5, 9, 0),
        "end_date": datetime(2024, 9, 5, 17, 0),
        "event_attendances": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "group_id": 6,
        "venue_id": 6,
        "name": "EVENT 6",
        "description": "What we will be doing is assisting those with stress",
        "type": "in-person",
        "capacity": 35,
        "image": "https://mencrytoo.s3.amazonaws.com/event-images/meetup-2.png",
        "start_date": datetime(2024, 8, 12, 9, 0),
        "end_date": datetime(2024, 8, 12, 17, 0),
        "event_attendances": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "group_id": 7,
        "venue_id": None,
        "name": "EVENT 7",
        "description": "What we will be doing is assisting those with trauma from the past",
        "type": "online",
        "capacity": 50,
        "image": "https://mencrytoo.s3.amazonaws.com/event-images/meetup-3.png",
        "start_date": datetime(2024, 8, 5, 9, 0),
        "end_date": datetime(2024, 8, 5, 17, 0),
        "event_attendances": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "group_id": 8,
        "venue_id": None,
        "name": "EVENT 8",
        "description": "What we will be doing is assisting those with trouble maintaining healthy relationships",
        "type": "online",
        "capacity": 75,
        "image": "https://mencrytoo.s3.amazonaws.com/event-images/meetup-4.png",
        "start_date": datetime(2024, 10, 3, 9, 0),
        "end_date": datetime(2024, 10, 3, 17, 0),
        "event_attendances": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "group_id": 9,
        "venue_id": None,
        "name": "EVENT 9",
        "description": "What we will be doing is assisting those with grief",
        "type": "online",
        "capacity": 100,
        "image": "https://mencrytoo.s3.amazonaws.com/event-images/meetup-5.png",
        "start_date": datetime(2024, 10, 4, 9, 0),
        "end_date": datetime(2024, 10, 4, 17, 0),
        "event_attendances": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
    {
        "group_id": 10,
        "venue_id": None,
        "name": "EVENT 10",
        "description": "What we will be doing is assisting those with suicidal thoughts",
        "type": "online",
        "capacity": 10,
        "image": "https://mencrytoo.s3.amazonaws.com/event-images/meetup-5.png",
        "start_date": datetime(2024, 10, 5, 9, 0),
        "end_date": datetime(2024, 10, 5, 17, 0),
        "event_attendances": [
            user["username"] for user in sample(users, randint(0, len(users)))
        ],
    },
]
