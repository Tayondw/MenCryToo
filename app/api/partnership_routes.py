from flask import Blueprint, request, render_template, redirect, jsonify
from flask_login import login_required, current_user
from app.models import db, Partnership
from app.forms import PartnershipForm
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

partnership_routes = Blueprint("partnerships", __name__)


@partnership_routes.route("/", methods=["POST"])
def partnerships():
    """
    Create a partnership request to the creator of the project and submit to the database

    renders an empty form on get requests, validates and submits form on post requests

    The commented out code was to test if the post request works
    """

    form = PartnershipForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        data = request.form
        email = data.get("email")

        # Check if the email already exists in the database
        existing_partnership = Partnership.query.filter_by(email=email).first()
        if existing_partnership:
            return jsonify({"error": "Email already exists"}), 400
      
        sender = os.environ.get("SENDER_EMAIL")
        receiver = os.environ.get("RECEIVER_EMAIL")
        username = os.environ.get("EMAIL_USERNAME")
        password = os.environ.get("EMAIL_PASSWORD")
        host = os.environ.get("EMAIL_HOST")
        port = os.environ.get("EMAIL_PORT")
        form_data = {
            "First Name": form.data["firstName"],
            "Last Name": form.data["lastName"],
            "email": form.data["email"],
            "phone": form.data["phone"],
            "subject": form.data["subject"],
            "message": form.data["message"],
        }
        #   body = form.data["message"]
        body = ""
        for key, value in form_data.items():
            body += f"{key}: {value}\n"

        message = MIMEMultipart()
        message["From"] = sender
        message["To"] = receiver
        message["Subject"] = form.data["subject"]

        # Add body to email
        message.attach(MIMEText(body, "plain"))
        try:
            with smtplib.SMTP(host, port) as server:
                server.starttls()
                server.login(username, password)
                server.sendmail(sender, receiver, message.as_string())
            print("Email sent successfully!")
        except Exception as e:
            print(f"Failed to send email: {e}")

        new_partnership = Partnership(
            first_name=form.data["firstName"],
            last_name=form.data["lastName"],
            phone=form.data["phone"],
            email=form.data["email"],
            subject=form.data["subject"],
            message=form.data["message"],
        )
        db.session.add(new_partnership)
        db.session.commit()
        return jsonify(new_partnership.to_dict()), 201
    return form.errors, 400
