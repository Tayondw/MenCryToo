from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SelectField
from flask_wtf.file import FileAllowed, FileField, FileRequired
from wtforms.validators import DataRequired, Length

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif"}
tags = [
    "ANGER",
    "ANXIETY",
    "DEPRESSION",
    "SUBSTANCE ABUSE",
    "STRESS",
    "TRAUMA",
    "RELATIONSHIPS",
    "GRIEF",
    "COMING OUT",
    "SUICIDAL THOUGHTS",
]


class UserForm(FlaskForm):
    username = StringField(
        "User Name",
        validators=[
            DataRequired(),
            Length(
                min=3, max=20, message="Username must be between 3 and 20 characters"
            ),
        ],
    )
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
    profile_image = FileField(
        "Profile Image",
        validators=[FileRequired(), FileAllowed(list(ALLOWED_EXTENSIONS))],
    )
    user_tag = SelectField("tag", choices=tags)
