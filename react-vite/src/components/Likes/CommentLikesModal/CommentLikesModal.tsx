import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { X, Heart, Users, Loader, MessageCircle } from "lucide-react";
import { CommentLikesModalProps, LikedUser } from "../../../types/likes";

const CommentLikesModal: React.FC<CommentLikesModalProps> = ({
	isOpen,
	onClose,
	commentId,
}) => {
	const [likes, setLikes] = useState<LikedUser[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [comment, setComment] = useState<string>("");

	// Fetch comment likes when modal opens
	const fetchCommentLikes = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/comments/${commentId}/likes`, {
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error("Failed to fetch comment likes");
			}

			const data = await response.json();
			setLikes(data.likes || []);
			setComment(data.comment || "");
		} catch (err) {
			console.error("Error fetching comment likes:", err);
			setError("Failed to load likes. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [commentId]);

	// Fetch comment details to show context
	const fetchCommentDetails = useCallback(async () => {
		try {
			const response = await fetch(`/api/comments/${commentId}`, {
				credentials: "include",
			});

			if (response.ok) {
				const data = await response.json();
				setComment(data.comment || "");
			}
		} catch (err) {
			console.warn("Could not fetch comment details:", err);
		}
	}, [commentId]);

	useEffect(() => {
		if (isOpen && commentId) {
			fetchCommentLikes();
			fetchCommentDetails();
		}
	}, [isOpen, commentId, fetchCommentLikes, fetchCommentDetails]);

	// Close modal when clicking outside
	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	// Handle escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscape);
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "unset";
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
			onClick={handleBackdropClick}
		>
			<div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[70vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-slate-200">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
							<Heart size={20} className="text-red-500" />
						</div>
						<div>
							<h2 className="text-lg font-semibold text-slate-900">
								Comment Likes
							</h2>
							<p className="text-sm text-slate-600">
								{loading
									? "Loading..."
									: `${likes.length} ${
											likes.length === 1 ? "person" : "people"
									  } liked this comment`}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				{/* Comment Preview */}
				{comment && (
					<div className="p-4 border-b border-slate-100 bg-slate-50">
						<div className="flex items-start gap-2">
							<MessageCircle
								size={16}
								className="text-slate-400 mt-0.5 flex-shrink-0"
							/>
							<p className="text-sm text-slate-700 line-clamp-2">
								{comment.length > 100 ? `${comment.slice(0, 100)}...` : comment}
							</p>
						</div>
					</div>
				)}

				{/* Content */}
				<div className="flex-1 overflow-y-auto">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader size={24} className="animate-spin text-red-500" />
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center py-12 px-6 text-center">
							<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
								<Heart size={24} className="text-red-500" />
							</div>
							<h3 className="text-lg font-semibold text-slate-900 mb-2">
								Oops! Something went wrong
							</h3>
							<p className="text-slate-600 mb-4">{error}</p>
							<button
								onClick={fetchCommentLikes}
								className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
							>
								Try Again
							</button>
						</div>
					) : likes.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 px-6 text-center">
							<div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
								<Users size={24} className="text-slate-400" />
							</div>
							<h3 className="text-lg font-semibold text-slate-900 mb-2">
								No likes yet
							</h3>
							<p className="text-slate-600">
								Be the first to show some love for this comment!
							</p>
						</div>
					) : (
						<div className="px-6 py-4">
							<div className="space-y-3">
								{likes.map((user) => (
									<Link
										key={user.id}
										to={`/users/${user.id}`}
										onClick={onClose}
										className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
									>
										<img
											src={user.profileImage}
											alt={user.username}
											className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 group-hover:border-red-500 transition-colors"
											onError={(e) => {
												const target = e.target as HTMLImageElement;
												target.src = "/default-avatar.png";
											}}
										/>
										<div className="flex-1 min-w-0">
											<div className="font-medium text-slate-900 group-hover:text-red-600 transition-colors truncate">
												{user.username}
											</div>
											<div className="text-sm text-slate-600 truncate">
												{user.firstName} {user.lastName}
											</div>
										</div>
										<div className="text-red-500 opacity-60 group-hover:opacity-100 transition-opacity">
											<Heart size={14} fill="currentColor" />
										</div>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				{likes.length > 0 && !loading && (
					<div className="p-4 border-t border-slate-200 bg-slate-50">
						<div className="text-center">
							<p className="text-sm text-slate-600">
								{likes.length === 1
									? "1 person likes this comment"
									: `${likes.length} people like this comment`}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default CommentLikesModal;
