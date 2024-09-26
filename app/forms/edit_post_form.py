from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField
from flask_wtf.file import FileAllowed, FileField, FileRequired
from wtforms.validators import DataRequired, Length

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif"}


class EditPostForm(FlaskForm):
    title = StringField(
        "Title",
        validators=[
            DataRequired(),
            Length(
                min=5,
                max=25,
                message="The post title must be between 5 and 25 characters",
            ),
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
        validators=[FileAllowed(list(ALLOWED_EXTENSIONS))],
    )
