// Fixed CommentModal.tsx - prevents duplicate loading

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
import CommentForm from "../CommentForm/CommentForm";
import CommentThread from "../CommentThread/CommentThread";
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

// Helper function to transform API comments to our expected format
const transformApiComment = (apiComment: any): Comment => {
	console.log("Transforming API comment:", apiComment);

	// If the API comment already has a commenter object, use it
	if (apiComment.commenter) {
		return apiComment as Comment;
	}

	// Otherwise, transform old/API format to new format
	return {
		id: apiComment.id,
		userId: apiComment.userId || apiComment.user_id,
		postId: apiComment.postId || apiComment.post_id,
		comment: apiComment.comment,
		parentId: apiComment.parentId || apiComment.parent_id || null,
		createdAt: apiComment.createdAt || apiComment.created_at,
		updatedAt: apiComment.updatedAt || apiComment.updated_at,
		commenter: {
			id: apiComment.userId || apiComment.user_id,
			username: apiComment.username || "unknown",
			firstName: apiComment.firstName || apiComment.first_name || "",
			lastName: apiComment.lastName || apiComment.last_name || "",
			profileImage:
				apiComment.profileImage ||
				apiComment.profile_image_url ||
				"/default-avatar.png",
		},
		replies: [],
	};
};

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
	const [hasLoadedFromApi, setHasLoadedFromApi] = useState(false); // Track if we've loaded from API

	// Initialize comments - FIXED to prevent duplicate loading
	useEffect(() => {
		if (isOpen && postId) {
			console.log("Modal opened for post:", postId);
			console.log("Initial comments:", initialComments);

			// Reset state when modal opens
			setHasLoadedFromApi(false);
			setPage(1);
			setError(null);

			// If we have initial comments, use them and don't load from API initially
			if (initialComments && initialComments.length > 0) {
				const transformedComments = initialComments.map(transformApiComment);
				console.log("Using initial comments:", transformedComments);
				setComments(transformedComments);
				// Don't auto-load from API if we have initial comments
			} else {
				// Only load from API if no initial comments
				console.log("No initial comments, loading from API");
				setComments([]);
				loadComments(true);
			}
		} else {
			// Reset when modal closes
			setComments([]);
			setThreaded([]);
			setHasLoadedFromApi(false);
		}
	}, [isOpen, postId]); // Removed initialComments from dependency array to prevent re-runs

	// Organize comments into threads when comments change
	useEffect(() => {
		console.log("Processing comments:", comments);

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
		console.log("Organized comments:", organized);
		setThreaded(organized);
	}, [comments, searchTerm, sortBy]);

	// Load comments from API - FIXED to prevent duplicates
	const loadComments = useCallback(
		async (reset = false) => {
			if (!postId) return;

			// Don't load if we already have initial comments and this is the first API call
			if (!hasLoadedFromApi && initialComments.length > 0 && !reset) {
				console.log("Skipping API load - already have initial comments");
				return;
			}

			console.log("Loading comments from API for post:", postId);
			setIsLoading(true);
			setError(null);

			try {
				const currentPage = reset ? 1 : page;
				const response = await commentApi.getPostComments(
					postId,
					currentPage,
					20,
				);

				console.log("API response:", response);

				// Transform API comments to our expected format
				const apiComments = response.comments || [];
				const transformedComments = apiComments.map(transformApiComment);

				console.log("Transformed API comments:", transformedComments);

				if (reset) {
					// Replace all comments with fresh API data
					setComments(transformedComments);
				} else {
					// Add to existing comments (pagination)
					setComments((prev) => [...prev, ...transformedComments]);
				}

				setHasLoadedFromApi(true);
				setHasMore(response.pagination?.hasNext || false);
				setPage(reset ? 2 : currentPage + 1);
			} catch (err) {
				console.error("Error loading comments:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load comments",
				);
			} finally {
				setIsLoading(false);
			}
		},
		[postId, page, hasLoadedFromApi, initialComments.length],
	);

	// Add new comment
	const handleAddComment = useCallback(
		async (formData: CommentFormData) => {
			if (!sessionUser) throw new Error("You must be logged in to comment");

			console.log("Adding comment:", formData);
			setIsSubmitting(true);

			try {
				const response = formData.parentId
					? await commentApi.createReply(formData)
					: await commentApi.createComment(formData);

				console.log("Comment created:", response);

				const newComment: Comment = {
					...response.comment,
					commenter: {
						id: sessionUser.id,
						username: sessionUser.username,
						firstName: sessionUser.firstName || "",
						lastName: sessionUser.lastName || "",
						profileImage: sessionUser.profileImage || "/default-avatar.png",
					},
				};

				// Add comment to state
				setComments((prev) => [newComment, ...prev]);
			} catch (error) {
				console.error("Error adding comment:", error);
				throw error;
			} finally {
				setIsSubmitting(false);
			}
		},
		[sessionUser],
	);

	// Handle reply
	const handleReply = useCallback(
		(parentId: number, replyToUsername: string) => {
			console.log("Reply triggered for:", parentId, replyToUsername);
			// This will be handled by the CommentThread component
			// The reply form is shown inline in the thread
		},
		[],
	);

	// Edit comment
	const handleEditComment = useCallback(
		async (commentId: number, newText: string) => {
			console.log("Editing comment:", commentId, newText);

			try {
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
			} catch (error) {
				console.error("Error editing comment:", error);
				throw error;
			}
		},
		[],
	);

	// Delete comment
	const handleDeleteComment = useCallback(
		async (commentId: number) => {
			console.log("Deleting comment:", commentId);

			try {
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
			} catch (error) {
				console.error("Error deleting comment:", error);
				throw error;
			}
		},
		[postId],
	);

	// Handle manual refresh button - always loads from API
	const handleRefresh = useCallback(() => {
		console.log("Manual refresh triggered");
		setHasLoadedFromApi(false); // Reset the flag
		loadComments(true); // Force reload from API
	}, [loadComments]);

	// Handle modal close
	const handleClose = useCallback(() => {
		setSearchTerm("");
		setError(null);
		setComments([]);
		setThreaded([]);
		setHasLoadedFromApi(false);
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

	console.log("Rendering modal with:", {
		totalComments,
		filteredComments,
		threaded,
		isLoading,
		error,
		hasLoadedFromApi,
		initialCommentsCount: initialComments.length,
	});

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
								{initialComments.length > 0 && !hasLoadedFromApi && (
									<span className="text-orange-600"> • from post data</span>
								)}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<button
							onClick={handleRefresh}
							disabled={isLoading}
							className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
							title="Refresh comments from server"
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

				{/* Comment form - Only show ONE form */}
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
								onClick={handleRefresh}
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

							{/* Load more button - only show if we've loaded from API and there's more */}
							{hasMore && hasLoadedFromApi && !isLoading && (
								<div className="text-center pt-4">
									<button
										onClick={() => loadComments(false)}
										className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
									>
										Load more comments
									</button>
								</div>
							)}

							{/* Initial load button - show if we have initial comments but haven't loaded from API */}
							{!hasLoadedFromApi &&
								initialComments.length > 0 &&
								!isLoading && (
									<div className="text-center pt-4">
										<button
											onClick={() => loadComments(true)}
											className="px-6 py-3 bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium rounded-lg transition-colors"
										>
											Load latest comments from server
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
