import React, {
	useState,
	useEffect,
	useCallback,
	useRef,
	useMemo,
} from "react";
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
} from "lucide-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { searchComments } from "../../../utils/commentUtils";
import CommentThread from "../CommentThread";
import CommentLikesModal from "../../Likes/CommentLikesModal";
import { commentApi } from "../../../services/commentApi";
import type { Comment, CommentModalProps } from "../../../types/comments";
import type { RootState } from "../../../types";

interface SessionUser {
	id: number;
	username: string;
	firstName?: string;
	lastName?: string;
	profileImage: string;
}

interface PostComment {
	id: number;
	userId: number;
	postId: number;
	comment: string;
	username: string;
	parentId: number | null;
	created_at: string;
	updated_at: string;
	// Like data
	likes?: number;
	isLiked?: boolean;
	commenter?: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	};
}

const CommentModal: React.FC<CommentModalProps> = ({
	isOpen,
	onClose,
	postId,
	initialComments = [],
}) => {
	const sessionUser = useSelector(
		(state: RootState) => state.session.user,
	) as SessionUser | null;
	const modalRef = useRef<HTMLDivElement>(null);

	// State management
	const [commentsData, setCommentsData] = useState<PostComment[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular">(
		"newest",
	);
	const [hasInitialized, setHasInitialized] = useState(false);

	// Comment form states
	const [newComment, setNewComment] = useState("");
	const [replyToComment, setReplyToComment] = useState<number | null>(null);
	const [replyText, setReplyText] = useState("");
	const [showAllReplies, setShowAllReplies] = useState<{
		[key: number]: boolean;
	}>({});

	// Like modal state
	const [likesModal, setLikesModal] = useState<{
		isOpen: boolean;
		commentId: number | null;
	}>({
		isOpen: false,
		commentId: null,
	});
	const [commentLikeStates, setCommentLikeStates] = useState<
		Map<number, { isLiked: boolean; likeCount: number }>
	>(new Map());

	useEffect(() => {
		if (commentsData && commentsData.length > 0) {
			const likeStatesMap = new Map();

			// Initialize like states for all comments (including nested ones)
			const initializeLikeStates = (comments: PostComment[]) => {
				comments.forEach((comment) => {
					likeStatesMap.set(comment.id, {
						isLiked: comment.isLiked || false,
						likeCount: comment.likes || 0,
					});
				});
			};

			initializeLikeStates(commentsData);
			setCommentLikeStates(likeStatesMap);

			console.log("Initialized comment like states:", likeStatesMap);
		}
	}, [commentsData]);

	// Helper function to flatten nested Comment structure to flat PostComment array
	const flattenCommentStructure = useCallback(
		(comments: Comment[]): PostComment[] => {
			const flattened: PostComment[] = [];

			const processComment = (comment: Comment) => {
				// Add the main comment
				const postComment: PostComment = {
					id: comment.id,
					userId: comment.userId,
					postId: comment.postId,
					comment: comment.comment,
					username: comment.commenter?.username || "Unknown User",
					parentId: comment.parentId,
					created_at: comment.createdAt,
					updated_at: comment.updatedAt,
					commenter: comment.commenter,
					// NEW: Include like data
					likes: comment.likes || 0,
					isLiked: comment.isLiked || false,
				};
				flattened.push(postComment);

				// Process all replies recursively
				if (comment.replies && comment.replies.length > 0) {
					comment.replies.forEach(processComment);
				}
			};

			comments.forEach(processComment);
			console.log(
				"Flattened structure result:",
				flattened.length,
				"total items",
			);
			return flattened;
		},
		[],
	);

	const organizeComments = useCallback(
		(flatComments: PostComment[]): Comment[] => {
			console.log("Organizing comments - input:", flatComments);
			console.log("Current like states:", commentLikeStates);

			if (!flatComments || flatComments.length === 0) {
				return [];
			}

			const commentMap = new Map<number, Comment>();
			const rootComments: Comment[] = [];

			// First pass: create Comment objects with proper commenter data AND like data
			flatComments.forEach((pc) => {
				// Handle commenter data (existing logic)
				let commenterData: Comment["commenter"];

				if (pc.commenter) {
					commenterData = {
						id: pc.commenter.id,
						username: pc.commenter.username,
						firstName: pc.commenter.firstName || "",
						lastName: pc.commenter.lastName || "",
						profileImage: pc.commenter.profileImage || "/default-avatar.png",
					};
				} else if (sessionUser && pc.userId === sessionUser.id) {
					commenterData = {
						id: sessionUser.id,
						username: sessionUser.username,
						firstName: sessionUser.firstName || "",
						lastName: sessionUser.lastName || "",
						profileImage: sessionUser.profileImage || "/default-avatar.png",
					};
				} else {
					commenterData = {
						id: pc.userId,
						username: pc.username || "Unknown User",
						firstName: "",
						lastName: "",
						profileImage: "/default-avatar.png",
					};
				}

				// Get like state - prioritize our state map, fallback to comment data
				const likeState = commentLikeStates.get(pc.id);
				const likes = likeState?.likeCount ?? pc.likes ?? 0;
				const isLiked = likeState?.isLiked ?? pc.isLiked ?? false;

				console.log("Processing comment like data:", {
					commentId: pc.id,
					likeStateFromMap: likeState,
					commentLikes: pc.likes,
					commentIsLiked: pc.isLiked,
					finalLikes: likes,
					finalIsLiked: isLiked,
				});

				const comment: Comment = {
					id: pc.id,
					userId: pc.userId,
					postId: pc.postId,
					comment: pc.comment,
					parentId: pc.parentId,
					createdAt: pc.created_at,
					updatedAt: pc.updated_at,
					commenter: commenterData,
					replies: [],
					// Include like data with proper fallbacks
					likes: likes,
					isLiked: isLiked,
				};

				commentMap.set(pc.id, comment);
			});

			// Second pass: organize into tree structure (existing logic)
			flatComments.forEach((pc) => {
				const comment = commentMap.get(pc.id)!;

				if (pc.parentId === null || pc.parentId === undefined) {
					rootComments.push(comment);
				} else {
					const parent = commentMap.get(pc.parentId);
					if (parent) {
						parent.replies = parent.replies || [];
						parent.replies.push(comment);
					} else {
						rootComments.push(comment);
					}
				}
			});

			// Sort by creation date (existing logic)
			rootComments.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);

			rootComments.forEach((comment) => {
				if (comment.replies && comment.replies.length > 0) {
					comment.replies.sort(
						(a, b) =>
							new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
					);
				}
			});

			console.log("Organized result with like data:", rootComments);
			return rootComments;
		},
		[sessionUser, commentLikeStates], // Include commentLikeStates as dependency
	);

	// Memoize the organized comments
	const comments = useMemo(() => {
		console.log("Recomputing comments with current data:", {
			commentsDataLength: commentsData?.length || 0,
			commentLikeStatesSize: commentLikeStates.size,
		});

		if (commentsData && commentsData.length > 0) {
			const organized = organizeComments(commentsData);
			console.log("Memoized comments result:", organized);
			return organized;
		}
		return [];
	}, [commentsData, organizeComments, commentLikeStates.size]);

	// Process comments for display (search, sort)
	const processedComments = useMemo(() => {
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
					// Sort by likes first, then replies
					const aLikes = a.likes || 0;
					const bLikes = b.likes || 0;
					if (aLikes !== bLikes) return bLikes - aLikes;

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

		return processedComments;
	}, [comments, searchTerm, sortBy]);

	// Load comments from API
	const loadCommentsFromApi = useCallback(async () => {
		if (!postId) return;

		console.log("Loading comments from API for post:", postId);
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/posts/${postId}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const postData = await response.json();
			const apiComments = postData.postComments || [];

			console.log("API returned", apiComments.length, "comments");
			setCommentsData(apiComments);
			setHasInitialized(true);
		} catch (error) {
			console.error("Error loading comments from API:", error);
			setError(
				error instanceof Error ? error.message : "Failed to load comments",
			);
		} finally {
			setIsLoading(false);
		}
	}, [postId]);

	// Initialize comments when modal opens - IMMEDIATE LOAD
	useEffect(() => {
		if (!isOpen || !postId) {
			// Reset when closed
			setCommentsData([]);
			setError(null);
			setNewComment("");
			setReplyToComment(null);
			setReplyText("");
			setShowAllReplies({});
			setSearchTerm("");
			setHasInitialized(false);
			setLikesModal({ isOpen: false, commentId: null });
			return;
		}

		console.log("Modal opened - immediate initialization");
		console.log("Initial comments:", initialComments?.length || 0);

		// Reset form state
		setError(null);
		setNewComment("");
		setReplyToComment(null);
		setReplyText("");
		setShowAllReplies({});

		// Try to use initial comments first, but ALWAYS verify with API
		if (initialComments && initialComments.length > 0) {
			console.log("Processing initial comments immediately");

			// Check if initialComments are already in the threaded structure or flat
			const hasNestedReplies = initialComments.some(
				(comment) => comment.replies && comment.replies.length > 0,
			);

			if (hasNestedReplies) {
				console.log("Initial comments have nested structure, flattening...");
				const flattenedComments = flattenCommentStructure(initialComments);
				setCommentsData(flattenedComments);
				setHasInitialized(true);
			} else {
				console.log("Initial comments are flat, converting format...");
				const postCommentsData: PostComment[] = initialComments.map(
					(comment) => ({
						id: comment.id,
						userId: comment.userId,
						postId: comment.postId,
						comment: comment.comment,
						username: comment.commenter?.username || "Unknown User",
						parentId: comment.parentId,
						created_at: comment.createdAt,
						updated_at: comment.updatedAt,
						commenter: comment.commenter,
						// NEW: Include like data
						likes: comment.likes || 0,
						isLiked: comment.isLiked || false,
					}),
				);
				setCommentsData(postCommentsData);
				setHasInitialized(true);
			}

			// Also load from API in background to ensure we have the latest data
			// but don't show loading state since we already have data
			loadCommentsFromApi();
		} else {
			console.log("No initial comments, loading from API");
			loadCommentsFromApi();
		}
	}, [
		isOpen,
		postId,
		initialComments,
		loadCommentsFromApi,
		flattenCommentStructure,
	]);

	useEffect(() => {
		if (commentsData && commentsData.length > 0) {
			console.log("Initializing like states from comments data:", commentsData);

			const likeStatesMap = new Map();

			// Initialize like states for all comments (including nested ones)
			const initializeLikeStates = (comments: PostComment[]) => {
				comments.forEach((comment) => {
					const likes = comment.likes ?? 0;
					const isLiked = comment.isLiked ?? false;

					likeStatesMap.set(comment.id, {
						isLiked: isLiked,
						likeCount: likes,
					});

					console.log("Initialized like state for comment:", {
						commentId: comment.id,
						likes,
						isLiked,
					});
				});
			};

			initializeLikeStates(commentsData);
			setCommentLikeStates(likeStatesMap);

			console.log("Final initialized like states:", likeStatesMap);
		}
	}, [commentsData]);

	// Format time ago
	const formatTimeAgo = useCallback((dateString: string) => {
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
	}, []);

	// Handle adding new comment
	const handleAddComment = useCallback(async () => {
		if (!sessionUser || !newComment.trim()) return;

		setIsSubmitting(true);
		try {
			const response = await commentApi.createComment({
				comment: newComment.trim(),
				postId: postId,
			});

			const newCommentData: PostComment = {
				id: response.comment.id,
				userId: sessionUser.id,
				postId: postId,
				comment: newComment.trim(),
				username: sessionUser.username,
				parentId: null,
				created_at: response.comment.createdAt,
				updated_at: response.comment.updatedAt,
				commenter: {
					id: sessionUser.id,
					username: sessionUser.username,
					firstName: sessionUser.firstName || "",
					lastName: sessionUser.lastName || "",
					profileImage: sessionUser.profileImage || "/default-avatar.png",
				},
				// Initialize like data for new comment
				likes: 0,
				isLiked: false,
			};

			// Initialize like state for the new comment
			setCommentLikeStates((prev) => {
				const newMap = new Map(prev);
				newMap.set(newCommentData.id, { isLiked: false, likeCount: 0 });
				return newMap;
			});

			setCommentsData((prev) => [newCommentData, ...prev]);
			setNewComment("");
		} catch (error) {
			console.error("Error adding comment:", error);
			setError("Failed to add comment");
		} finally {
			setIsSubmitting(false);
		}
	}, [sessionUser, newComment, postId]);

	// Helper to find comment by ID
	const findCommentById = useCallback(
		(id: number): Comment | null => {
			for (const comment of comments) {
				if (comment.id === id) return comment;
				if (comment.replies) {
					for (const reply of comment.replies) {
						if (reply.id === id) return reply;
					}
				}
			}
			return null;
		},
		[comments],
	);

	// Handle adding reply
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

				const newReplyData: PostComment = {
					id: response.comment.id,
					userId: sessionUser.id,
					postId: postId,
					comment: replyText.trim(),
					username: sessionUser.username,
					parentId: parentId,
					created_at: response.comment.createdAt,
					updated_at: response.comment.updatedAt,
					commenter: {
						id: sessionUser.id,
						username: sessionUser.username,
						firstName: sessionUser.firstName || "",
						lastName: sessionUser.lastName || "",
						profileImage: sessionUser.profileImage || "/default-avatar.png",
					},
					// Initialize like data for new reply
					likes: 0,
					isLiked: false,
				};

				// Initialize like state for the new reply
				setCommentLikeStates((prev) => {
					const newMap = new Map(prev);
					newMap.set(newReplyData.id, { isLiked: false, likeCount: 0 });
					return newMap;
				});

				setCommentsData((prev) => [...prev, newReplyData]);
				setReplyText("");
				setReplyToComment(null);
			} catch (error) {
				console.error("Error adding reply:", error);
				setError("Failed to add reply");
			} finally {
				setIsSubmitting(false);
			}
		},
		[sessionUser, replyText, postId, findCommentById],
	);

	// Handle edit comment
	const handleEditComment = async (commentId: number, newText: string) => {
		try {
			await commentApi.updateComment(commentId, newText);
			setCommentsData((prev) =>
				prev.map((comment) =>
					comment.id === commentId ? { ...comment, comment: newText } : comment,
				),
			);
		} catch (error) {
			console.error("Error editing comment:", error);
			throw error;
		}
	};

	// Handle delete comment
	const handleDeleteComment = async (commentId: number) => {
		try {
			await commentApi.deleteComment(postId, commentId);
			setCommentsData((prev) =>
				prev.filter(
					(comment) =>
						comment.id !== commentId && comment.parentId !== commentId,
				),
			);
		} catch (error) {
			console.error("Error deleting comment:", error);
			throw error;
		}
	};

	// Handle like toggle
	const handleLikeToggle = useCallback(
		async (commentId: number, isLiked: boolean, newCount: number) => {
			console.log("CommentModal handleLikeToggle called:", {
				commentId,
				isLiked,
				newCount,
			});

			// Validate parameters
			if (isLiked === undefined || newCount === undefined) {
				console.error("CommentModal received undefined like data:", {
					commentId,
					isLiked,
					newCount,
				});
				return;
			}

			// Update local like state map first
			setCommentLikeStates((prev) => {
				const newMap = new Map(prev);
				newMap.set(commentId, { isLiked, likeCount: newCount });
				console.log("Updated comment like states map:", newMap);
				return newMap;
			});

			// Update the comment data to persist the like state
			setCommentsData((prev) => {
				const updated = prev.map((comment) =>
					comment.id === commentId
						? { ...comment, likes: newCount, isLiked: isLiked }
						: comment,
				);
				console.log("Updated comments data with like state:", updated);
				return updated;
			});
		},
		[],
	);

	useEffect(() => {
		console.log("Comment like states updated:", commentLikeStates);
	}, [commentLikeStates]);

	// Handle showing likes modal
	const handleShowLikes = useCallback((commentId: number) => {
		setLikesModal({ isOpen: true, commentId });
	}, []);

	// Handle closing likes modal
	const handleCloseLikesModal = useCallback(() => {
		setLikesModal({ isOpen: false, commentId: null });
	}, []);

	// Toggle show all replies for a comment
	const toggleShowAllReplies = useCallback((commentId: number) => {
		setShowAllReplies((prev) => ({
			...prev,
			[commentId]: !prev[commentId],
		}));
	}, []);

	// Handle manual refresh
	const handleRefresh = useCallback(() => {
		console.log("Manual refresh triggered");
		setHasInitialized(false);
		loadCommentsFromApi();
	}, [loadCommentsFromApi]);

	// Handle modal close
	const handleClose = useCallback(() => {
		setSearchTerm("");
		setError(null);
		setCommentsData([]);
		setNewComment("");
		setReplyToComment(null);
		setReplyText("");
		setShowAllReplies({});
		setHasInitialized(false);
		setLikesModal({ isOpen: false, commentId: null });
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

	useEffect(() => {
		if (isOpen && postId && hasInitialized) {
			// Clear like states when modal reopens to force fresh fetch
			setCommentLikeStates(new Map());
		}
	}, [isOpen, postId, hasInitialized]);

	if (!isOpen) return null;

	const totalComments = commentsData.length;
	const filteredComments = processedComments.length;
      const shouldShowLoading = isLoading && !hasInitialized;

	return (
		<>
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

						<div className="flex items-center gap-2">
							<SortDesc size={16} className="text-gray-500" />
							<select
								value={sortBy}
								onChange={(e) =>
									setSortBy(e.target.value as "newest" | "oldest" | "popular")
								}
								className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
							>
								<option value="newest">Newest first</option>
								<option value="oldest">Oldest first</option>
								<option value="popular">Most popular</option>
							</select>
						</div>
					</div>

					{/* Add Comment Section */}
					{sessionUser && (
						<div className="p-4 border-b border-gray-100">
							<div className="flex gap-3">
								<Link to={`/users/${sessionUser.id}`} className="flex-shrink-0">
									<img
										src={sessionUser.profileImage || "/default-avatar.png"}
										alt={sessionUser.username}
										className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 hover:border-orange-500 transition-colors"
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.src = "/default-avatar.png";
										}}
									/>
								</Link>
								<div className="flex-1">
									<div className="relative">
										<textarea
											value={newComment}
											onChange={(e) => setNewComment(e.target.value)}
											placeholder="Write a comment..."
											className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
											rows={3}
											disabled={isSubmitting}
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

						{shouldShowLoading ? (
							<div className="p-8 text-center">
								<div className="inline-flex items-center gap-2 text-gray-600">
									<Loader className="animate-spin" size={20} />
									Loading comments...
								</div>
							</div>
						) : processedComments.length === 0 ? (
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
								{processedComments.map((comment) => (
									<CommentThread
										key={comment.id}
										comment={comment}
										depth={0}
										maxDepth={5}
										sessionUser={sessionUser}
										postUser={undefined}
										allComments={processedComments}
										replyToComment={replyToComment}
										setReplyToComment={setReplyToComment}
										replyText={replyText}
										setReplyText={setReplyText}
										handleAddReply={handleAddReply}
										isSubmitting={isSubmitting}
										formatTimeAgo={formatTimeAgo}
										showAllReplies={showAllReplies}
										toggleShowAllReplies={toggleShowAllReplies}
										onEdit={handleEditComment}
										onDelete={handleDeleteComment}
										// Like handlers
										onLikeToggle={handleLikeToggle}
										onShowLikes={handleShowLikes}
									/>
								))}
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

			{/* NEW: Comment Likes Modal */}
			{likesModal.isOpen && likesModal.commentId && (
				<CommentLikesModal
					isOpen={likesModal.isOpen}
					onClose={handleCloseLikesModal}
					commentId={likesModal.commentId}
					initialCount={0}
				/>
			)}
		</>
	);
};

export default CommentModal;

// import React, {
// 	useState,
// 	useEffect,
// 	useCallback,
// 	useRef,
// 	useMemo,
// } from "react";
// import {
// 	X,
// 	MessageCircle,
// 	Search,
// 	SortDesc,
// 	RefreshCw,
// 	Users,
// 	AlertCircle,
// 	Loader,
// 	Send,
// } from "lucide-react";
// import { useSelector } from "react-redux";
// import { Link } from "react-router-dom";
// import { searchComments } from "../../../utils/commentUtils";
// import CommentThread from "../CommentThread";
// import { commentApi } from "../../../services/commentApi";
// import type { Comment, CommentModalProps } from "../../../types/comments";
// import type { RootState } from "../../../types";

// interface SessionUser {
// 	id: number;
// 	username: string;
// 	firstName?: string;
// 	lastName?: string;
// 	profileImage: string;
// }

// interface PostComment {
// 	id: number;
// 	userId: number;
// 	postId: number;
// 	comment: string;
// 	username: string;
// 	parentId: number | null;
// 	created_at: string;
// 	updated_at: string;
// 	commenter?: {
// 		id: number;
// 		username: string;
// 		firstName: string;
// 		lastName: string;
// 		profileImage: string;
// 	};
// }

// const CommentModal: React.FC<CommentModalProps> = ({
// 	isOpen,
// 	onClose,
// 	postId,
// 	initialComments = [],
// }) => {
// 	const sessionUser = useSelector(
// 		(state: RootState) => state.session.user,
// 	) as SessionUser | null;
// 	const modalRef = useRef<HTMLDivElement>(null);

// 	// State management
// 	const [commentsData, setCommentsData] = useState<PostComment[]>([]);
// 	const [isLoading, setIsLoading] = useState(false);
// 	const [isSubmitting, setIsSubmitting] = useState(false);
// 	const [error, setError] = useState<string | null>(null);
// 	const [searchTerm, setSearchTerm] = useState("");
// 	const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular">(
// 		"newest",
// 	);
// 	const [hasInitialized, setHasInitialized] = useState(false);

// 	// Comment form states
// 	const [newComment, setNewComment] = useState("");
// 	const [replyToComment, setReplyToComment] = useState<number | null>(null);
// 	const [replyText, setReplyText] = useState("");
// 	const [showAllReplies, setShowAllReplies] = useState<{
// 		[key: number]: boolean;
// 	}>({});

// 	// Helper function to flatten nested Comment structure to flat PostComment array
// 	const flattenCommentStructure = useCallback(
// 		(comments: Comment[]): PostComment[] => {
// 			const flattened: PostComment[] = [];

// 			const processComment = (comment: Comment) => {
// 				// Add the main comment
// 				const postComment: PostComment = {
// 					id: comment.id,
// 					userId: comment.userId,
// 					postId: comment.postId,
// 					comment: comment.comment,
// 					username: comment.commenter?.username || "Unknown User",
// 					parentId: comment.parentId,
// 					created_at: comment.createdAt,
// 					updated_at: comment.updatedAt,
// 					commenter: comment.commenter,
// 				};
// 				flattened.push(postComment);

// 				// Process all replies recursively
// 				if (comment.replies && comment.replies.length > 0) {
// 					comment.replies.forEach(processComment);
// 				}
// 			};

// 			comments.forEach(processComment);
// 			console.log(
// 				"Flattened structure result:",
// 				flattened.length,
// 				"total items",
// 			);
// 			return flattened;
// 		},
// 		[],
// 	);

// 	const organizeComments = useCallback(
// 		(flatComments: PostComment[]): Comment[] => {
// 			console.log("Organizing comments - input:", flatComments.length);

// 			if (!flatComments || flatComments.length === 0) {
// 				return [];
// 			}

// 			const commentMap = new Map<number, Comment>();
// 			const rootComments: Comment[] = [];

// 			// First pass: create Comment objects with proper commenter data
// 			flatComments.forEach((pc) => {
// 				// Handle commenter data with multiple fallback strategies
// 				let commenterData: Comment["commenter"];

// 				if (pc.commenter) {
// 					commenterData = {
// 						id: pc.commenter.id,
// 						username: pc.commenter.username,
// 						firstName: pc.commenter.firstName || "",
// 						lastName: pc.commenter.lastName || "",
// 						profileImage: pc.commenter.profileImage || "/default-avatar.png",
// 					};
// 				} else if (sessionUser && pc.userId === sessionUser.id) {
// 					commenterData = {
// 						id: sessionUser.id,
// 						username: sessionUser.username,
// 						firstName: sessionUser.firstName || "",
// 						lastName: sessionUser.lastName || "",
// 						profileImage: sessionUser.profileImage || "/default-avatar.png",
// 					};
// 				} else {
// 					commenterData = {
// 						id: pc.userId,
// 						username: pc.username || "Unknown User",
// 						firstName: "",
// 						lastName: "",
// 						profileImage: "/default-avatar.png",
// 					};
// 				}

// 				const comment: Comment = {
// 					id: pc.id,
// 					userId: pc.userId,
// 					postId: pc.postId,
// 					comment: pc.comment,
// 					parentId: pc.parentId,
// 					createdAt: pc.created_at,
// 					updatedAt: pc.updated_at,
// 					commenter: commenterData,
// 					replies: [],
// 				};

// 				commentMap.set(pc.id, comment);
// 			});

// 			// Second pass: organize into tree structure
// 			flatComments.forEach((pc) => {
// 				const comment = commentMap.get(pc.id)!;

// 				if (pc.parentId === null || pc.parentId === undefined) {
// 					rootComments.push(comment);
// 				} else {
// 					const parent = commentMap.get(pc.parentId);
// 					if (parent) {
// 						parent.replies = parent.replies || [];
// 						parent.replies.push(comment);
// 					} else {
// 						// Parent not found, add as root
// 						rootComments.push(comment);
// 					}
// 				}
// 			});

// 			// Sort by creation date (newest first for root, oldest first for replies)
// 			rootComments.sort(
// 				(a, b) =>
// 					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
// 			);

// 			// Sort replies chronologically
// 			rootComments.forEach((comment) => {
// 				if (comment.replies && comment.replies.length > 0) {
// 					comment.replies.sort(
// 						(a, b) =>
// 							new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
// 					);
// 				}
// 			});

// 			console.log("Organized result:", rootComments.length, "root comments");
// 			return rootComments;
// 		},
// 		[sessionUser],
// 	);

// 	// Memoize the organized comments
// 	const comments = useMemo(() => {
// 		if (commentsData && commentsData.length > 0) {
// 			return organizeComments(commentsData);
// 		}
// 		return [];
// 	}, [commentsData, organizeComments]);

// 	// Process comments for display (search, sort)
// 	const processedComments = useMemo(() => {
// 		let processedComments = [...comments];

// 		// Apply search filter
// 		if (searchTerm.trim()) {
// 			processedComments = searchComments(processedComments, searchTerm);
// 		}

// 		// Sort comments
// 		processedComments.sort((a, b) => {
// 			switch (sortBy) {
// 				case "oldest":
// 					return (
// 						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
// 					);
// 				case "popular": {
// 					const aReplies = a.replies?.length || 0;
// 					const bReplies = b.replies?.length || 0;
// 					if (aReplies !== bReplies) return bReplies - aReplies;
// 					return (
// 						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
// 					);
// 				}
// 				case "newest":
// 				default:
// 					return (
// 						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
// 					);
// 			}
// 		});

// 		return processedComments;
// 	}, [comments, searchTerm, sortBy]);

// 	// Load comments from API
// 	const loadCommentsFromApi = useCallback(async () => {
// 		if (!postId) return;

// 		console.log("Loading comments from API for post:", postId);
// 		setIsLoading(true);
// 		setError(null);

// 		try {
// 			const response = await fetch(`/api/posts/${postId}`, {
// 				method: "GET",
// 				headers: {
// 					"Content-Type": "application/json",
// 				},
// 				credentials: "include",
// 			});

// 			if (!response.ok) {
// 				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
// 			}

// 			const postData = await response.json();
// 			const apiComments = postData.postComments || [];

// 			console.log("API returned", apiComments.length, "comments");
// 			setCommentsData(apiComments);
// 			setHasInitialized(true);
// 		} catch (error) {
// 			console.error("Error loading comments from API:", error);
// 			setError(
// 				error instanceof Error ? error.message : "Failed to load comments",
// 			);
// 		} finally {
// 			setIsLoading(false);
// 		}
// 	}, [postId]);

// 	// Initialize comments when modal opens - IMMEDIATE LOAD
// 	useEffect(() => {
// 		if (!isOpen || !postId) {
// 			// Reset when closed
// 			setCommentsData([]);
// 			setError(null);
// 			setNewComment("");
// 			setReplyToComment(null);
// 			setReplyText("");
// 			setShowAllReplies({});
// 			setSearchTerm("");
// 			setHasInitialized(false);
// 			return;
// 		}

// 		console.log("Modal opened - immediate initialization");
// 		console.log("Initial comments:", initialComments?.length || 0);

// 		// Reset form state
// 		setError(null);
// 		setNewComment("");
// 		setReplyToComment(null);
// 		setReplyText("");
// 		setShowAllReplies({});

// 		// Try to use initial comments first, but ALWAYS verify with API
// 		if (initialComments && initialComments.length > 0) {
// 			console.log("Processing initial comments immediately");

// 			// Check if initialComments are already in the threaded structure or flat
// 			const hasNestedReplies = initialComments.some(
// 				(comment) => comment.replies && comment.replies.length > 0,
// 			);

// 			if (hasNestedReplies) {
// 				console.log("Initial comments have nested structure, flattening...");
// 				const flattenedComments = flattenCommentStructure(initialComments);
// 				setCommentsData(flattenedComments);
// 				setHasInitialized(true);
// 			} else {
// 				console.log("Initial comments are flat, converting format...");
// 				const postCommentsData: PostComment[] = initialComments.map(
// 					(comment) => ({
// 						id: comment.id,
// 						userId: comment.userId,
// 						postId: comment.postId,
// 						comment: comment.comment,
// 						username: comment.commenter?.username || "Unknown User",
// 						parentId: comment.parentId,
// 						created_at: comment.createdAt,
// 						updated_at: comment.updatedAt,
// 						commenter: comment.commenter,
// 					}),
// 				);
// 				setCommentsData(postCommentsData);
// 				setHasInitialized(true);
// 			}

// 			// Also load from API in background to ensure we have the latest data
// 			// but don't show loading state since we already have data
// 			loadCommentsFromApi();
// 		} else {
// 			console.log("No initial comments, loading from API");
// 			loadCommentsFromApi();
// 		}
// 	}, [
// 		isOpen,
// 		postId,
// 		initialComments,
// 		loadCommentsFromApi,
// 		flattenCommentStructure,
// 	]);

// 	// Format time ago
// 	const formatTimeAgo = useCallback((dateString: string) => {
// 		const now = new Date();
// 		const date = new Date(dateString);
// 		const diffInHours = Math.floor(
// 			(now.getTime() - date.getTime()) / (1000 * 60 * 60),
// 		);

// 		if (diffInHours < 1) return "just now";
// 		if (diffInHours < 24) return `${diffInHours}h ago`;

// 		const diffInDays = Math.floor(diffInHours / 24);
// 		if (diffInDays < 7) return `${diffInDays}d ago`;

// 		return date.toLocaleDateString();
// 	}, []);

// 	// Handle adding new comment
// 	const handleAddComment = useCallback(async () => {
// 		if (!sessionUser || !newComment.trim()) return;

// 		setIsSubmitting(true);
// 		try {
// 			const response = await commentApi.createComment({
// 				comment: newComment.trim(),
// 				postId: postId,
// 			});

// 			const newCommentData: PostComment = {
// 				id: response.comment.id,
// 				userId: sessionUser.id,
// 				postId: postId,
// 				comment: newComment.trim(),
// 				username: sessionUser.username,
// 				parentId: null,
// 				created_at: response.comment.createdAt,
// 				updated_at: response.comment.updatedAt,
// 				commenter: {
// 					id: sessionUser.id,
// 					username: sessionUser.username,
// 					firstName: sessionUser.firstName || "",
// 					lastName: sessionUser.lastName || "",
// 					profileImage: sessionUser.profileImage || "/default-avatar.png",
// 				},
// 			};

// 			setCommentsData((prev) => [newCommentData, ...prev]);
// 			setNewComment("");
// 		} catch (error) {
// 			console.error("Error adding comment:", error);
// 			setError("Failed to add comment");
// 		} finally {
// 			setIsSubmitting(false);
// 		}
// 	}, [sessionUser, newComment, postId]);

// 	// Helper to find comment by ID
// 	const findCommentById = useCallback(
// 		(id: number): Comment | null => {
// 			for (const comment of comments) {
// 				if (comment.id === id) return comment;
// 				if (comment.replies) {
// 					for (const reply of comment.replies) {
// 						if (reply.id === id) return reply;
// 					}
// 				}
// 			}
// 			return null;
// 		},
// 		[comments],
// 	);

// 	// Handle adding reply
// 	const handleAddReply = useCallback(
// 		async (parentId: number) => {
// 			if (!sessionUser || !replyText.trim()) return;

// 			setIsSubmitting(true);
// 			try {
// 				const parentComment = findCommentById(parentId);
// 				const replyToUsername = parentComment?.commenter?.username || "";

// 				const response = await commentApi.createReply({
// 					comment: replyText.trim(),
// 					postId: postId,
// 					parentId,
// 					replyToUsername,
// 				});

// 				const newReplyData: PostComment = {
// 					id: response.comment.id,
// 					userId: sessionUser.id,
// 					postId: postId,
// 					comment: replyText.trim(),
// 					username: sessionUser.username,
// 					parentId: parentId,
// 					created_at: response.comment.createdAt,
// 					updated_at: response.comment.updatedAt,
// 					commenter: {
// 						id: sessionUser.id,
// 						username: sessionUser.username,
// 						firstName: sessionUser.firstName || "",
// 						lastName: sessionUser.lastName || "",
// 						profileImage: sessionUser.profileImage || "/default-avatar.png",
// 					},
// 				};

// 				setCommentsData((prev) => [...prev, newReplyData]);
// 				setReplyText("");
// 				setReplyToComment(null);
// 			} catch (error) {
// 				console.error("Error adding reply:", error);
// 				setError("Failed to add reply");
// 			} finally {
// 				setIsSubmitting(false);
// 			}
// 		},
// 		[sessionUser, replyText, postId, findCommentById],
// 	);

// 	// Handle edit comment
// 	const handleEditComment = async (commentId: number, newText: string) => {
// 		try {
// 			await commentApi.updateComment(commentId, newText);
// 			setCommentsData((prev) =>
// 				prev.map((comment) =>
// 					comment.id === commentId ? { ...comment, comment: newText } : comment,
// 				),
// 			);
// 		} catch (error) {
// 			console.error("Error editing comment:", error);
// 			throw error;
// 		}
// 	};

// 	// Handle delete comment
// 	const handleDeleteComment = async (commentId: number) => {
// 		try {
// 			await commentApi.deleteComment(postId, commentId);
// 			setCommentsData((prev) =>
// 				prev.filter(
// 					(comment) =>
// 						comment.id !== commentId && comment.parentId !== commentId,
// 				),
// 			);
// 		} catch (error) {
// 			console.error("Error deleting comment:", error);
// 			throw error;
// 		}
// 	};

// 	// Toggle show all replies for a comment
// 	const toggleShowAllReplies = useCallback((commentId: number) => {
// 		setShowAllReplies((prev) => ({
// 			...prev,
// 			[commentId]: !prev[commentId],
// 		}));
// 	}, []);

// 	// Handle manual refresh
// 	const handleRefresh = useCallback(() => {
// 		console.log("Manual refresh triggered");
// 		setHasInitialized(false);
// 		loadCommentsFromApi();
// 	}, [loadCommentsFromApi]);

// 	// Handle modal close
// 	const handleClose = useCallback(() => {
// 		setSearchTerm("");
// 		setError(null);
// 		setCommentsData([]);
// 		setNewComment("");
// 		setReplyToComment(null);
// 		setReplyText("");
// 		setShowAllReplies({});
// 		setHasInitialized(false);
// 		onClose();
// 	}, [onClose]);

// 	// Handle click outside modal
// 	const handleOverlayClick = useCallback(
// 		(e: React.MouseEvent) => {
// 			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
// 				handleClose();
// 			}
// 		},
// 		[handleClose],
// 	);

// 	// Handle escape key
// 	useEffect(() => {
// 		const handleEscape = (e: KeyboardEvent) => {
// 			if (e.key === "Escape") handleClose();
// 		};

// 		if (isOpen) {
// 			document.addEventListener("keydown", handleEscape);
// 			document.body.style.overflow = "hidden";
// 		}

// 		return () => {
// 			document.removeEventListener("keydown", handleEscape);
// 			document.body.style.overflow = "unset";
// 		};
// 	}, [isOpen, handleClose]);

// 	if (!isOpen) return null;

// 	const totalComments = commentsData.length;
// 	const filteredComments = processedComments.length;
// 	const shouldShowLoading = isLoading && !hasInitialized;

// 	return (
// 		<div
// 			className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
// 			onClick={handleOverlayClick}
// 		>
// 			<div
// 				ref={modalRef}
// 				className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
// 			>
// 				{/* Header */}
// 				<div className="flex items-center justify-between p-6 border-b border-gray-200">
// 					<div className="flex items-center gap-3">
// 						<div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-slate-600 rounded-full flex items-center justify-center">
// 							<MessageCircle className="text-white" size={20} />
// 						</div>
// 						<div>
// 							<h2 className="text-xl font-bold text-gray-900">Comments</h2>
// 							<p className="text-sm text-gray-600">
// 								{totalComments} {totalComments === 1 ? "comment" : "comments"}
// 								{searchTerm && filteredComments !== totalComments && (
// 									<span> • {filteredComments} shown</span>
// 								)}
// 							</p>
// 						</div>
// 					</div>

// 					<div className="flex items-center gap-2">
// 						<button
// 							onClick={handleRefresh}
// 							disabled={isLoading}
// 							className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
// 							title="Refresh comments"
// 						>
// 							<RefreshCw
// 								size={18}
// 								className={isLoading ? "animate-spin" : ""}
// 							/>
// 						</button>

// 						<button
// 							onClick={handleClose}
// 							className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
// 						>
// 							<X size={18} />
// 						</button>
// 					</div>
// 				</div>

// 				{/* Search and filters */}
// 				<div className="p-4 border-b border-gray-100 space-y-3">
// 					<div className="relative">
// 						<Search
// 							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
// 							size={16}
// 						/>
// 						<input
// 							type="text"
// 							placeholder="Search comments..."
// 							value={searchTerm}
// 							onChange={(e) => setSearchTerm(e.target.value)}
// 							className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
// 						/>
// 					</div>

// 					<div className="flex items-center gap-2">
// 						<SortDesc size={16} className="text-gray-500" />
// 						<select
// 							value={sortBy}
// 							onChange={(e) =>
// 								setSortBy(e.target.value as "newest" | "oldest" | "popular")
// 							}
// 							className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
// 						>
// 							<option value="newest">Newest first</option>
// 							<option value="oldest">Oldest first</option>
// 							<option value="popular">Most replies</option>
// 						</select>
// 					</div>
// 				</div>

// 				{/* Add Comment Section */}
// 				{sessionUser && (
// 					<div className="p-4 border-b border-gray-100">
// 						<div className="flex gap-3">
// 							<Link to={`/users/${sessionUser.id}`} className="flex-shrink-0">
// 								<img
// 									src={sessionUser.profileImage || "/default-avatar.png"}
// 									alt={sessionUser.username}
// 									className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 hover:border-orange-500 transition-colors"
// 									onError={(e) => {
// 										const target = e.target as HTMLImageElement;
// 										target.src = "/default-avatar.png";
// 									}}
// 								/>
// 							</Link>
// 							<div className="flex-1">
// 								<div className="relative">
// 									<textarea
// 										value={newComment}
// 										onChange={(e) => setNewComment(e.target.value)}
// 										placeholder="Write a comment..."
// 										className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
// 										rows={3}
// 										disabled={isSubmitting}
// 									/>
// 									<button
// 										onClick={handleAddComment}
// 										disabled={!newComment.trim() || isSubmitting}
// 										className="absolute bottom-3 right-3 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
// 									>
// 										{isSubmitting ? (
// 											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
// 										) : (
// 											<Send size={16} />
// 										)}
// 									</button>
// 								</div>
// 							</div>
// 						</div>
// 					</div>
// 				)}

// 				{/* Comments list */}
// 				<div className="flex-1 overflow-y-auto">
// 					{error && (
// 						<div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
// 							<AlertCircle size={16} />
// 							<span>{error}</span>
// 							<button
// 								onClick={handleRefresh}
// 								className="ml-auto text-red-600 hover:text-red-800 font-medium"
// 							>
// 								Retry
// 							</button>
// 						</div>
// 					)}

// 					{shouldShowLoading ? (
// 						<div className="p-8 text-center">
// 							<div className="inline-flex items-center gap-2 text-gray-600">
// 								<Loader className="animate-spin" size={20} />
// 								Loading comments...
// 							</div>
// 						</div>
// 					) : processedComments.length === 0 ? (
// 						<div className="p-8 text-center">
// 							<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
// 								<MessageCircle className="text-gray-400" size={24} />
// 							</div>
// 							<h3 className="text-lg font-semibold text-gray-900 mb-2">
// 								{searchTerm ? "No comments found" : "No comments yet"}
// 							</h3>
// 							<p className="text-gray-600 mb-4">
// 								{searchTerm
// 									? "Try adjusting your search terms"
// 									: "Be the first to share your thoughts!"}
// 							</p>
// 							{searchTerm && (
// 								<button
// 									onClick={() => setSearchTerm("")}
// 									className="text-orange-600 hover:text-orange-700 font-medium"
// 								>
// 									Clear search
// 								</button>
// 							)}
// 						</div>
// 					) : (
// 						<div className="p-4 space-y-6">
// 							{processedComments.map((comment) => (
// 								<CommentThread
// 									key={comment.id}
// 									comment={comment}
// 									depth={0}
// 									maxDepth={5}
// 									sessionUser={sessionUser}
// 									postUser={undefined}
// 									allComments={processedComments}
// 									replyToComment={replyToComment}
// 									setReplyToComment={setReplyToComment}
// 									replyText={replyText}
// 									setReplyText={setReplyText}
// 									handleAddReply={handleAddReply}
// 									isSubmitting={isSubmitting}
// 									formatTimeAgo={formatTimeAgo}
// 									showAllReplies={showAllReplies}
// 									toggleShowAllReplies={toggleShowAllReplies}
// 									onEdit={handleEditComment}
// 									onDelete={handleDeleteComment}
// 								/>
// 							))}
// 						</div>
// 					)}
// 				</div>

// 				{/* Footer */}
// 				<div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
// 					<div className="flex items-center justify-between text-sm text-gray-600">
// 						<div className="flex items-center gap-4">
// 							<span className="flex items-center gap-1">
// 								<Users size={14} />
// 								{totalComments}{" "}
// 								{totalComments === 1 ? "participant" : "participants"}
// 							</span>
// 							{/* {hasInitialized && (
// 								<span className="text-green-600 text-xs">✓ Loaded</span>
// 							)} */}
// 						</div>

// 						{!sessionUser && (
// 							<div className="text-right">
// 								<span>
// 									<a
// 										href="/login"
// 										className="text-orange-600 hover:text-orange-700 font-medium"
// 									>
// 										Sign in
// 									</a>{" "}
// 									to join the conversation
// 								</span>
// 							</div>
// 						)}
// 					</div>
// 				</div>
// 			</div>
// 		</div>
// 	);
// };

// export default CommentModal;
