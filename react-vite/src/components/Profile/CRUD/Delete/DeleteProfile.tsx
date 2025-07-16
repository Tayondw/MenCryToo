import React, { useEffect } from "react";
import { Form } from "react-router-dom";
import { X, AlertTriangle, Shield } from "lucide-react";
import { DeleteProfileProps } from "../../../../types";
import "./DeleteProfile.css";

const DeleteProfile: React.FC<DeleteProfileProps> = ({
	user,
	onClose,
	onConfirm,
}) => {
	// Close modal when clicking the back button
	useEffect(() => {
		const handlePopState = () => onClose();
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [onClose]);

	const handleCancel = (event: React.MouseEvent) => {
		event.preventDefault();
		onClose();
	};

	const handleSubmit = async () => {
		// Let the form submit naturally - the router action will handle the deletion and logout
		onConfirm();
	};

	return (
		<div className="delete-profile-modal">
			<div className="modal-header">
				<h2 className="modal-title">
					<Shield size={24} />
					Confirm Account Deletion
				</h2>
				<button
					className="modal-close-btn"
					onClick={onClose}
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			</div>

			<div className="modal-body">
				<div className="warning-icon">
					<AlertTriangle size={64} color="#dc2626" />
				</div>

				<h3 className="modal-message">
					Are you sure you want to permanently delete your account?
				</h3>

				<div className="modal-warning">
					<div className="modal-warning-title">
						<AlertTriangle size={16} />
						This action cannot be undone
					</div>
					<p>Deleting your account will permanently remove:</p>
					<ul>
						<li>Your profile and all personal information</li>
						<li>All posts, comments, and interactions</li>
						<li>Any groups you created (members will be notified)</li>
						<li>Events you organized (attendees will be notified)</li>
						<li>Your connections and network within the platform</li>
					</ul>

					<div className="modal-final-warning">
						<strong>Important:</strong> Please inform group members and event
						attendees before proceeding!
					</div>
				</div>
			</div>

			<div className="modal-actions">
				<button className="cancel-button" onClick={handleCancel}>
					Cancel
				</button>

				<Form
					method="post"
					onSubmit={handleSubmit}
					style={{ display: "inline" }}
				>
					<input type="hidden" name="intent" value="delete-profile" />
					<input type="hidden" name="userId" value={user.id.toString()} />
					<button type="submit" className="delete-confirm-button">
						Delete Account
					</button>
				</Form>
			</div>
		</div>
	);
};

export default DeleteProfile;
