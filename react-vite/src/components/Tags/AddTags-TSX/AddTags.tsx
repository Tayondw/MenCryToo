import React, { useState, useEffect } from "react";
import { Form, useNavigation, useActionData } from "react-router-dom";
import { X, Plus, Check } from "lucide-react";
import { User } from "../../../types";
import "./AddTags.css";

interface AddTagsProps {
	user: User;
	onClose: () => void;
}

const AddTags: React.FC<AddTagsProps> = ({ user, onClose }) => {
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [wasSubmitting, setWasSubmitting] = useState(false);
	const navigation = useNavigation();
	const actionData = useActionData() as { error?: string } | null;

	const availableTags = [
		"ANGER",
		"ANXIETY",
		"DEPRESSION",
		"SUBSTANCE ABUSE",
		"STRESS",
		"TRAUMA",
		"RELATIONSHIPS",
		"GRIEF",
		"COMING OUT",
		"SUICIDAL THOUGHTS",
	];

	// Get current user tags
	const currentUserTags = user.usersTags?.map((tag) => tag.name) || [];

	// Filter out tags the user already has
	const availableNewTags = availableTags.filter(
		(tag) => !currentUserTags.includes(tag),
	);

	const isSubmitting = navigation.state === "submitting";

	// Track when we start submitting
	useEffect(() => {
		if (isSubmitting) {
			setWasSubmitting(true);
		}
	}, [isSubmitting]);

	// Close modal when clicking the back button
	useEffect(() => {
		const handlePopState = () => onClose();
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [onClose]);

	// Close modal on successful submission
	useEffect(() => {
		// If we were submitting and now we're idle, and there's no error, close the modal
		if (wasSubmitting && navigation.state === "idle" && !actionData?.error) {
			// Small delay to allow any state updates to complete
			const timer = setTimeout(() => {
				onClose();
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [wasSubmitting, navigation.state, actionData, onClose]);

	const handleTagToggle = (tag: string) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
		);
	};

	const handleCancel = (event: React.MouseEvent) => {
		event.preventDefault();
		onClose();
	};

	return (
		<div className="add-tags-modal">
			<div className="modal-header">
				<h2 className="modal-title">
					<Plus size={24} />
					Add New Tags
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
				<div className="tags-intro">
					<p className="modal-message">
						Select additional tags that resonate with you. These help connect
						you with similar users.
					</p>
				</div>

				{/* Show error message if any */}
				{actionData?.error && (
					<div
						className="error-message"
						style={{
							background: "#fee2e2",
							border: "1px solid #fca5a5",
							color: "#dc2626",
							padding: "1rem",
							borderRadius: "8px",
							marginBottom: "1.5rem",
							textAlign: "center",
						}}
					>
						{actionData.error}
					</div>
				)}

				{availableNewTags.length > 0 ? (
					<>
						<div className="available-tags-section">
							<h3 className="section-title">Available Tags</h3>
							<div className="tags-grid">
								{availableNewTags.map((tag) => (
									<label key={tag} className="tag-checkbox">
										<input
											type="checkbox"
											checked={selectedTags.includes(tag)}
											onChange={() => handleTagToggle(tag)}
										/>
										<span className="checkmark">
											{selectedTags.includes(tag) && <Check size={12} />}
										</span>
										<span className="tag-label">{tag}</span>
									</label>
								))}
							</div>
						</div>

						{selectedTags.length > 0 && (
							<div className="selected-tags-preview">
								<h4 className="preview-title">
									Selected Tags ({selectedTags.length})
								</h4>
								<div className="selected-tags-list">
									{selectedTags.map((tag) => (
										<span key={tag} className="selected-tag">
											{tag}
											<button
												type="button"
												onClick={() => handleTagToggle(tag)}
												className="remove-tag-btn"
												aria-label={`Remove ${tag}`}
											>
												<X size={14} />
											</button>
										</span>
									))}
								</div>
							</div>
						)}
					</>
				) : (
					<div className="no-tags-available">
						<div className="success-icon">
							<Check size={48} color="#10b981" />
						</div>
						<h3 className="success-title">All Tags Added!</h3>
						<p className="success-message">
							You've already added all available tags to your profile. Great job
							building your interests!
						</p>
					</div>
				)}

				{currentUserTags.length > 0 && (
					<div className="current-tags-section">
						<h4 className="current-tags-title">Your Current Tags</h4>
						<div className="current-tags-list">
							{currentUserTags.map((tag) => (
								<span key={tag} className="current-tag">
									{tag}
								</span>
							))}
						</div>
					</div>
				)}
			</div>

			<div className="modal-actions">
				<button
					className="cancel-button"
					onClick={handleCancel}
					disabled={isSubmitting}
				>
					Cancel
				</button>

				{availableNewTags.length > 0 && (
					<Form method="post" action="/profile" style={{ display: "inline" }}>
						<input type="hidden" name="intent" value="add-tags" />
						<input type="hidden" name="userId" value={user.id.toString()} />

						{/* Add hidden inputs for each selected tag */}
						{selectedTags.map((tag) => (
							<input key={tag} type="hidden" name="userTags" value={tag} />
						))}

						<button
							type="submit"
							className="add-tags-confirm-button"
							disabled={selectedTags.length === 0 || isSubmitting}
						>
							{isSubmitting
								? "Adding..."
								: `Add ${selectedTags.length} Tag${
										selectedTags.length !== 1 ? "s" : ""
								  }`}
						</button>
					</Form>
				)}
			</div>
		</div>
	);
};

export default AddTags;
