from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, EmailField
from flask_wtf.file import FileAllowed, FileField, FileRequired
from wtforms.validators import DataRequired, ValidationError, Length
from app.models import User

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif"}


def user_exists(form, field):
    # Checking if user exists
    email = field.data
    user = User.query.filter(User.email == email).first()
    if user:
        raise ValidationError("Email address is already in use.")


def username_exists(form, field):
    # Checking if username is already in use
    username = field.data
    user = User.query.filter(User.username == username).first()
    if user:
        raise ValidationError("Username is already in use.")


class SignUpForm(FlaskForm):
    username = StringField(
        "username",
        validators=[
            DataRequired(),
            Length(
                min=3, max=20, message="Username must be between 3 and 20 characters"
            ),
            username_exists,
        ],
    )
    email = EmailField("email", validators=[DataRequired(), user_exists])
    password = PasswordField("password", validators=[DataRequired()])
