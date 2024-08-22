from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField, TextAreaField, SelectField, DateField
from wtforms.validators import DataRequired, Length, NumberRange, ValidationError

types = ["outdoor", "indoor"]


class EventForm(FlaskForm):
    group_id = IntegerField("group id", validators=[DataRequired()])
    name = StringField(
        "Event Name",
        validators=[
            DataRequired(),
            Length(
                min=5, max=50, message="Event name must be between 5 and 50 characters"
            ),
        ],
    )
    description = TextAreaField(
        "Event description",
        validators=[
            DataRequired(),
            Length(
                min=50,
                max=150,
                message="Please enter at between 50 and 150 characters describing the event",
            ),
        ],
    )
    type = SelectField("Event type", validators=[DataRequired()], choices=types)
    capacity = IntegerField(
        "Event capacity", validators=[DataRequired(), NumberRange(min=2, max=300)]
    )
    start_date = DateField("start_date", format="%Y-%m-%d", validators=[DataRequired()])
    end_date = DateField("end_date", format="%Y-%m-%d", validators=[DataRequired()])

    def validate_date_range(self):
        if self.start_date.data >= self.end_date.data:
            raise ValidationError("End date must be after start date")
