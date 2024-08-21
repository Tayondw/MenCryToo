from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import SubmitField

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif"}


class GroupImageForm(FlaskForm):
    group_image = FileField(
        "Group Image File",
        validators=[FileRequired(), FileAllowed(list(ALLOWED_EXTENSIONS))],
    )


#     submit = SubmitField("Add Group Image")
