import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Post } from "../../../../types";

interface DeletePostProps {
	post: Post;
	navigate: (path: string) => void;
	onClose: () => void;
}

const DeletePost: React.FC<DeletePostProps> = ({ post, onClose }) => {
	const handleDelete = async (event: React.FormEvent) => {
		event.preventDefault();

		try {
			// Create FormData to match the original implementation
			const formData = new FormData();
			formData.append("intent", "delete-post");
			formData.append("postId", post.id.toString());

			const response = await fetch(`/api/posts/${post.id}/delete`, {
				method: "DELETE",
				body: formData,
			});

			if (response.ok) {
				onClose();
				window.location.href = "/profile"; // Navigate to profile as in original
			} else {
				throw new Error("Failed to delete post");
			}
		} catch (error) {
			console.error("Error deleting post:", error);
			// You could show an error message here
		}
	};

	const handleCancel = () => {
		onClose();
	};

	// Close modal when clicking the back button (from original)
	useEffect(() => {
		const handlePopState = () => onClose();
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [onClose]);

	return (
		<div className="delete-post-modal">
			<div className="modal-header">
				<h2 className="modal-title">Confirm Delete</h2>
				<button
					className="modal-close-btn"
					onClick={onClose}
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			</div>

			<div className="modal-body">
				<div className="warning-icon">⚠️</div>
				<p className="modal-message">
					Are you sure you want to delete{" "}
					<strong style={{ color: "red" }}>"{post.title}"</strong>?
				</p>
				<p className="modal-warning">
					This action cannot be undone and will permanently remove this post.
				</p>
			</div>

			<div className="modal-actions">
				<button className="cancel-button" onClick={handleCancel}>
					No
				</button>
				<form onSubmit={handleDelete} style={{ display: "inline" }}>
					<button type="submit" className="delete-confirm-button">
						Delete Post
					</button>
				</form>
			</div>
		</div>
	);
};

export default DeletePost;
