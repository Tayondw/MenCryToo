from flask_wtf import FlaskForm
from wtforms import (
    StringField,
    PasswordField,
    EmailField,
    TextAreaField,
    SelectMultipleField,
)
from flask_wtf.file import FileAllowed, FileField, FileRequired
from wtforms.validators import DataRequired, ValidationError, Length
from app.models import User

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif"}

tags = [
    ("ANGER", "ANGER"),
    ("ANXIETY", "ANXIETY"),
    ("DEPRESSION", "DEPRESSION"),
    ("SUBSTANCE ABUSE", "SUBSTANCE ABUSE"),
    ("STRESS", "STRESS"),
    ("TRAUMA", "TRAUMA"),
    ("RELATIONSHIPS", "RELATIONSHIPS"),
    ("GRIEF", "GRIEF"),
    ("COMING OUT", "COMING OUT"),
    ("SUICIDAL THOUGHTS", "SUICIDAL THOUGHTS"),
]


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
    firstName = StringField(
        "first name",
        validators=[
            DataRequired(),
            Length(
                min=3, max=20, message="First name must be between 3 and 20 characters"
            ),
        ],
    )
    lastName = StringField(
        "last name",
        validators=[
            DataRequired(),
            Length(
                min=3, max=20, message="Last name must be between 3 and 20 characters"
            ),
        ],
    )
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
    bio = TextAreaField(
        "Bio",
        validators=[
            DataRequired(),
            Length(
                min=50,
                max=500,
                message="Please enter at least 50 characters describing yourself",
            ),
        ],
    )
    profileImage = FileField(
        "Profile Image",
        validators=[FileRequired(), FileAllowed(list(ALLOWED_EXTENSIONS))],
    )
    userTags = SelectMultipleField(
        "Tags",
        choices=tags,
        validators=[DataRequired()],
        coerce=str,
    )
