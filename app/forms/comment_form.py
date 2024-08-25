from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField, SubmitField
from wtforms.validators import DataRequired, Length


class CommentForm(FlaskForm):
    comment = StringField(
        "comment",
        validators=[
            DataRequired(),
            Length(
                min=1, max=255, message="Comments must be between 1 and 255 characters"
            ),
        ],
    )
    submit = SubmitField("")
