from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SelectField
from wtforms.validators import DataRequired, Length
from flask_wtf.file import FileField, FileAllowed, FileRequired

types = ["online", "in-person"]
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif"}


class GroupForm(FlaskForm):
    name = StringField(
        "Group Name",
        validators=[
            DataRequired(),
            Length(
                min=3, max=50, message="Group name must be between 3 and 50 characters"
            ),
        ],
    )
    about = TextAreaField(
        "Group description",
        validators=[
            DataRequired(),
            Length(
                min=20,
                max=150,
                message="Please enter at between 20 and 150 characters describing the group",
            ),
        ],
    )
    type = SelectField("Group type", validators=[DataRequired()], choices=types)
    city = StringField(
        "city",
        validators=[
            DataRequired(),
            Length(
                min=3, max=30, message="City name must be between 3 and 30 characters"
            ),
        ],
    )
    state = StringField(
        "state",
        validators=[
            DataRequired(),
            Length(
                min=2, max=2, message="Please enter the abbreviated form of the state"
            ),
        ],
    )
    image = FileField(
        "Group Image File",
        validators=[FileRequired(), FileAllowed(list(ALLOWED_EXTENSIONS))],
    )
