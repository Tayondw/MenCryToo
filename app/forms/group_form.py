from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField, TextAreaField, SelectField, DateField
from wtforms.validators import DataRequired, Length, NumberRange, ValidationError

types = ["online", "in-person"]


class GroupForm(FlaskForm):
    organizer_id = IntegerField("organizer id", validators=[DataRequired()])
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
