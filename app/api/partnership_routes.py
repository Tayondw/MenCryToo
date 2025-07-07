from flask import Blueprint, request, render_template, redirect, jsonify
from flask_login import login_required, current_user
from app.models import db, Partnership
from app.forms import PartnershipForm
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
import logging

partnership_routes = Blueprint("partnerships", __name__)

# Configure logging for email debugging
logger = logging.getLogger(__name__)


def send_email_async(email_data):
    """
    Send email asynchronously to avoid blocking the response
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
        message["Subject"] = email_data.get("subject", "Partnership Request")

        # Add body to email
        message.attach(MIMEText(body, "plain"))

        # Send email
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(username, password)
            server.sendmail(sender, receiver, message.as_string())

        logger.info(
            f"Partnership email sent successfully for {email_data.get('email')}"
        )
        return True

    except Exception as e:
        logger.error(f"Failed to send partnership email: {e}")
        return False


@partnership_routes.route("/", methods=["POST"])
def partnerships():
    """
    Create a partnership request with processing
    """
    form = PartnershipForm()
    form["csrf_token"].data = request.cookies["csrf_token"]

    if form.validate_on_submit():
        email = form.data["email"]

        # Quick duplicate check
        existing_partnership = Partnership.query.filter_by(email=email).first()
        if existing_partnership:
            return jsonify({"error": "Email already exists"}), 400

        # Create partnership record first
        try:
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
                import threading

                email_thread = threading.Thread(
                    target=send_email_async, args=(email_data,)
                )
                email_thread.daemon = True
                email_thread.start()
            except Exception as e:
                logger.warning(f"Could not start email thread: {e}")

            # Return success immediately without waiting for email
            return jsonify(new_partnership.to_dict()), 201

        except Exception as e:
            db.session.rollback()
            logger.error(f"Database error creating partnership: {e}")
            return jsonify({"error": "Failed to create partnership request"}), 500

    return form.errors, 400


@partnership_routes.route("/", methods=["GET"])
@login_required  # Only authenticated users can view partnerships
def get_partnerships():
    """
    Get all partnership requests with pagination (admin only)
    """
    # Add admin check here if you have admin roles
    # For now, any authenticated user can view

    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 50)

    partnerships_query = Partnership.query.order_by(Partnership.created_at.desc())
    partnerships = partnerships_query.paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify(
        {
            "partnerships": [
                partnership.to_dict() for partnership in partnerships.items
            ],
            "pagination": {
                "page": page,
                "pages": partnerships.pages,
                "per_page": per_page,
                "total": partnerships.total,
                "has_next": partnerships.has_next,
                "has_prev": partnerships.has_prev,
            },
        }
    )


@partnership_routes.route("/<int:partnershipId>", methods=["GET"])
@login_required
def get_partnership(partnershipId):
    """
    Get a specific partnership request
    """
    partnership = Partnership.query.get(partnershipId)

    if not partnership:
        return jsonify({"error": "Partnership request not found"}), 404

    return jsonify(partnership.to_dict())


@partnership_routes.route("/<int:partnershipId>", methods=["DELETE"])
@login_required
def delete_partnership(partnershipId):
    """
    Delete a partnership request (admin only)
    """
    partnership = Partnership.query.get(partnershipId)

    if not partnership:
        return jsonify({"error": "Partnership request not found"}), 404

    try:
        db.session.delete(partnership)
        db.session.commit()
        return jsonify({"message": "Partnership request deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting partnership: {e}")
        return jsonify({"error": "Failed to delete partnership request"}), 500


@partnership_routes.route("/<int:partnershipId>/respond", methods=["POST"])
@login_required
def respond_to_partnership(partnershipId):
    """
    Respond to a partnership request via email
    """
    partnership = Partnership.query.get(partnershipId)

    if not partnership:
        return jsonify({"error": "Partnership request not found"}), 404

    data = request.get_json()
    response_message = data.get("message", "").strip()

    if not response_message:
        return jsonify({"error": "Response message is required"}), 400

    # Prepare response email data
    email_data = {
        "subject": f"Re: {partnership.subject}",
        "message": response_message,
        "original_request": f"Original message from {partnership.first_name} {partnership.last_name}: {partnership.message}",
    }

    # Send response email asynchronously
    try:
        import threading

        email_thread = threading.Thread(
            target=send_response_email_async, args=(partnership.email, email_data)
        )
        email_thread.daemon = True
        email_thread.start()

        return jsonify({"message": "Response sent successfully"}), 200

    except Exception as e:
        logger.error(f"Error sending response email: {e}")
        return jsonify({"error": "Failed to send response"}), 500


def send_response_email_async(recipient_email, email_data):
    """
    Send response email to partnership requester
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


@partnership_routes.route("/stats", methods=["GET"])
@login_required
def get_partnership_stats():
    """
    Get partnership statistics for dashboard
    """
    try:
        from sqlalchemy import func
        from datetime import datetime, timedelta

        # Total partnerships
        total_partnerships = Partnership.query.count()

        # Recent partnerships (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_partnerships = Partnership.query.filter(
            Partnership.created_at >= thirty_days_ago
        ).count()

        # Partnerships by month (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        monthly_stats = (
            db.session.query(
                func.date_trunc("month", Partnership.created_at).label("month"),
                func.count(Partnership.id).label("count"),
            )
            .filter(Partnership.created_at >= six_months_ago)
            .group_by(func.date_trunc("month", Partnership.created_at))
            .order_by("month")
            .all()
        )

        stats = {
            "total_partnerships": total_partnerships,
            "recent_partnerships": recent_partnerships,
            "monthly_breakdown": [
                {"month": stat.month.strftime("%Y-%m"), "count": stat.count}
                for stat in monthly_stats
            ],
        }

        return jsonify(stats)

    except Exception as e:
        logger.error(f"Error getting partnership stats: {e}")
        return jsonify({"error": "Failed to retrieve statistics"}), 500


# from flask import Blueprint, request, render_template, redirect, jsonify
# from flask_login import login_required, current_user
# from app.models import db, Partnership
# from app.forms import PartnershipForm
# import smtplib
# import os
# from email.mime.text import MIMEText
# from email.mime.multipart import MIMEMultipart

# partnership_routes = Blueprint("partnerships", __name__)


# @partnership_routes.route("/", methods=["POST"])
# def partnerships():
#     """
#     Create a partnership request to the creator of the project and submit to the database

#     renders an empty form on get requests, validates and submits form on post requests

#     The commented out code was to test if the post request works
#     """

#     form = PartnershipForm()
#     form["csrf_token"].data = request.cookies["csrf_token"]

#     if form.validate_on_submit():
#         data = request.form
#         email = data.get("email")

#         # Check if the email already exists in the database
#         existing_partnership = Partnership.query.filter_by(email=email).first()
#         if existing_partnership:
#             return jsonify({"error": "Email already exists"}), 400

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

#         new_partnership = Partnership(
#             first_name=form.data["firstName"],
#             last_name=form.data["lastName"],
#             phone=form.data["phone"],
#             email=form.data["email"],
#             subject=form.data["subject"],
#             message=form.data["message"],
#         )
#         db.session.add(new_partnership)
#         db.session.commit()
#         return jsonify(new_partnership.to_dict()), 201
#     return form.errors, 400
