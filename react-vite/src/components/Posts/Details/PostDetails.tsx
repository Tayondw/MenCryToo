import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useLoaderData, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	MessageCircle,
	Share2,
	ArrowLeft,
	Clock,
	Bookmark,
	Send,
} from "lucide-react";
import LikeButton from "../../Likes/PostsLikesButton";
import LikesModal from "../../Likes/PostsLikesModal";
import CommentThread from "../../Comments/CommentThread";
import PostMenu from "../PostMenu/PostMenu"; // Import the PostMenu component
import { useLikes, useLikesModal } from "../../../hooks/useLikes";
import { commentApi } from "../../../services/commentApi";
import {
	RootState,
	SessionUser,
	type PostDetails,
	type PostComment,
	type Comment,
} from "../../../types";

const PostDetails: React.FC = () => {
	const post = useLoaderData() as PostDetails;
	const sessionUser = useSelector(
		(state: RootState) => state.session.user,
	) as SessionUser | null;
	const navigate = useNavigate();

	// Likes management
	const { likeStates, setLikeState, fetchLikeStatus } = useLikes();
	const {
		isOpen: isLikesModalOpen,
		postId: likesModalPostId,
		openModal: openLikesModal,
		closeModal: closeLikesModal,
	} = useLikesModal();

	// Inline commenting state
	const [commentCount, setCommentCount] = useState(
		post.postComments?.length || 0,
	);
	const [newComment, setNewComment] = useState("");
	const [replyToComment, setReplyToComment] = useState<number | null>(null);
	const [replyText, setReplyText] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showAllReplies, setShowAllReplies] = useState<{
		[key: number]: boolean;
	}>({});

	// State for the actual comments data
	const [commentsData, setCommentsData] = useState<PostComment[]>(
		post.postComments || [],
	);

	// Initialize like state for this post
	useEffect(() => {
		if (!likeStates.has(post.id)) {
			setLikeState(post.id, false, post.likes);
			fetchLikeStatus(post.id);
		}
	}, [post.id, post.likes, likeStates, setLikeState, fetchLikeStatus]);

	// Get current like state
	const currentLikeState = useMemo(() => {
		return (
			likeStates.get(post.id) || {
				isLiked: false,
				likeCount: post.likes,
				isLoading: false,
			}
		);
	}, [likeStates, post.id, post.likes]);

	// Handle likes modal open
	const handleLikesClick = useCallback(() => {
		openLikesModal(post.id);
	}, [openLikesModal, post.id]);

	// Check if user is post creator
	const isCreator = sessionUser?.id === post.creator;

	// Comment organization function with stable user data handling
	const organizeComments = useCallback(
		(flatComments: PostComment[]): Comment[] => {
			const commentMap = new Map<number, Comment>();
			const rootComments: Comment[] = [];

			// First pass: create Comment objects with ACTUAL commenter data from API
			flatComments.forEach((pc) => {
				// Use the commenter data that comes from the API
				let commenterData: Comment["commenter"];

				// If the API response includes commenter data, use it directly
				if (pc.commenter) {
					commenterData = {
						id: pc.commenter.id,
						username: pc.commenter.username,
						firstName: pc.commenter.firstName || "",
						lastName: pc.commenter.lastName || "",
						profileImage: pc.commenter.profileImage || "/default-avatar.png",
					};
				}
				// If API commenter data is missing, try to match with known users
				else {
					// Check if this is the session user
					if (sessionUser && pc.userId === sessionUser.id) {
						commenterData = {
							id: sessionUser.id,
							username: sessionUser.username,
							firstName: sessionUser.firstName || "",
							lastName: sessionUser.lastName || "",
							profileImage: sessionUser.profileImage || "/default-avatar.png",
						};
					}
					// Check if this is the post creator
					else if (pc.userId === post.user.id) {
						commenterData = {
							id: post.user.id,
							username: post.user.username,
							firstName: post.user.firstName,
							lastName: post.user.lastName,
							profileImage: post.user.profileImage,
						};
					}
					// Fallback for unknown users
					else {
						commenterData = {
							id: pc.userId,
							username: pc.username || "Unknown User",
							firstName: "",
							lastName: "",
							profileImage: "/default-avatar.png",
						};
					}
				}

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
				};

				commentMap.set(pc.id, comment);
			});

			// Second pass: organize into tree structure
			flatComments.forEach((pc) => {
				const comment = commentMap.get(pc.id)!;
				if (pc.parentId === null) {
					rootComments.push(comment);
				} else {
					const parent = commentMap.get(pc.parentId);
					if (parent) {
						if (!parent.replies) {
							parent.replies = [];
						}
						parent.replies.push(comment);
					}
				}
			});

			// Sort by creation date (newest first for root, oldest first for replies)
			rootComments.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);

			// Sort replies chronologically
			rootComments.forEach((comment) => {
				if (comment.replies) {
					comment.replies.sort(
						(a, b) =>
							new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
					);
				}
			});

			return rootComments;
		},
		[
			post.user.id,
			sessionUser,
			post.user.firstName,
			post.user.lastName,
			post.user.profileImage,
			post.user.username,
		], // Only depend on IDs, not full objects
	);

	// Memoize the organized comments to prevent infinite re-renders
	const comments = useMemo(() => {
		if (commentsData && commentsData.length > 0) {
			return organizeComments(commentsData);
		}
		return [];
	}, [commentsData, organizeComments]);

	// Format date
	const formatDate = (dateString: string) => {
		const options: Intl.DateTimeFormatOptions = {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		};
		return new Date(dateString).toLocaleDateString(undefined, options);
	};

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
	const handleAddComment = async () => {
		if (!sessionUser || !newComment.trim()) return;

		setIsSubmitting(true);
		try {
			const response = await commentApi.createComment({
				comment: newComment.trim(),
				postId: post.id,
			});

			const newCommentObj: PostComment = {
				id: response.comment.id,
				userId: sessionUser.id,
				postId: post.id,
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
			};

			// Add to the existing comments data
			setCommentsData((prev) => [newCommentObj, ...prev]);
			setCommentCount((prev) => prev + 1);
			setNewComment("");
		} catch (error) {
			console.error("Error adding comment:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle adding reply
	const handleAddReply = async (parentId: number) => {
		if (!sessionUser || !replyText.trim()) return;

		setIsSubmitting(true);
		try {
			const parentComment = findCommentById(parentId);
			const replyToUsername = parentComment?.commenter?.username || "";

			const response = await commentApi.createReply({
				comment: replyText.trim(),
				postId: post.id,
				parentId,
				replyToUsername,
			});

			// Add to comments data structure
			const newReplyData: PostComment = {
				id: response.comment.id,
				userId: sessionUser.id,
				postId: post.id,
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
			};

			setCommentsData((prev) => [...prev, newReplyData]);
			setCommentCount((prev) => prev + 1);
			setReplyText("");
			setReplyToComment(null);
		} catch (error) {
			console.error("Error adding reply:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

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
			await commentApi.deleteComment(post.id, commentId);
			setCommentsData((prev) => {
				const newData = prev.filter(
					(comment) =>
						comment.id !== commentId && comment.parentId !== commentId,
				);
				setCommentCount(newData.length);
				return newData;
			});
		} catch (error) {
			console.error("Error deleting comment:", error);
			throw error;
		}
	};

	// Toggle show all replies for a comment
	const toggleShowAllReplies = useCallback((commentId: number) => {
		setShowAllReplies((prev) => ({
			...prev,
			[commentId]: !prev[commentId],
		}));
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100">
			{/* Header */}
			<div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<Link
							to="/similar-feed"
							className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
						>
							<ArrowLeft size={20} />
							Back to Posts
						</Link>
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-4 py-8">
				<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
					{/* Post Header */}
					<div className="p-6 border-b border-slate-100">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<Link to={`/users/${post.user.id}`} className="flex-shrink-0">
									<img
										src={post.user.profileImage}
										alt={post.user.username}
										className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 hover:border-orange-500 transition-colors"
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.src = "/default-avatar.png";
										}}
									/>
								</Link>
								<div>
									<Link
										to={`/users/${post.user.id}`}
										className="font-semibold text-slate-900 hover:text-orange-600 transition-colors"
									>
										{post.user.username}
									</Link>
									<div className="flex items-center text-sm text-slate-500">
										<Clock size={14} className="mr-1" />
										<span>{formatDate(post.createdAt)}</span>
									</div>
								</div>
							</div>

							{/* Show PostMenu only if user is the creator */}
							{isCreator && (
								<PostMenu
									navigate={navigate}
									post={{
										id: post.id,
										title: post.title,
										caption: post.caption,
										image: post.image,
										likes: post.likes,
										creator: post.creator,
										comments: commentCount,
										createdAt: post.createdAt,
										updatedAt: post.updatedAt,
										user: {
											id: post.user.id,
											username: post.user.username,
											firstName: post.user.firstName,
											lastName: post.user.lastName,
											email: "", // Default empty values for missing PostUser properties
											bio: "",
											profileImage: post.user.profileImage,
											usersTags: [],
											posts: [],
											group: [],
											events: [],
											userComments: [],
											createdAt: "",
											updatedAt: "",
										},
									}}
								/>
							)}
						</div>
					</div>

					{/* Post Image */}
					<img
						src={post.image}
						alt={post.title}
						className="w-full h-auto max-h-[600px] object-contain bg-slate-100"
					/>

					{/* Post Content */}
					<div className="p-6">
						<h1 className="text-2xl font-bold text-slate-900 mb-4">
							{post.title}
						</h1>
						<p className="text-slate-700 whitespace-pre-line mb-6">
							{post.caption}
						</p>

						{/* Post Actions */}
						<div className="flex items-center justify-between border-t border-b border-slate-200 py-4 my-4">
							<div className="flex items-center gap-6">
								<LikeButton
									postId={post.id}
									initialLikeCount={currentLikeState.likeCount}
									initialIsLiked={currentLikeState.isLiked}
									onLikeToggle={(postId, isLiked, newCount) => {
										setLikeState(postId, isLiked, newCount);
									}}
									onLikesClick={handleLikesClick}
									size={20}
									disabled={currentLikeState.isLoading}
								/>
								<div className="flex items-center gap-2 text-slate-500">
									<MessageCircle size={20} />
									<span className="font-medium">{commentCount}</span>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<button className="text-slate-500 hover:text-orange-500 transition-colors">
									<Bookmark size={20} />
								</button>
								<button className="text-slate-500 hover:text-green-500 transition-colors">
									<Share2 size={20} />
								</button>
							</div>
						</div>

						{/* Add Comment Section */}
						{sessionUser && (
							<div className="mb-6">
								<div className="flex gap-3">
									<Link
										to={`/users/${sessionUser.id}`}
										className="flex-shrink-0"
									>
										<img
											src={sessionUser.profileImage}
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

						{/* Comments Section */}
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<h2 className="text-xl font-semibold text-slate-900">
									Comments ({commentCount})
								</h2>
							</div>

							{/* Display Comments using CommentThread */}
							{comments.length > 0 ? (
								<div className="space-y-4">
									{comments.map((comment) => (
										<CommentThread
											key={comment.id}
											comment={comment}
											depth={0}
											maxDepth={5}
											sessionUser={sessionUser}
											postUser={post.user}
											allComments={comments}
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
										/>
									))}
								</div>
							) : (
								<div className="text-center py-8 bg-slate-50 rounded-lg">
									<MessageCircle
										size={32}
										className="mx-auto text-slate-300 mb-2"
									/>
									<p className="text-slate-600 mb-3">
										No comments yet. Be the first to comment!
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Likes Modal */}
			{isLikesModalOpen && likesModalPostId && (
				<LikesModal
					isOpen={isLikesModalOpen}
					onClose={closeLikesModal}
					postId={likesModalPostId}
					initialCount={currentLikeState.likeCount}
				/>
			)}
		</div>
	);
};

export default PostDetails;

// import React, { useState, useCallback, useMemo, useEffect } from "react";
// import { useLoaderData, Link, useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import {
// 	MessageCircle,
// 	Share2,
// 	ArrowLeft,
// 	Clock,
// 	Bookmark,
// 	MoreHorizontal,
// 	Edit,
// 	Trash2,
// 	Send,
// } from "lucide-react";
// import LikeButton from "../../Likes/PostsLikesButton";
// import LikesModal from "../../Likes/PostsLikesModal";
// import CommentThread from "../../Comments/CommentThread";
// import { useLikes, useLikesModal } from "../../../hooks/useLikes";
// import { commentApi } from "../../../services/commentApi";
// import {
// 	RootState,
// 	SessionUser,
// 	type PostDetails,
// 	type PostComment,
// 	type Comment,
// } from "../../../types";

// const PostDetails: React.FC = () => {
// 	const post = useLoaderData() as PostDetails;
// 	const sessionUser = useSelector(
// 		(state: RootState) => state.session.user,
// 	) as SessionUser | null;
// 	const navigate = useNavigate();

// 	// Likes management
// 	const { likeStates, setLikeState, fetchLikeStatus } = useLikes();
// 	const {
// 		isOpen: isLikesModalOpen,
// 		postId: likesModalPostId,
// 		openModal: openLikesModal,
// 		closeModal: closeLikesModal,
// 	} = useLikesModal();

// 	const [showOptions, setShowOptions] = useState(false);

// 	// Inline commenting state
// 	const [commentCount, setCommentCount] = useState(
// 		post.postComments?.length || 0,
// 	);
// 	const [newComment, setNewComment] = useState("");
// 	const [replyToComment, setReplyToComment] = useState<number | null>(null);
// 	const [replyText, setReplyText] = useState("");
// 	const [isSubmitting, setIsSubmitting] = useState(false);
// 	const [showAllReplies, setShowAllReplies] = useState<{
// 		[key: number]: boolean;
// 	}>({});

// 	// State for the actual comments data
// 	const [commentsData, setCommentsData] = useState<PostComment[]>(
// 		post.postComments || [],
// 	);

// 	// Initialize like state for this post
// 	useEffect(() => {
// 		if (!likeStates.has(post.id)) {
// 			setLikeState(post.id, false, post.likes);
// 			fetchLikeStatus(post.id);
// 		}
// 	}, [post.id, post.likes, likeStates, setLikeState, fetchLikeStatus]);

// 	// Get current like state
// 	const currentLikeState = useMemo(() => {
// 		return (
// 			likeStates.get(post.id) || {
// 				isLiked: false,
// 				likeCount: post.likes,
// 				isLoading: false,
// 			}
// 		);
// 	}, [likeStates, post.id, post.likes]);

// 	// Handle likes modal open
// 	const handleLikesClick = useCallback(() => {
// 		openLikesModal(post.id);
// 	}, [openLikesModal, post.id]);

// 	// Comment organization function with stable user data handling
// 	const organizeComments = useCallback(
// 		(flatComments: PostComment[]): Comment[] => {
// 			const commentMap = new Map<number, Comment>();
// 			const rootComments: Comment[] = [];

// 			// First pass: create Comment objects with ACTUAL commenter data from API
// 			flatComments.forEach((pc) => {
// 				// Use the commenter data that comes from the API
// 				let commenterData: Comment["commenter"];

// 				// If the API response includes commenter data, use it directly
// 				if (pc.commenter) {
// 					commenterData = {
// 						id: pc.commenter.id,
// 						username: pc.commenter.username,
// 						firstName: pc.commenter.firstName || "",
// 						lastName: pc.commenter.lastName || "",
// 						profileImage: pc.commenter.profileImage || "/default-avatar.png",
// 					};
// 				}
// 				// If API commenter data is missing, try to match with known users
// 				else {
// 					// Check if this is the session user
// 					if (sessionUser && pc.userId === sessionUser.id) {
// 						commenterData = {
// 							id: sessionUser.id,
// 							username: sessionUser.username,
// 							firstName: sessionUser.firstName || "",
// 							lastName: sessionUser.lastName || "",
// 							profileImage: sessionUser.profileImage || "/default-avatar.png",
// 						};
// 					}
// 					// Check if this is the post creator
// 					else if (pc.userId === post.user.id) {
// 						commenterData = {
// 							id: post.user.id,
// 							username: post.user.username,
// 							firstName: post.user.firstName,
// 							lastName: post.user.lastName,
// 							profileImage: post.user.profileImage,
// 						};
// 					}
// 					// Fallback for unknown users
// 					else {
// 						commenterData = {
// 							id: pc.userId,
// 							username: pc.username || "Unknown User",
// 							firstName: "",
// 							lastName: "",
// 							profileImage: "/default-avatar.png",
// 						};
// 					}
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
// 				if (pc.parentId === null) {
// 					rootComments.push(comment);
// 				} else {
// 					const parent = commentMap.get(pc.parentId);
// 					if (parent) {
// 						if (!parent.replies) {
// 							parent.replies = [];
// 						}
// 						parent.replies.push(comment);
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
// 				if (comment.replies) {
// 					comment.replies.sort(
// 						(a, b) =>
// 							new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
// 					);
// 				}
// 			});

// 			return rootComments;
// 		},
// 		[
// 			post.user.id,
// 			sessionUser,
// 			post.user.firstName,
// 			post.user.lastName,
// 			post.user.profileImage,
// 			post.user.username,
// 		], // Only depend on IDs, not full objects
// 	);

// 	// Memoize the organized comments to prevent infinite re-renders
// 	const comments = useMemo(() => {
// 		if (commentsData && commentsData.length > 0) {
// 			return organizeComments(commentsData);
// 		}
// 		return [];
// 	}, [commentsData, organizeComments]);

// 	// Format date
// 	const formatDate = (dateString: string) => {
// 		const options: Intl.DateTimeFormatOptions = {
// 			year: "numeric",
// 			month: "long",
// 			day: "numeric",
// 			hour: "2-digit",
// 			minute: "2-digit",
// 		};
// 		return new Date(dateString).toLocaleDateString(undefined, options);
// 	};

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
// 	const handleAddComment = async () => {
// 		if (!sessionUser || !newComment.trim()) return;

// 		setIsSubmitting(true);
// 		try {
// 			const response = await commentApi.createComment({
// 				comment: newComment.trim(),
// 				postId: post.id,
// 			});

// 			const newCommentObj: PostComment = {
// 				id: response.comment.id,
// 				userId: sessionUser.id,
// 				postId: post.id,
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

// 			// Add to the existing comments data
// 			setCommentsData((prev) => [newCommentObj, ...prev]);
// 			setCommentCount((prev) => prev + 1);
// 			setNewComment("");
// 		} catch (error) {
// 			console.error("Error adding comment:", error);
// 		} finally {
// 			setIsSubmitting(false);
// 		}
// 	};

// 	// Handle adding reply
// 	const handleAddReply = async (parentId: number) => {
// 		if (!sessionUser || !replyText.trim()) return;

// 		setIsSubmitting(true);
// 		try {
// 			const parentComment = findCommentById(parentId);
// 			const replyToUsername = parentComment?.commenter?.username || "";

// 			const response = await commentApi.createReply({
// 				comment: replyText.trim(),
// 				postId: post.id,
// 				parentId,
// 				replyToUsername,
// 			});

// 			// Add to comments data structure
// 			const newReplyData: PostComment = {
// 				id: response.comment.id,
// 				userId: sessionUser.id,
// 				postId: post.id,
// 				comment: replyText.trim(),
// 				username: sessionUser.username,
// 				parentId: parentId,
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

// 			setCommentsData((prev) => [...prev, newReplyData]);
// 			setCommentCount((prev) => prev + 1);
// 			setReplyText("");
// 			setReplyToComment(null);
// 		} catch (error) {
// 			console.error("Error adding reply:", error);
// 		} finally {
// 			setIsSubmitting(false);
// 		}
// 	};

// 	// Helper to find comment by ID
// 	const findCommentById = (id: number): Comment | null => {
// 		for (const comment of comments) {
// 			if (comment.id === id) return comment;
// 			if (comment.replies) {
// 				for (const reply of comment.replies) {
// 					if (reply.id === id) return reply;
// 				}
// 			}
// 		}
// 		return null;
// 	};

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
// 			await commentApi.deleteComment(post.id, commentId);
// 			setCommentsData((prev) => {
// 				const newData = prev.filter(
// 					(comment) =>
// 						comment.id !== commentId && comment.parentId !== commentId,
// 				);
// 				setCommentCount(newData.length);
// 				return newData;
// 			});
// 		} catch (error) {
// 			console.error("Error deleting comment:", error);
// 			throw error;
// 		}
// 	};

// 	// Check if user is post creator
// 	const isCreator = sessionUser?.id === post.creator;

// 	// Handle post edit
// 	const handleEdit = () => {
// 		navigate(`/posts/${post.id}/edit`);
// 		setShowOptions(false);
// 	};

// 	// Handle post delete
// 	const handleDelete = () => {
// 		if (
// 			window.confirm(
// 				"Are you sure you want to delete this post? This action cannot be undone.",
// 			)
// 		) {
// 			// Existing delete logic here
// 		}
// 		setShowOptions(false);
// 	};

// 	// Toggle show all replies for a comment
// 	const toggleShowAllReplies = useCallback((commentId: number) => {
// 		setShowAllReplies((prev) => ({
// 			...prev,
// 			[commentId]: !prev[commentId],
// 		}));
// 	}, []);

// 	return (
// 		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100">
// 			{/* Header */}
// 			<div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
// 				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// 					<div className="flex items-center justify-between h-16">
// 						<Link
// 							to="/similar-feed"
// 							className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
// 						>
// 							<ArrowLeft size={20} />
// 							Back to Posts
// 						</Link>

// 						{isCreator && (
// 							<div className="relative">
// 								<button
// 									onClick={() => setShowOptions(!showOptions)}
// 									className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
// 								>
// 									<MoreHorizontal size={20} />
// 								</button>

// 								{showOptions && (
// 									<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
// 										<button
// 											onClick={handleEdit}
// 											className="flex items-center gap-2 w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-100"
// 										>
// 											<Edit size={16} />
// 											Edit Post
// 										</button>
// 										<button
// 											onClick={handleDelete}
// 											className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
// 										>
// 											<Trash2 size={16} />
// 											Delete Post
// 										</button>
// 									</div>
// 								)}
// 							</div>
// 						)}
// 					</div>
// 				</div>
// 			</div>

// 			<div className="max-w-4xl mx-auto px-4 py-8">
// 				<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
// 					{/* Post Header */}
// 					<div className="p-6 border-b border-slate-100">
// 						<div className="flex items-center gap-4">
// 							<Link to={`/users/${post.user.id}`} className="flex-shrink-0">
// 								<img
// 									src={post.user.profileImage}
// 									alt={post.user.username}
// 									className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 hover:border-orange-500 transition-colors"
// 									onError={(e) => {
// 										const target = e.target as HTMLImageElement;
// 										target.src = "/default-avatar.png";
// 									}}
// 								/>
// 							</Link>
// 							<div>
// 								<Link
// 									to={`/users/${post.user.id}`}
// 									className="font-semibold text-slate-900 hover:text-orange-600 transition-colors"
// 								>
// 									{post.user.username}
// 								</Link>
// 								<div className="flex items-center text-sm text-slate-500">
// 									<Clock size={14} className="mr-1" />
// 									<span>{formatDate(post.createdAt)}</span>
// 								</div>
// 							</div>
// 						</div>
// 					</div>

// 					{/* Post Image */}
// 					<img
// 						src={post.image}
// 						alt={post.title}
// 						className="w-full h-auto max-h-[600px] object-contain bg-slate-100"
// 					/>

// 					{/* Post Content */}
// 					<div className="p-6">
// 						<h1 className="text-2xl font-bold text-slate-900 mb-4">
// 							{post.title}
// 						</h1>
// 						<p className="text-slate-700 whitespace-pre-line mb-6">
// 							{post.caption}
// 						</p>

// 						{/* Post Actions */}
// 						<div className="flex items-center justify-between border-t border-b border-slate-200 py-4 my-4">
// 							<div className="flex items-center gap-6">
// 								<LikeButton
// 									postId={post.id}
// 									initialLikeCount={currentLikeState.likeCount}
// 									initialIsLiked={currentLikeState.isLiked}
// 									onLikeToggle={(postId, isLiked, newCount) => {
// 										setLikeState(postId, isLiked, newCount);
// 									}}
// 									onLikesClick={handleLikesClick}
// 									size={20}
// 									disabled={currentLikeState.isLoading}
// 								/>
// 								<div className="flex items-center gap-2 text-slate-500">
// 									<MessageCircle size={20} />
// 									<span className="font-medium">{commentCount}</span>
// 								</div>
// 							</div>
// 							<div className="flex items-center gap-3">
// 								<button className="text-slate-500 hover:text-orange-500 transition-colors">
// 									<Bookmark size={20} />
// 								</button>
// 								<button className="text-slate-500 hover:text-green-500 transition-colors">
// 									<Share2 size={20} />
// 								</button>
// 							</div>
// 						</div>

// 						{/* Add Comment Section */}
// 						{sessionUser && (
// 							<div className="mb-6">
// 								<div className="flex gap-3">
// 									<Link
// 										to={`/users/${sessionUser.id}`}
// 										className="flex-shrink-0"
// 									>
// 										<img
// 											src={sessionUser.profileImage}
// 											alt={sessionUser.username}
// 											className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 hover:border-orange-500 transition-colors"
// 											onError={(e) => {
// 												const target = e.target as HTMLImageElement;
// 												target.src = "/default-avatar.png";
// 											}}
// 										/>
// 									</Link>
// 									<div className="flex-1">
// 										<div className="relative">
// 											<textarea
// 												value={newComment}
// 												onChange={(e) => setNewComment(e.target.value)}
// 												placeholder="Write a comment..."
// 												className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
// 												rows={3}
// 											/>
// 											<button
// 												onClick={handleAddComment}
// 												disabled={!newComment.trim() || isSubmitting}
// 												className="absolute bottom-3 right-3 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
// 											>
// 												{isSubmitting ? (
// 													<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
// 												) : (
// 													<Send size={16} />
// 												)}
// 											</button>
// 										</div>
// 									</div>
// 								</div>
// 							</div>
// 						)}

// 						{/* Comments Section */}
// 						<div className="space-y-6">
// 							<div className="flex items-center justify-between">
// 								<h2 className="text-xl font-semibold text-slate-900">
// 									Comments ({commentCount})
// 								</h2>
// 							</div>

// 							{/* Display Comments using CommentThread */}
// 							{comments.length > 0 ? (
// 								<div className="space-y-4">
// 									{comments.map((comment) => (
// 										<CommentThread
// 											key={comment.id}
// 											comment={comment}
// 											depth={0}
// 											maxDepth={5}
// 											sessionUser={sessionUser}
// 											postUser={post.user}
// 											allComments={comments}
// 											replyToComment={replyToComment}
// 											setReplyToComment={setReplyToComment}
// 											replyText={replyText}
// 											setReplyText={setReplyText}
// 											handleAddReply={handleAddReply}
// 											isSubmitting={isSubmitting}
// 											formatTimeAgo={formatTimeAgo}
// 											showAllReplies={showAllReplies}
// 											toggleShowAllReplies={toggleShowAllReplies}
// 											onEdit={handleEditComment}
// 											onDelete={handleDeleteComment}
// 										/>
// 									))}
// 								</div>
// 							) : (
// 								<div className="text-center py-8 bg-slate-50 rounded-lg">
// 									<MessageCircle
// 										size={32}
// 										className="mx-auto text-slate-300 mb-2"
// 									/>
// 									<p className="text-slate-600 mb-3">
// 										No comments yet. Be the first to comment!
// 									</p>
// 								</div>
// 							)}
// 						</div>
// 					</div>
// 				</div>
// 			</div>

// 			{/* Likes Modal */}
// 			{isLikesModalOpen && likesModalPostId && (
// 				<LikesModal
// 					isOpen={isLikesModalOpen}
// 					onClose={closeLikesModal}
// 					postId={likesModalPostId}
// 					initialCount={currentLikeState.likeCount}
// 				/>
// 			)}
// 		</div>
// 	);
// };

// export default PostDetails;
