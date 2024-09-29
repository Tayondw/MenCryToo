from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, EmailField, IntegerField
from wtforms.validators import DataRequired, Length, ValidationError


def correct_phone(form, field):
    phone = field.data
    if len(str(phone)) != 10:
        raise ValidationError("Invalid Phone Number")


class PartnershipForm(FlaskForm):
    firstName = StringField(
        "First Name",
        validators=[
            DataRequired(),
            Length(
                min=3, max=20, message="First name must be between 3 and 20 characters"
            ),
        ],
    )
    lastName = StringField(
        "Last Name",
        validators=[
            DataRequired(),
            Length(
                min=3, max=20, message="Last name must be between 3 and 20 characters"
            ),
        ],
    )
    email = EmailField("email", validators=[DataRequired()])
    phone = IntegerField("phone", validators=[DataRequired(), correct_phone])
    subject = StringField(
        "Subject",
        validators=[
            DataRequired(),
            Length(
                min=3, max=20, message="Subject must be between 3 and 20 characters"
            ),
        ],
    )
    message = TextAreaField(
        "Message",
        validators=[
            DataRequired(),
            Length(
                min=10,
                max=500,
                message="Please enter at least 10 characters detailing what you need",
            ),
        ],
    )
