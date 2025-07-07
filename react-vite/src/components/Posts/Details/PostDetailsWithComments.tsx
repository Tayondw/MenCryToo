import React, { useState } from "react";
import { useLoaderData, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	Heart,
	MessageCircle,
	Share2,
	ArrowLeft,
	Clock,
	Bookmark,
	MoreHorizontal,
	Edit,
	Trash2,
	Reply,
	Send,
} from "lucide-react";
import CommentModal from "../../Comments/CommentModal";
import { useComments } from "../../../hooks/useComments";
import { commentApi } from "../../../services/commentApi";
import { RootState } from "../../../types";
import type { Comment } from "../../../types/comments";

// Your existing PostDetails interface
interface PostComment {
	id: number;
	userId: number;
	postId: number;
	comment: string;
	username: string;
	parentId: number | null;
	created_at: string;
	updated_at: string;
}

interface PostUser {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	profileImage: string;
}

interface PostDetails {
	id: number;
	title: string;
	caption: string;
	creator: number;
	image: string;
	likes: number;
	user: PostUser;
	postComments: PostComment[];
	createdAt: string;
	updatedAt: string;
}

const PostDetailsWithComments: React.FC = () => {
	const post = useLoaderData() as PostDetails;
	const sessionUser = useSelector((state: RootState) => state.session.user);
	const navigate = useNavigate();

	// Comment modal management
	const {
		modal: commentModal,
		openModal: openCommentModal,
		closeModal: closeCommentModal,
	} = useComments();

	const [showOptions, setShowOptions] = useState(false);
	const [isLiked, setIsLiked] = useState(false);
	const [likeCount, setLikeCount] = useState(post.likes);

	// Inline commenting state
	const [comments, setComments] = useState<Comment[]>([]);
	const [newComment, setNewComment] = useState("");
	const [replyToComment, setReplyToComment] = useState<number | null>(null);
	const [replyText, setReplyText] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showAllReplies, setShowAllReplies] = useState<{
		[key: number]: boolean;
	}>({});

	// Transform post comments to Comment format on component mount
	React.useEffect(() => {
		if (post.postComments) {
			const transformedComments = organizeComments(post.postComments);
			setComments(transformedComments);
		}
	}, [post.postComments]);

	// Helper function to organize flat comments into threaded structure
	const organizeComments = (flatComments: PostComment[]): Comment[] => {
		const commentMap = new Map<number, Comment>();
		const rootComments: Comment[] = [];

		// First pass: create Comment objects
		flatComments.forEach((pc) => {
			const comment: Comment = {
				id: pc.id,
				userId: pc.userId,
				postId: pc.postId,
				comment: pc.comment,
				parentId: pc.parentId,
				createdAt: pc.created_at,
				updatedAt: pc.updated_at,
				commenter: {
					id: pc.userId,
					username: pc.username,
					firstName: "",
					lastName: "",
					profileImage: "/default-avatar.png",
				},
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
					parent.replies = parent.replies || [];
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
	};

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

	// Handle like/unlike
	const handleLikeToggle = async () => {
		if (!sessionUser) {
			navigate("/login");
			return;
		}

		try {
			setIsLiked(!isLiked);
			setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
			// Your existing like/unlike API call here
		} catch (error) {
			setIsLiked(!isLiked);
			setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
			console.error("Error toggling like:", error);
		}
	};

	// Handle adding new comment
	const handleAddComment = async () => {
		if (!sessionUser || !newComment.trim()) return;

		setIsSubmitting(true);
		try {
			const response = await commentApi.createComment({
				comment: newComment.trim(),
				postId: post.id,
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
					// Check in replies too for nested replies
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

	// Handle comment modal open (keep for "View all comments" functionality)
	const handleOpenComments = () => {
		const formattedComments = comments.map((comment) => ({
			...comment,
			// Flatten replies for modal if needed
		}));
		openCommentModal(post.id, formattedComments);
	};

	// Check if user is post creator
	const isCreator = sessionUser?.id === post.creator;

	// Handle post edit
	const handleEdit = () => {
		navigate(`/posts/${post.id}/edit`);
		setShowOptions(false);
	};

	// Handle post delete
	const handleDelete = () => {
		if (
			window.confirm(
				"Are you sure you want to delete this post? This action cannot be undone.",
			)
		) {
			// Your existing delete logic here
		}
		setShowOptions(false);
	};

	// Toggle show all replies for a comment
	const toggleShowAllReplies = (commentId: number) => {
		setShowAllReplies((prev) => ({
			...prev,
			[commentId]: !prev[commentId],
		}));
	};

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

						{isCreator && (
							<div className="relative">
								<button
									onClick={() => setShowOptions(!showOptions)}
									className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
								>
									<MoreHorizontal size={20} />
								</button>

								{showOptions && (
									<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
										<button
											onClick={handleEdit}
											className="flex items-center gap-2 w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-100"
										>
											<Edit size={16} />
											Edit Post
										</button>
										<button
											onClick={handleDelete}
											className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
										>
											<Trash2 size={16} />
											Delete Post
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-4 py-8">
				<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
					{/* Post Header */}
					<div className="p-6 border-b border-slate-100">
						<div className="flex items-center gap-4">
							<Link to={`/users/${post.user.id}`} className="flex-shrink-0">
								<img
									src={post.user.profileImage}
									alt={post.user.username}
									className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
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
								<button
									onClick={handleLikeToggle}
									className={`flex items-center gap-2 ${
										isLiked
											? "text-red-500"
											: "text-slate-500 hover:text-red-500"
									} transition-colors`}
								>
									<Heart size={20} fill={isLiked ? "currentColor" : "none"} />
									<span className="font-medium">{likeCount}</span>
								</button>
								<button
									onClick={handleOpenComments}
									className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors"
								>
									<MessageCircle size={20} />
									<span className="font-medium">{comments.length}</span>
								</button>
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

						{/* Comments Section */}
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<h2 className="text-xl font-semibold text-slate-900">
									Comments ({comments.length})
								</h2>
								{comments.length > 3 && (
									<button
										onClick={handleOpenComments}
										className="text-orange-600 hover:text-orange-700 font-medium text-sm"
									>
										View all in modal
									</button>
								)}
							</div>

							{/* Display Comments */}
							{comments.length > 0 ? (
								<div className="space-y-4">
									{comments.map((comment) => (
										<CommentThreadComponent
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
											showAllReplies={showAllReplies}
											toggleShowAllReplies={toggleShowAllReplies}
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

			{/* Comment Modal */}
			<CommentModal
				isOpen={commentModal.isOpen}
				onClose={closeCommentModal}
				postId={commentModal.postId || post.id}
				initialComments={commentModal.comments}
			/>
		</div>
	);
};

// Comment Thread Component for Post Details - Fixed for proper threading and reply limits
interface CommentThreadComponentProps {
	comment: Comment;
	sessionUser: any;
	replyToComment: number | null;
	setReplyToComment: (id: number | null) => void;
	replyText: string;
	setReplyText: (text: string) => void;
	handleAddReply: (parentId: number) => void;
	isSubmitting: boolean;
	formatTimeAgo: (date: string) => string;
	showAllReplies: { [key: number]: boolean };
	toggleShowAllReplies: (commentId: number) => void;
	depth?: number;
}

const CommentThreadComponent: React.FC<CommentThreadComponentProps> = ({
	comment,
	sessionUser,
	replyToComment,
	setReplyToComment,
	replyText,
	setReplyText,
	handleAddReply,
	isSubmitting,
	formatTimeAgo,
	showAllReplies,
	toggleShowAllReplies,
	depth = 0,
}) => {
	const maxVisibleReplies = 0;
	const hasReplies = comment.replies && comment.replies.length > 0;
	const hasMoreReplies =
		comment.replies && comment.replies.length > maxVisibleReplies;
	const shouldShowAll = showAllReplies[comment.id];
	const visibleReplies = shouldShowAll
		? comment.replies
		: comment.replies?.slice(0, maxVisibleReplies);

	// Calculate proper indentation based on depth
	const getIndentationClass = (currentDepth: number) => {
		if (currentDepth === 0) return "";
		// Use standard Tailwind classes for better reliability
		switch (currentDepth) {
			case 1:
				return "ml-12"; // 48px
			case 2:
				return "ml-16"; // 64px
			case 3:
				return "ml-20"; // 80px
			case 4:
				return "ml-24"; // 96px
			default:
				return "ml-24"; // Max indentation
		}
	};

	return (
		<div className="space-y-3">
			{/* Main Comment */}
			<div
				className={`flex gap-3 ${depth > 0 ? getIndentationClass(depth) : ""}`}
			>
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
				<div className={`flex gap-3 ${getIndentationClass(depth + 1)}`}>
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

			{/* Replies - Each reply will have its own indentation */}
			{hasReplies && (
				<div className="space-y-3">
					{visibleReplies?.map((reply) => (
						<CommentThreadComponent
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
							showAllReplies={showAllReplies}
							toggleShowAllReplies={toggleShowAllReplies}
							depth={depth + 1}
						/>
					))}

					{/* Show more/less replies buttons */}
					{hasMoreReplies && (
						<div className={getIndentationClass(depth + 1)}>
							{!shouldShowAll ? (
								<button
									onClick={() => toggleShowAllReplies(comment.id)}
									className="text-sm text-orange-600 hover:text-orange-700 font-medium"
								>
									View {comment.replies!.length - maxVisibleReplies} more
									replies
								</button>
							) : (
								<button
									onClick={() => toggleShowAllReplies(comment.id)}
									className="text-sm text-slate-600 hover:text-slate-700 font-medium"
								>
									Show less
								</button>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default PostDetailsWithComments;

// import React, { useState } from "react";
// import { useLoaderData, Link, useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import {
// 	Heart,
// 	MessageCircle,
// 	Share2,
// 	ArrowLeft,
// 	Clock,
// 	User,
// 	Bookmark,
// 	MoreHorizontal,
// 	Edit,
// 	Trash2,
// } from "lucide-react";
// import CommentModal from "../../Comments/CommentModal";
// import { useComments } from "../../../hooks/useComments";
// import { RootState } from "../../../types";

// // Your existing PostDetails interface
// interface PostComment {
// 	id: number;
// 	userId: number;
// 	postId: number;
// 	comment: string;
// 	username: string;
// 	parentId: number | null;
// 	created_at: string;
// 	updated_at: string;
// }

// interface PostUser {
// 	id: number;
// 	username: string;
// 	firstName: string;
// 	lastName: string;
// 	profileImage: string;
// }

// interface PostDetails {
// 	id: number;
// 	title: string;
// 	caption: string;
// 	creator: number;
// 	image: string;
// 	likes: number;
// 	user: PostUser;
// 	postComments: PostComment[];
// 	createdAt: string;
// 	updatedAt: string;
// }

// const PostDetailsWithComments: React.FC = () => {
// 	const post = useLoaderData() as PostDetails;
// 	const sessionUser = useSelector((state: RootState) => state.session.user);
// 	const navigate = useNavigate();

// 	// Comment modal management
// 	const {
// 		modal: commentModal,
// 		openModal: openCommentModal,
// 		closeModal: closeCommentModal,
// 	} = useComments();

// 	const [showOptions, setShowOptions] = useState(false);
// 	const [isLiked, setIsLiked] = useState(false);
// 	const [likeCount, setLikeCount] = useState(post.likes);

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

// 	// Handle like/unlike
// 	const handleLikeToggle = async () => {
// 		if (!sessionUser) {
// 			navigate("/login");
// 			return;
// 		}

// 		try {
// 			setIsLiked(!isLiked);
// 			setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

// 			// Your existing like/unlike API call here
// 		} catch (error) {
// 			// Revert UI state on error
// 			setIsLiked(!isLiked);
// 			setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
// 			console.error("Error toggling like:", error);
// 		}
// 	};

// 	// Handle comment modal open
// 	const handleOpenComments = () => {
// 		// Convert your existing comments to the format expected by the modal
// 		const formattedComments =
// 			post.postComments?.map((comment) => ({
// 				...comment,
// 				commenter: {
// 					id: comment.userId,
// 					username: comment.username,
// 					firstName: "",
// 					lastName: "",
// 					profileImage: "/default-avatar.png", // You might need to fetch this
// 				},
// 				createdAt: comment.created_at,
// 				updatedAt: comment.updated_at,
// 			})) || [];

// 		openCommentModal(post.id, formattedComments);
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
// 			// Your existing delete logic here
// 		}
// 		setShowOptions(false);
// 	};

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
// 									className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
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
// 								<button
// 									onClick={handleLikeToggle}
// 									className={`flex items-center gap-2 ${
// 										isLiked
// 											? "text-red-500"
// 											: "text-slate-500 hover:text-red-500"
// 									} transition-colors`}
// 								>
// 									<Heart size={20} fill={isLiked ? "currentColor" : "none"} />
// 									<span className="font-medium">{likeCount}</span>
// 								</button>
// 								<button
// 									onClick={handleOpenComments}
// 									className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors"
// 								>
// 									<MessageCircle size={20} />
// 									<span className="font-medium">
// 										{post.postComments?.length || 0}
// 									</span>
// 								</button>
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

// 						{/* Comments Preview Section */}
// 						<div className="mt-8">
// 							<div className="flex items-center justify-between mb-4">
// 								<h2 className="text-xl font-semibold text-slate-900">
// 									Comments ({post.postComments?.length || 0})
// 								</h2>
// 								<button
// 									onClick={handleOpenComments}
// 									className="text-orange-600 hover:text-orange-700 font-medium text-sm"
// 								>
// 									View all comments
// 								</button>
// 							</div>

// 							{/* Show preview of first few comments */}
// 							{post.postComments && post.postComments.length > 0 ? (
// 								<div className="space-y-4">
// 									{post.postComments.slice(0, 3).map((comment) => (
// 										<div
// 											key={comment.id}
// 											className="flex gap-3 p-3 bg-slate-50 rounded-lg"
// 										>
// 											<div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 flex-shrink-0">
// 												<User size={14} />
// 											</div>
// 											<div className="flex-1">
// 												<div className="flex items-center gap-2 mb-1">
// 													<span className="font-semibold text-slate-900 text-sm">
// 														{comment.username}
// 													</span>
// 													<span className="text-xs text-slate-500">
// 														{new Date(comment.created_at).toLocaleDateString()}
// 													</span>
// 												</div>
// 												<p className="text-slate-700 text-sm">
// 													{comment.comment}
// 												</p>
// 											</div>
// 										</div>
// 									))}

// 									{post.postComments.length > 3 && (
// 										<button
// 											onClick={handleOpenComments}
// 											className="w-full py-3 text-center text-orange-600 hover:text-orange-700 font-medium bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
// 										>
// 											View {post.postComments.length - 3} more comments
// 										</button>
// 									)}
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
// 									<button
// 										onClick={handleOpenComments}
// 										className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
// 									>
// 										<MessageCircle size={16} />
// 										Add Comment
// 									</button>
// 								</div>
// 							)}
// 						</div>
// 					</div>
// 				</div>
// 			</div>

// 			{/* Comment Modal */}
// 			<CommentModal
// 				isOpen={commentModal.isOpen}
// 				onClose={closeCommentModal}
// 				postId={commentModal.postId || post.id}
// 				initialComments={commentModal.comments}
// 			/>
// 		</div>
// 	);
// };

// export default PostDetailsWithComments;
