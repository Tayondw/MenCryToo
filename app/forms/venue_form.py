from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField
from wtforms.validators import DataRequired, Length


class VenueForm(FlaskForm):
    group_id = IntegerField("group id", validators=[DataRequired()])
    address = StringField("address", validators=[DataRequired()])
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
    latitude = StringField("lat", validators=[DataRequired()])
    longtitude = StringField("lng", validators=[DataRequired()])
