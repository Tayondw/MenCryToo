import React, { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { DeletePostProps } from "../../../../types";

const DeletePost: React.FC<DeletePostProps> = ({ post, navigate, onClose }) => {
	const handleDelete = async (event: React.FormEvent) => {
		event.preventDefault();

		try {
			const formData = new FormData();
			formData.append("intent", "delete-post");
			formData.append("postId", post.id.toString());

			const response = await fetch(`/api/posts/${post.id}/delete`, {
				method: "DELETE",
				body: formData,
			});

			if (response.ok) {
				onClose();
				navigate("/profile");
			} else {
				throw new Error("Failed to delete post");
			}
		} catch (error) {
			console.error("Error deleting post:", error);
		}
	};

	const handleCancel = (event: React.MouseEvent) => {
		event.preventDefault();
		onClose();
	};

	// Close modal when clicking the back button
	useEffect(() => {
		const handlePopState = () => onClose();
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [onClose]);

	return (
		<div>
			{/* Header */}
			<div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
						<AlertTriangle size={20} className="text-red-600" />
					</div>
					<h2 className="text-xl font-bold text-slate-900">Confirm Delete</h2>
				</div>
				<button
					className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
					onClick={onClose}
					aria-label="Close modal"
				>
					<X size={20} className="text-slate-500" />
				</button>
			</div>

			{/* Body */}
			<div className="p-6 text-center">
				<div className="mb-4">
					<div className="text-4xl mb-4">⚠️</div>
					<h3 className="text-lg font-semibold text-slate-900 mb-3">
						Are you sure you want to delete this post?
					</h3>
					<div className="bg-slate-50 rounded-lg p-4 mb-4">
						<p className="font-medium text-slate-800 mb-2">Post Title:</p>
						<p className="text-slate-700 italic">"{post.title}"</p>
					</div>
					<p className="text-slate-600 text-sm leading-relaxed">
						This action cannot be undone and will permanently remove this post
						from your profile and the platform.
					</p>
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-200">
				<button
					className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 font-medium"
					onClick={handleCancel}
				>
					Cancel
				</button>
				<form onSubmit={handleDelete} className="flex-1">
					<button
						type="submit"
						className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
					>
						Delete Post
					</button>
				</form>
			</div>
		</div>
	);
};

export default DeletePost;
