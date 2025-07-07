// Fixed CommentModal.tsx - Complete rewrite to match PostDetails styling

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
	Send,
	Reply,
} from "lucide-react";
import { useSelector } from "react-redux";
import { commentApi } from "../../../services/commentApi";
import {
	organizeCommentsIntoThreads,
	searchComments,
	formatCommentTime,
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
	const [hasLoadedFromApi, setHasLoadedFromApi] = useState(false);

	// Comment form states
	const [newComment, setNewComment] = useState("");
	const [replyToComment, setReplyToComment] = useState<number | null>(null);
	const [replyText, setReplyText] = useState("");

	// Initialize comments - FIXED to prevent duplicate loading
	useEffect(() => {
		if (isOpen && postId) {
			console.log("Modal opened for post:", postId);
			console.log("Initial comments:", initialComments);

			// Reset state when modal opens
			setHasLoadedFromApi(false);
			setPage(1);
			setError(null);
			setNewComment("");
			setReplyToComment(null);
			setReplyText("");

			// If we have initial comments, use them and don't load from API initially
			if (initialComments && initialComments.length > 0) {
				const transformedComments = initialComments.map(transformApiComment);
				console.log("Using initial comments:", transformedComments);
				setComments(transformedComments);
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
	}, [isOpen, postId]);

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

	// Load comments from API
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
	const handleAddComment = useCallback(async () => {
		if (!sessionUser || !newComment.trim()) return;

		setIsSubmitting(true);
		try {
			const response = await commentApi.createComment({
				comment: newComment.trim(),
				postId: postId,
			});

			const newCommentObj: Comment = {
				...response.comment,
				commenter: {
					id: sessionUser.id,
					username: sessionUser.username,
					firstName: sessionUser.firstName || "",
					lastName: sessionUser.lastName || "",
					profileImage: sessionUser.profileImage || "/default-avatar.png",
				},
				replies: [],
			};

			setComments((prev) => [newCommentObj, ...prev]);
			setNewComment("");
		} catch (error) {
			console.error("Error adding comment:", error);
			setError("Failed to add comment");
		} finally {
			setIsSubmitting(false);
		}
	}, [sessionUser, newComment, postId]);

	// Add reply
	const handleAddReply = useCallback(
		async (parentId: number) => {
			if (!sessionUser || !replyText.trim()) return;

			setIsSubmitting(true);
			try {
				const parentComment = findCommentById(parentId);
				const replyToUsername = parentComment?.commenter?.username || "";

				const response = await commentApi.createReply({
					comment: replyText.trim(),
					postId: postId,
					parentId,
					replyToUsername,
				});

				const newReply: Comment = {
					...response.comment,
					commenter: {
						id: sessionUser.id,
						username: sessionUser.username,
						firstName: sessionUser.firstName || "",
						lastName: sessionUser.lastName || "",
						profileImage: sessionUser.profileImage || "/default-avatar.png",
					},
					replies: [],
				};

				// Add reply to the correct parent comment
				setComments((prev) => {
					return prev.map((comment) => {
						if (comment.id === parentId) {
							return {
								...comment,
								replies: [...(comment.replies || []), newReply],
							};
						}
						// Check in replies too
						if (comment.replies) {
							const updatedReplies = comment.replies.map((reply) => {
								if (reply.id === parentId) {
									return {
										...reply,
										replies: [...(reply.replies || []), newReply],
									};
								}
								return reply;
							});
							return {
								...comment,
								replies: updatedReplies,
							};
						}
						return comment;
					});
				});

				setReplyText("");
				setReplyToComment(null);
			} catch (error) {
				console.error("Error adding reply:", error);
				setError("Failed to add reply");
			} finally {
				setIsSubmitting(false);
			}
		},
		[sessionUser, replyText, postId],
	);

	// Helper to find comment by ID
	const findCommentById = (id: number): Comment | null => {
		for (const comment of comments) {
			if (comment.id === id) return comment;
			if (comment.replies) {
				for (const reply of comment.replies) {
					if (reply.id === id) return reply;
				}
			}
		}
		return null;
	};

	// Format time ago
	const formatTimeAgo = (dateString: string) => {
		const now = new Date();
		const date = new Date(dateString);
		const diffInHours = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60 * 60),
		);

		if (diffInHours < 1) return "just now";
		if (diffInHours < 24) return `${diffInHours}h ago`;

		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7) return `${diffInDays}d ago`;

		return date.toLocaleDateString();
	};

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
		setNewComment("");
		setReplyToComment(null);
		setReplyText("");
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

				{/* Add Comment Section */}
				{sessionUser && (
					<div className="p-4 border-b border-gray-100">
						<div className="flex gap-3">
							<img
								src={sessionUser.profileImage}
								alt={sessionUser.username}
								className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
							/>
							<div className="flex-1">
								<div className="relative">
									<textarea
										value={newComment}
										onChange={(e) => setNewComment(e.target.value)}
										placeholder="Write a comment..."
										className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
										rows={3}
									/>
									<button
										onClick={handleAddComment}
										disabled={!newComment.trim() || isSubmitting}
										className="absolute bottom-3 right-3 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
									>
										{isSubmitting ? (
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
										) : (
											<Send size={16} />
										)}
									</button>
								</div>
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
									sessionUser={sessionUser}
									replyToComment={replyToComment}
									setReplyToComment={setReplyToComment}
									replyText={replyText}
									setReplyText={setReplyText}
									handleAddReply={handleAddReply}
									isSubmitting={isSubmitting}
									formatTimeAgo={formatTimeAgo}
								/>
							))}

							{/* Load more button */}
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

							{/* Initial load button */}
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

