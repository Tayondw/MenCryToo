from flask_wtf import FlaskForm
from wtforms import (
    StringField,
    IntegerField,
    TextAreaField,
    SelectField,
    DateTimeLocalField,
)
from wtforms.validators import DataRequired, Length, NumberRange, ValidationError
from flask_wtf.file import FileField, FileAllowed

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif"}

types = ["online", "in-person"]


class EditEventForm(FlaskForm):
    name = StringField(
        "Event Name",
        validators=[
            DataRequired(message="Event name is required"),
            Length(
                min=5, max=50, message="Event name must be between 5 and 50 characters"
            ),
        ],
    )
    description = TextAreaField(
        "Event description",
        validators=[
            DataRequired(message="Description is required"),
            Length(
                min=50,
                max=150,
                message="Please enter at between 50 and 150 characters describing the event",
            ),
        ],
    )
    type = SelectField(
        "Event type",
        validators=[DataRequired(message="Event type is required")],
        choices=types,
    )
    capacity = IntegerField(
        "Event capacity",
        validators=[
            DataRequired(message="Capacity is required"),
            NumberRange(min=2, max=300),
        ],
    )
    image = FileField(
        "Event Image File",
        validators=[FileAllowed(list(ALLOWED_EXTENSIONS))],
    )
    startDate = DateTimeLocalField(
        "start_date",
        format="%Y-%m-%dT%H:%M",
        validators=[DataRequired(message="Start date is required")],
    )
    endDate = DateTimeLocalField(
        "end_date",
        format="%Y-%m-%dT%H:%M",
        validators=[DataRequired(message="End date is required")],
    )

    def validate_date_range(self):
        if self.startDate.data >= self.endDate.data:
            raise ValidationError("End date must be after start date")
