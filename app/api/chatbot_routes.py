# In app/api/chatbot_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import db

chatbot_routes = Blueprint("chatbot", __name__)


@chatbot_routes.route("/conversation", methods=["POST"])
@login_required
def log_conversation():
    """Log chatbot conversations for insights (optional)"""
    data = request.get_json()
    # Log conversation data if needed for platform insights
    return jsonify({"status": "logged"})


@chatbot_routes.route("/resources", methods=["GET"])
def get_mental_health_resources():
    """Provide additional mental health resources"""
    resources = {
        "crisis_lines": {
            "988": "Suicide & Crisis Lifeline",
            "741741": "Crisis Text Line (Text HOME)",
            "1-800-662-4357": "SAMHSA National Helpline",
        },
        "local_resources": [
            # Add local mental health resources
        ],
    }
    return jsonify(resources)
