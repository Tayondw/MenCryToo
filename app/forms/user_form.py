from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SelectMultipleField
from flask_wtf.file import FileAllowed, FileField, FileRequired
from wtforms.validators import DataRequired, Length

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


class UserForm(FlaskForm):
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
