from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import IntegerField, SubmitField
from wtforms.validators import DataRequired

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif"}


class EventImageForm(FlaskForm):
    event_image = FileField(
        "Event Image File",
        validators=[FileRequired(), FileAllowed(list(ALLOWED_EXTENSIONS))],
    )
