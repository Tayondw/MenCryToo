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
import { Link, useLocation, useNavigate } from "react-router-dom";
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

// Enhanced CommentModalProps with better callback handling
interface EnhancedCommentModalProps extends CommentModalProps {
	// Callback to notify parent of comment changes
	onCommentChange?: (changeType: "add" | "delete", newCount: number) => void;
	// Optional: Force page refresh on close
	forceRefreshOnClose?: boolean;
	// Optional: Custom close redirect
	redirectOnClose?: string;
}

const CommentModal: React.FC<EnhancedCommentModalProps> = ({
	isOpen,
	onClose,
	postId,
	initialComments = [],
	onCommentChange,
	forceRefreshOnClose = false,
	redirectOnClose,
}) => {
	const sessionUser = useSelector(
		(state: RootState) => state.session.user,
	) as SessionUser | null;
	const modalRef = useRef<HTMLDivElement>(null);
	const location = useLocation();
	const navigate = useNavigate();

	// Track initial comment count for comparison
	const initialCommentCountRef = useRef<number>(0);
	const finalCommentCountRef = useRef<number>(0);
	const hasChangedRef = useRef<boolean>(false);

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

	// Helper function to determine if we should refresh the page
	const shouldRefreshPage = useCallback(() => {
		// Always refresh if explicitly requested
		if (forceRefreshOnClose) return true;

		// Refresh if we're on certain pages and comments changed
		if (hasChangedRef.current) {
			const currentPath = location.pathname;

			// Pages that should refresh when comments change
			const refreshablePages = [
				"/posts-feed",
				"/similar-feed",
				"/profile",
				"/profile-feed",
			];

			// Check if current page should refresh
			const shouldRefresh =
				refreshablePages.some((page) => currentPath.startsWith(page)) ||
				currentPath.match(/^\/posts\/\d+$/); // Individual post pages

			return shouldRefresh;
		}

		return false;
	}, [forceRefreshOnClose, location.pathname]);

	// Helper function to notify parent of comment count changes
	const notifyParentOfChange = useCallback(
		(changeType: "add" | "delete", newCount: number) => {
			hasChangedRef.current = true;
			finalCommentCountRef.current = newCount;

			if (onCommentChange) {
				onCommentChange(changeType, newCount);
			}
		},
		[onCommentChange],
	);

	// Initialize comment count tracking
	useEffect(() => {
		if (isOpen && commentsData.length >= 0) {
			const currentCount = commentsData.length;
			if (initialCommentCountRef.current === 0) {
				initialCommentCountRef.current = currentCount;
			}
			finalCommentCountRef.current = currentCount;
		}
	}, [isOpen, commentsData.length]);

	// Enhanced close handler with refresh logic
	const handleClose = useCallback(() => {
		// Call parent's onCommentChange one final time if there were changes
		if (hasChangedRef.current && onCommentChange) {
			const finalCount = finalCommentCountRef.current;
			onCommentChange(
				finalCount > initialCommentCountRef.current ? "add" : "delete",
				finalCount,
			);
		}

		// Reset state
		setSearchTerm("");
		setError(null);
		setCommentsData([]);
		setNewComment("");
		setReplyToComment(null);
		setReplyText("");
		setShowAllReplies({});
		setHasInitialized(false);
		setLikesModal({ isOpen: false, commentId: null });

		// Call the original onClose
		onClose();

		// Handle page refresh or redirect after a short delay to allow state updates
		setTimeout(() => {
			if (redirectOnClose) {
				// Custom redirect
				navigate(redirectOnClose);
			} else if (shouldRefreshPage()) {
				// Force page refresh to update comment counts
				window.location.href = window.location.href;
			}
		}, 100);
	}, [onClose, onCommentChange, shouldRefreshPage, navigate, redirectOnClose]);

	useEffect(() => {
		if (commentsData && commentsData.length > 0) {
			const likeStatesMap = new Map();
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
		}
	}, [commentsData]);

	// Helper function to flatten nested Comment structure to flat PostComment array
	const flattenCommentStructure = useCallback(
		(comments: Comment[]): PostComment[] => {
			const flattened: PostComment[] = [];

			const processComment = (comment: Comment) => {
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
					likes: comment.likes || 0,
					isLiked: comment.isLiked || false,
				};
				flattened.push(postComment);

				if (comment.replies && comment.replies.length > 0) {
					comment.replies.forEach(processComment);
				}
			};

			comments.forEach(processComment);
			return flattened;
		},
		[],
	);

	const organizeComments = useCallback(
		(flatComments: PostComment[]): Comment[] => {
			if (!flatComments || flatComments.length === 0) {
				return [];
			}

			const commentMap = new Map<number, Comment>();
			const rootComments: Comment[] = [];

			// First pass: create Comment objects with proper commenter data AND like data
			flatComments.forEach((pc) => {
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

				const likeState = commentLikeStates.get(pc.id);
				const likes = likeState?.likeCount ?? pc.likes ?? 0;
				const isLiked = likeState?.isLiked ?? pc.isLiked ?? false;

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
					likes: likes,
					isLiked: isLiked,
				};

				commentMap.set(pc.id, comment);
			});

			// Second pass: organize into tree structure
			flatComments.forEach((pc) => {
				const comment = commentMap.get(pc.id)!;

				if (pc.parentId === null || pc.parentId === undefined) {
					rootComments.push(comment);
					comment.replies = [];
				} else {
					const parent = commentMap.get(pc.parentId);
					if (parent) {
						if (!parent.replies) {
							parent.replies = [];
						}
						parent.replies.push(comment);
					} else {
						rootComments.push(comment);
					}
				}
			});

			// Sort by creation date
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

			return rootComments;
		},
		[sessionUser, commentLikeStates],
	);

	// Memoize the organized comments
	const comments = useMemo(() => {
		if (commentsData && commentsData.length > 0) {
			const organized = organizeComments(commentsData);
			return organized;
		}
		return [];
	}, [commentsData, organizeComments]);

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

	// Initialize comments when modal opens
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

			// Reset tracking refs
			initialCommentCountRef.current = 0;
			finalCommentCountRef.current = 0;
			hasChangedRef.current = false;
			return;
		}

		// Reset form state
		setError(null);
		setNewComment("");
		setReplyToComment(null);
		setReplyText("");
		setShowAllReplies({});

		// Try to use initial comments first, but ALWAYS verify with API
		if (initialComments && initialComments.length > 0) {
			const hasNestedReplies = initialComments.some(
				(comment) => comment.replies && comment.replies.length > 0,
			);

			if (hasNestedReplies) {
				const flattenedComments = flattenCommentStructure(initialComments);
				setCommentsData(flattenedComments);
				setHasInitialized(true);
			} else {
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
						likes: comment.likes || 0,
						isLiked: comment.isLiked || false,
					}),
				);
				setCommentsData(postCommentsData);
				setHasInitialized(true);
			}

			loadCommentsFromApi();
		} else {
			loadCommentsFromApi();
		}
	}, [
		isOpen,
		postId,
		initialComments,
		loadCommentsFromApi,
		flattenCommentStructure,
	]);

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
				likes: 0,
				isLiked: false,
			};

			setCommentLikeStates((prev) => {
				const newMap = new Map(prev);
				newMap.set(newCommentData.id, { isLiked: false, likeCount: 0 });
				return newMap;
			});

			setCommentsData((prev) => {
				const newData = [newCommentData, ...prev];
				notifyParentOfChange("add", newData.length);
				return newData;
			});
			setNewComment("");
		} catch (error) {
			console.error("Error adding comment:", error);
			setError("Failed to add comment");
		} finally {
			setIsSubmitting(false);
		}
	}, [sessionUser, newComment, postId, notifyParentOfChange]);

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
					likes: 0,
					isLiked: false,
				};

				setCommentLikeStates((prev) => {
					const newMap = new Map(prev);
					newMap.set(newReplyData.id, { isLiked: false, likeCount: 0 });
					return newMap;
				});

				setCommentsData((prev) => {
					const newData = [...prev, newReplyData];
					notifyParentOfChange("add", newData.length);
					return newData;
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
		[sessionUser, replyText, postId, findCommentById, notifyParentOfChange],
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
			setCommentsData((prev) => {
				const newData = prev.filter(
					(comment) =>
						comment.id !== commentId && comment.parentId !== commentId,
				);
				notifyParentOfChange("delete", newData.length);
				return newData;
			});
		} catch (error) {
			console.error("Error deleting comment:", error);
			throw error;
		}
	};

	// Handle like toggle
	const handleLikeToggle = useCallback(
		async (commentId: number, isLiked: boolean, newCount: number) => {
			if (isLiked === undefined || newCount === undefined) {
				console.error("CommentModal received undefined like data:", {
					commentId,
					isLiked,
					newCount,
				});
				return;
			}

			setCommentLikeStates((prev) => {
				const newMap = new Map(prev);
				newMap.set(commentId, { isLiked, likeCount: newCount });
				return newMap;
			});

			setCommentsData((prev) => {
				const updated = prev.map((comment) =>
					comment.id === commentId
						? { ...comment, likes: newCount, isLiked: isLiked }
						: comment,
				);
				return updated;
			});
		},
		[],
	);

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
		setHasInitialized(false);
		loadCommentsFromApi();
	}, [loadCommentsFromApi]);

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

			{/* Comment Likes Modal */}
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
