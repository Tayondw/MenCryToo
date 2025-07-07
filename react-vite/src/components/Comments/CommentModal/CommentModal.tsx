// src/components/Comments/CommentModal.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	X,
	MessageCircle,
	Search,
	SortDesc,
	RefreshCw,
	Users,
	AlertCircle,
	Loader,
} from "lucide-react";
import { useSelector } from "react-redux";
import CommentForm from "../CommentForm";
import CommentThread from "../CommentThread";
import { commentApi } from "../../../services/commentApi";
import {
	organizeCommentsIntoThreads,
	searchComments,
} from "../../../utils/commentUtils";
import type {
	Comment,
	CommentModalProps,
	CommentFormData,
} from "../../../types/comments";
import type { RootState } from "../../../types";

const CommentModal: React.FC<CommentModalProps> = ({
	isOpen,
	onClose,
	postId,
	initialComments = [],
}) => {
	const sessionUser = useSelector((state: RootState) => state.session.user);
	const modalRef = useRef<HTMLDivElement>(null);

	// State management
	const [comments, setComments] = useState<Comment[]>([]);
	const [threaded, setThreaded] = useState<Comment[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular">(
		"newest",
	);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	// Initialize comments
	useEffect(() => {
		if (isOpen && postId) {
			setComments(initialComments);
			loadComments(true);
		}
	}, [isOpen, postId]);

	// Organize comments into threads when comments change
	useEffect(() => {
		let processedComments = [...comments];

		// Apply search filter
		if (searchTerm.trim()) {
			processedComments = searchComments(processedComments, searchTerm);
		}

		// Sort comments
		processedComments.sort((a, b) => {
			switch (sortBy) {
				case "oldest":
					return (
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
					);
				case "popular": {
					// Sort by reply count, then by creation date
					const aReplies = a.replies?.length || 0;
					const bReplies = b.replies?.length || 0;
					if (aReplies !== bReplies) return bReplies - aReplies;
					return (
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					);
				}
				case "newest":
				default:
					return (
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					);
			}
		});

		const organized = organizeCommentsIntoThreads(processedComments);
		setThreaded(organized);
	}, [comments, searchTerm, sortBy]);

	// Load comments from API
	const loadComments = useCallback(
		async (reset = false) => {
			if (!postId) return;

			setIsLoading(true);
			setError(null);

			try {
				const currentPage = reset ? 1 : page;
				const response = await commentApi.getPostComments(
					postId,
					currentPage,
					20,
				);

				const newComments = response.comments || [];

				setComments((prev) =>
					reset ? newComments : [...prev, ...newComments],
				);
				setHasMore(response.pagination?.hasNext || false);
				setPage(reset ? 2 : currentPage + 1);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to load comments",
				);
			} finally {
				setIsLoading(false);
			}
		},
		[postId, page],
	);

	// Add new comment
	const handleAddComment = useCallback(
		async (formData: CommentFormData) => {
			if (!sessionUser) throw new Error("You must be logged in to comment");

			setIsSubmitting(true);

			const response = formData.parentId
				? await commentApi.createReply(formData)
				: await commentApi.createComment(formData);

			const newComment = {
				...response.comment,
				commenter: {
					id: sessionUser.id,
					username: sessionUser.username,
					firstName: sessionUser.firstName,
					lastName: sessionUser.lastName,
					profileImage: sessionUser.profileImage,
				},
			};

			// Add comment to state
			setComments((prev) => [newComment, ...prev]);
			setIsSubmitting(false);
		},
		[sessionUser],
	);

	// Handle reply
	const handleReply = useCallback(
		(_parentId: number, _replyToUsername: string) => {
			// This will be handled by the CommentThread component
			// The reply form is shown inline in the thread
		},
		[],
	);

	// Edit comment
	const handleEditComment = useCallback(
		async (commentId: number, newText: string) => {
			await commentApi.updateComment(commentId, newText);

			// Update comment in state
			setComments((prev) =>
				prev.map((comment) =>
					comment.id === commentId
						? {
								...comment,
								comment: newText,
								updatedAt: new Date().toISOString(),
						  }
						: comment,
				),
			);
		},
		[],
	);

	// Delete comment
	const handleDeleteComment = useCallback(
		async (commentId: number) => {
			await commentApi.deleteComment(postId, commentId);

			// Remove comment from state (including nested replies)
			const removeCommentRecursively = (comments: Comment[]): Comment[] => {
				return comments.filter((comment) => {
					if (comment.id === commentId) return false;
					if (comment.replies) {
						comment.replies = removeCommentRecursively(comment.replies);
					}
					return true;
				});
			};

			setComments((prev) => removeCommentRecursively(prev));
		},
		[postId],
	);

	// Handle modal close
	const handleClose = useCallback(() => {
		setSearchTerm("");
		setError(null);
		onClose();
	}, [onClose]);

	// Handle click outside modal
	const handleOverlayClick = useCallback(
		(e: React.MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
				handleClose();
			}
		},
		[handleClose],
	);

	// Handle escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleClose();
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscape);
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "unset";
		};
	}, [isOpen, handleClose]);

	if (!isOpen) return null;

	const totalComments = comments.length;
	const filteredComments = threaded.length;

	return (
		<div
			className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
			onClick={handleOverlayClick}
		>
			<div
				ref={modalRef}
				className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-slate-600 rounded-full flex items-center justify-center">
							<MessageCircle className="text-white" size={20} />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900">Comments</h2>
							<p className="text-sm text-gray-600">
								{totalComments} {totalComments === 1 ? "comment" : "comments"}
								{searchTerm && filteredComments !== totalComments && (
									<span> • {filteredComments} shown</span>
								)}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<button
							onClick={() => loadComments(true)}
							disabled={isLoading}
							className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
							title="Refresh comments"
						>
							<RefreshCw
								size={18}
								className={isLoading ? "animate-spin" : ""}
							/>
						</button>

						<button
							onClick={handleClose}
							className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
						>
							<X size={18} />
						</button>
					</div>
				</div>

				{/* Search and filters */}
				<div className="p-4 border-b border-gray-100 space-y-3">
					{/* Search */}
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
							size={16}
						/>
						<input
							type="text"
							placeholder="Search comments..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
						/>
					</div>

					{/* Sort */}
					<div className="flex items-center gap-2">
						<SortDesc size={16} className="text-gray-500" />
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value as any)}
							className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						>
							<option value="newest">Newest first</option>
							<option value="oldest">Oldest first</option>
							<option value="popular">Most replies</option>
						</select>
					</div>
				</div>

				{/* Comment form */}
				{sessionUser && (
					<div className="p-4 border-b border-gray-100">
						<div className="flex items-start gap-3">
							<img
								src={sessionUser.profileImage}
								alt={sessionUser.username}
								className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
							/>
							<div className="flex-1">
								<CommentForm
									postId={postId}
									onSubmit={handleAddComment}
									placeholder="Write a comment..."
									isSubmitting={isSubmitting}
								/>
							</div>
						</div>
					</div>
				)}

				{/* Comments list */}
				<div className="flex-1 overflow-y-auto">
					{error && (
						<div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
							<AlertCircle size={16} />
							<span>{error}</span>
							<button
								onClick={() => loadComments(true)}
								className="ml-auto text-red-600 hover:text-red-800 font-medium"
							>
								Retry
							</button>
						</div>
					)}

					{threaded.length === 0 && !isLoading ? (
						<div className="p-8 text-center">
							<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<MessageCircle className="text-gray-400" size={24} />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								{searchTerm ? "No comments found" : "No comments yet"}
							</h3>
							<p className="text-gray-600 mb-4">
								{searchTerm
									? "Try adjusting your search terms"
									: "Be the first to share your thoughts!"}
							</p>
							{searchTerm && (
								<button
									onClick={() => setSearchTerm("")}
									className="text-orange-600 hover:text-orange-700 font-medium"
								>
									Clear search
								</button>
							)}
						</div>
					) : (
						<div className="p-4 space-y-6">
							{threaded.map((comment) => (
								<CommentThread
									key={comment.id}
									comment={comment}
									depth={0}
									maxDepth={5}
									onReply={handleReply}
									onEdit={handleEditComment}
									onDelete={handleDeleteComment}
									currentUserId={sessionUser?.id}
								/>
							))}

							{/* Load more button */}
							{hasMore && !isLoading && (
								<div className="text-center pt-4">
									<button
										onClick={() => loadComments(false)}
										className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
									>
										Load more comments
									</button>
								</div>
							)}

							{/* Loading indicator */}
							{isLoading && (
								<div className="text-center py-4">
									<div className="inline-flex items-center gap-2 text-gray-600">
										<Loader className="animate-spin" size={16} />
										Loading comments...
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
					<div className="flex items-center justify-between text-sm text-gray-600">
						<div className="flex items-center gap-4">
							<span className="flex items-center gap-1">
								<Users size={14} />
								{totalComments}{" "}
								{totalComments === 1 ? "participant" : "participants"}
							</span>
						</div>

						{!sessionUser && (
							<div className="text-right">
								<span>
									<a
										href="/login"
										className="text-orange-600 hover:text-orange-700 font-medium"
									>
										Sign in
									</a>{" "}
									to join the conversation
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default CommentModal;