// Comment Thread Component - styled like PostDetails
interface CommentThreadProps {
	comment: Comment;
	sessionUser: any;
	replyToComment: number | null;
	setReplyToComment: (id: number | null) => void;
	replyText: string;
	setReplyText: (text: string) => void;
	handleAddReply: (parentId: number) => void;
	isSubmitting: boolean;
	formatTimeAgo: (date: string) => string;
	depth?: number;
}

const CommentThread: React.FC<CommentThreadProps> = ({
	comment,
	sessionUser,
	replyToComment,
	setReplyToComment,
	replyText,
	setReplyText,
	handleAddReply,
	isSubmitting,
	formatTimeAgo,
	depth = 0,
}) => {
	const [showAllReplies, setShowAllReplies] = useState(false);
	const maxVisibleReplies = 2;
	const hasMoreReplies =
		comment.replies && comment.replies.length > maxVisibleReplies;
	const visibleReplies = showAllReplies
		? comment.replies
		: comment.replies?.slice(0, maxVisibleReplies);

	return (
		<div className={`space-y-3 ${depth > 0 ? "ml-13" : ""}`}>
			{/* Main Comment */}
			<div className="flex gap-3">
				<img
					src={comment.commenter?.profileImage || "/default-avatar.png"}
					alt={comment.commenter?.username}
					className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
				/>
				<div className="flex-1">
					<div className="bg-slate-50 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-1">
							<span className="font-semibold text-slate-900 text-sm">
								{comment.commenter?.username}
							</span>
							<span className="text-xs text-slate-500">
								{formatTimeAgo(comment.createdAt)}
							</span>
						</div>
						<p className="text-slate-700 text-sm">{comment.comment}</p>
					</div>
					{sessionUser && (
						<button
							onClick={() => setReplyToComment(comment.id)}
							className="flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-orange-600 transition-colors"
						>
							<Reply size={12} />
							Reply
						</button>
					)}
				</div>
			</div>

			{/* Reply Form */}
			{replyToComment === comment.id && sessionUser && (
				<div className="ml-13 flex gap-3">
					<img
						src={sessionUser.profileImage}
						alt={sessionUser.username}
						className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
					/>
					<div className="flex-1">
						<div className="relative">
							<textarea
								value={replyText}
								onChange={(e) => setReplyText(e.target.value)}
								placeholder={`Reply to @${comment.commenter?.username}...`}
								className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
								rows={2}
							/>
							<div className="flex items-center justify-between mt-2">
								<button
									onClick={() => {
										setReplyToComment(null);
										setReplyText("");
									}}
									className="text-xs text-slate-500 hover:text-slate-700"
								>
									Cancel
								</button>
								<button
									onClick={() => handleAddReply(comment.id)}
									disabled={!replyText.trim() || isSubmitting}
									className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
								>
									{isSubmitting ? "Posting..." : "Reply"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Replies */}
			{visibleReplies && visibleReplies.length > 0 && (
				<div className="ml-13 space-y-3">
					{visibleReplies.map((reply) => (
						<CommentThread
							key={reply.id}
							comment={reply}
							sessionUser={sessionUser}
							replyToComment={replyToComment}
							setReplyToComment={setReplyToComment}
							replyText={replyText}
							setReplyText={setReplyText}
							handleAddReply={handleAddReply}
							isSubmitting={isSubmitting}
							formatTimeAgo={formatTimeAgo}
							depth={depth + 1}
						/>
					))}

					{/* Show more replies button */}
					{hasMoreReplies && !showAllReplies && (
						<button
							onClick={() => setShowAllReplies(true)}
							className="text-sm text-orange-600 hover:text-orange-700 font-medium ml-13"
						>
							View {comment.replies!.length - maxVisibleReplies} more replies
						</button>
					)}

					{/* Show less replies button */}
					{hasMoreReplies && showAllReplies && (
						<button
							onClick={() => setShowAllReplies(false)}
							className="text-sm text-slate-600 hover:text-slate-700 font-medium ml-13"
						>
							Show less
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default CommentModal;
