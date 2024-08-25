from flask import Blueprint, request, abort
from flask_login import login_required, current_user
from app.models import db, User, Post, Comment, Likes
from app.forms import PostForm, CommentForm
from app.aws import get_unique_filename, upload_file_to_s3, remove_file_from_s3

post_routes = Blueprint("posts", __name__)
