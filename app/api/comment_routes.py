from flask import Blueprint, request, abort
from flask_login import login_required, current_user
from app.models import db, User, Post, Likes, Comment

comment_routes = Blueprint("comments", __name__)
