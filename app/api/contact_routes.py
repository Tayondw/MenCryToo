from flask import Blueprint, request, render_template, redirect, jsonify
from flask_login import login_required, current_user
from app.models import db, Contact
from app.forms import ContactForm
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import threading

contact_routes = Blueprint("contact", __name__)

# Configure logging
logger = logging.getLogger(__name__)


def send_contact_email_async(email_data):
    """
    Send contact email asynchronously to avoid blocking the response
    """
    try:
        sender = os.environ.get("SENDER_EMAIL")
        receiver = os.environ.get("RECEIVER_EMAIL")
        username = os.environ.get("EMAIL_USERNAME")
        password = os.environ.get("EMAIL_PASSWORD")
        host = os.environ.get("EMAIL_HOST")
        port = int(os.environ.get("EMAIL_PORT", 587))

        # Build email body
        body = ""
        for key, value in email_data.items():
            body += f"{key}: {value}\n"

        message = MIMEMultipart()
        message["From"] = sender
        message["To"] = receiver
        message["Subject"] = email_data.get("subject", "Contact Form Submission")

        # Add body to email
        message.attach(MIMEText(body, "plain"))

        # Send email
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(username, password)
            server.sendmail(sender, receiver, message.as_string())

        logger.info(f"Contact email sent successfully for {email_data.get('email')}")
        return True

    except Exception as e:
        logger.error(f"Failed to send contact email: {e}")
        return False


@contact_routes.route("/", methods=["POST"])
def contact():
    """
    Create a contact request with processing
    """
    form = ContactForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        try:
            # Create contact record first (fast database operation)
            new_contact = Contact(
                first_name=form.data["firstName"],
                last_name=form.data["lastName"],
                phone=form.data["phone"],
                email=form.data["email"],
                subject=form.data["subject"],
                message=form.data["message"],
            )

            db.session.add(new_contact)
            db.session.commit()

            # Prepare email data for async sending
            email_data = {
                "First Name": form.data["firstName"],
                "Last Name": form.data["lastName"],
                "email": form.data["email"],
                "phone": form.data["phone"],
                "subject": form.data["subject"],
                "message": form.data["message"],
            }

            # Send email asynchronously (don't wait for it)
            try:
                email_thread = threading.Thread(
                    target=send_contact_email_async, args=(email_data,)
                )
                email_thread.daemon = True
                email_thread.start()
            except Exception as e:
                logger.warning(f"Could not start email thread: {e}")

            # Return success immediately without waiting for email
            return jsonify(new_contact.to_dict()), 201

        except Exception as e:
            db.session.rollback()
            logger.error(f"Database error creating contact: {e}")
            return jsonify({"error": "Failed to create contact request"}), 500

    return form.errors, 400


@contact_routes.route("/", methods=["GET"])
@login_required  # Only authenticated users can view contacts
def get_contacts():
    """
    Get all contact requests with pagination (admin only)
    """
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 50)

    # Add search functionality
    search = request.args.get("search", "").strip()

    contacts_query = Contact.query

    if search:
        contacts_query = contacts_query.filter(
            db.or_(
                Contact.first_name.ilike(f"%{search}%"),
                Contact.last_name.ilike(f"%{search}%"),
                Contact.email.ilike(f"%{search}%"),
                Contact.subject.ilike(f"%{search}%"),
            )
        )

    contacts_query = contacts_query.order_by(Contact.created_at.desc())
    contacts = contacts_query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "contacts": [contact.to_dict() for contact in contacts.items],
            "pagination": {
                "page": page,
                "pages": contacts.pages,
                "per_page": per_page,
                "total": contacts.total,
                "has_next": contacts.has_next,
                "has_prev": contacts.has_prev,
            },
        }
    )


@contact_routes.route("/<int:contactId>", methods=["GET"])
@login_required
def get_contact(contactId):
    """
    Get a specific contact request
    """
    contact = Contact.query.get(contactId)

    if not contact:
        return jsonify({"error": "Contact request not found"}), 404

    return jsonify(contact.to_dict())


