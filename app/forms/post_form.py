from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField
from flask_wtf.file import FileAllowed, FileField, FileRequired
from wtforms.validators import DataRequired, Length

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif"}


class PostForm(FlaskForm):
    title = StringField(
        "Title",
        validators=[
            DataRequired(),
        ],
    )
    caption = TextAreaField(
        "Caption",
        validators=[
            DataRequired(),
            Length(
                min=5,
                max=250,
                message="The post caption must be between 5 and 250 characters",
            ),
        ],
    )
    image = FileField(
        "Post image",
        validators=[FileRequired(), FileAllowed(list(ALLOWED_EXTENSIONS))],
    )
