from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import IntegerField
from wtforms.validators import DataRequired

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif"}


class GroupImageForm(FlaskForm):
    group_id = IntegerField("group id", validators=[DataRequired()])
    group_image = FileField(
        "Group Image File",
        validators=[FileRequired(), FileAllowed(list(ALLOWED_EXTENSIONS))],
    )