@contact_routes.route("/<int:contactId>", methods=["DELETE"])
@login_required
def delete_contact(contactId):
    """
    Delete a contact request (admin only)
    """
    contact = Contact.query.get(contactId)

    if not contact:
        return jsonify({"error": "Contact request not found"}), 404

    try:
        db.session.delete(contact)
        db.session.commit()
        return jsonify({"message": "Contact request deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting contact: {e}")
        return jsonify({"error": "Failed to delete contact request"}), 500


@contact_routes.route("/<int:contactId>/respond", methods=["POST"])
@login_required
def respond_to_contact(contactId):
    """
    Respond to a contact request via email
    """
    contact = Contact.query.get(contactId)

    if not contact:
        return jsonify({"error": "Contact request not found"}), 404

    data = request.get_json()
    response_message = data.get("message", "").strip()

    if not response_message:
        return jsonify({"error": "Response message is required"}), 400

    # Prepare response email data
    email_data = {
        "subject": f"Re: {contact.subject}",
        "message": response_message,
        "original_request": f"Original message from {contact.first_name} {contact.last_name}: {contact.message}",
    }

    # Send response email asynchronously
    try:
        email_thread = threading.Thread(
            target=send_response_email_async, args=(contact.email, email_data)
        )
        email_thread.daemon = True
        email_thread.start()

        return jsonify({"message": "Response sent successfully"}), 200

    except Exception as e:
        logger.error(f"Error sending response email: {e}")
        return jsonify({"error": "Failed to send response"}), 500


def send_response_email_async(recipient_email, email_data):
    """
    Send response email to contact requester
    """
    try:
        sender = os.environ.get("SENDER_EMAIL")
        username = os.environ.get("EMAIL_USERNAME")
        password = os.environ.get("EMAIL_PASSWORD")
        host = os.environ.get("EMAIL_HOST")
        port = int(os.environ.get("EMAIL_PORT", 587))

        message = MIMEMultipart()
        message["From"] = sender
        message["To"] = recipient_email
        message["Subject"] = email_data["subject"]

        # Create email body
        body = f"{email_data['message']}\n\n---\n{email_data['original_request']}"
        message.attach(MIMEText(body, "plain"))

        # Send email
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(username, password)
            server.sendmail(sender, recipient_email, message.as_string())

        logger.info(f"Response email sent successfully to {recipient_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send response email: {e}")
        return False


@contact_routes.route("/stats", methods=["GET"])
@login_required
def get_contact_stats():
    """
    Get contact statistics for dashboard
    """
    try:
        from sqlalchemy import func
        from datetime import datetime, timedelta

        # Total contacts
        total_contacts = Contact.query.count()

        # Recent contacts (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_contacts = Contact.query.filter(
            Contact.created_at >= thirty_days_ago
        ).count()

        # Contacts by month (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        monthly_stats = (
            db.session.query(
                func.date_trunc("month", Contact.created_at).label("month"),
                func.count(Contact.id).label("count"),
            )
            .filter(Contact.created_at >= six_months_ago)
            .group_by(func.date_trunc("month", Contact.created_at))
            .order_by("month")
            .all()
        )

        # Most common subjects
        subject_stats = (
            db.session.query(Contact.subject, func.count(Contact.id).label("count"))
            .group_by(Contact.subject)
            .order_by(func.count(Contact.id).desc())
            .limit(5)
            .all()
        )

        stats = {
            "total_contacts": total_contacts,
            "recent_contacts": recent_contacts,
            "monthly_breakdown": [
                {"month": stat.month.strftime("%Y-%m"), "count": stat.count}
                for stat in monthly_stats
            ],
            "popular_subjects": [
                {"subject": stat.subject, "count": stat.count} for stat in subject_stats
            ],
        }

        return jsonify(stats)

    except Exception as e:
        logger.error(f"Error getting contact stats: {e}")
        return jsonify({"error": "Failed to retrieve statistics"}), 500


@contact_routes.route("/bulk-delete", methods=["POST"])
@login_required
def bulk_delete_contacts():
    """
    Bulk delete contact requests (admin only)
    """
    data = request.get_json()
    contact_ids = data.get("contact_ids", [])

    if not contact_ids:
        return jsonify({"error": "No contact IDs provided"}), 400

    try:
        # Use bulk delete for better performance
        deleted_count = Contact.query.filter(Contact.id.in_(contact_ids)).delete(
            synchronize_session=False
        )
        db.session.commit()

        return (
            jsonify(
                {"message": f"Successfully deleted {deleted_count} contact requests"}
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error bulk deleting contacts: {e}")
        return jsonify({"error": "Failed to delete contact requests"}), 500


# from flask import Blueprint, request, render_template, redirect, jsonify
# from flask_login import login_required, current_user
# from app.models import db, Contact
# from app.forms import ContactForm
# import smtplib
# import os
# from email.mime.text import MIMEText
# from email.mime.multipart import MIMEMultipart

# contact_routes = Blueprint("contact", __name__)


# @contact_routes.route("/", methods=["POST"])
# def contact():
#     """
#     Create a contact request to the creator of the project and submit to the database

#     renders an empty form on get requests, validates and submits form on post requests

#     The commented out code was to test if the post request works
#     """

#     form = ContactForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]

#     if form.validate_on_submit():
#         sender = os.environ.get("SENDER_EMAIL")
#         receiver = os.environ.get("RECEIVER_EMAIL")
#         username = os.environ.get("EMAIL_USERNAME")
#         password = os.environ.get("EMAIL_PASSWORD")
#         host = os.environ.get("EMAIL_HOST")
#         port = os.environ.get("EMAIL_PORT")
#         form_data = {
#             "First Name": form.data["firstName"],
#             "Last Name": form.data["lastName"],
#             "email": form.data["email"],
#             "phone": form.data["phone"],
#             "subject": form.data["subject"],
#             "message": form.data["message"],
#         }
#         #   body = form.data["message"]
#         body = ""
#         for key, value in form_data.items():
#             body += f"{key}: {value}\n"

#         message = MIMEMultipart()
#         message["From"] = sender
#         message["To"] = receiver
#         message["Subject"] = form.data["subject"]

#         # Add body to email
#         message.attach(MIMEText(body, "plain"))
#         try:
#             with smtplib.SMTP(host, port) as server:
#                 server.starttls()
#                 server.login(username, password)
#                 server.sendmail(sender, receiver, message.as_string())
#             print("Email sent successfully!")
#         except Exception as e:
#             print(f"Failed to send email: {e}")

#         new_contact = Contact(
#             first_name=form.data["firstName"],
#             last_name=form.data["lastName"],
#             phone=form.data["phone"],
#             email=form.data["email"],
#             subject=form.data["subject"],
#             message=form.data["message"],
#         )
#         db.session.add(new_contact)
#         db.session.commit()
#         return jsonify(new_contact.to_dict()), 201
#     return form.errors, 400
