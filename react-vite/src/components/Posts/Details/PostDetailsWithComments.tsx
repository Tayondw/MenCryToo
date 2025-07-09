import React, { useState, useCallback, useMemo } from "react";
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
	Send,
} from "lucide-react";
import CommentModal from "../../Comments/CommentModal";
import CommentThread from "../../Comments/CommentThread";
import { useComments } from "../../../hooks/useComments";
import { commentApi } from "../../../services/commentApi";
import { RootState } from "../../../types";
import type { Comment } from "../../../types/comments";

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
	commenter?: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	};
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
	const sessionUser = useSelector(
		(state: RootState) => state.session.user,
	) as SessionUser | null;
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
	const [newComment, setNewComment] = useState("");
	const [replyToComment, setReplyToComment] = useState<number | null>(null);
	const [replyText, setReplyText] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showAllReplies, setShowAllReplies] = useState<{
		[key: number]: boolean;
	}>({});

	// Comment organization function with stable user data handling
	const organizeComments = useCallback(
		(flatComments: PostComment[]): Comment[] => {
			const commentMap = new Map<number, Comment>();
			const rootComments: Comment[] = [];

			console.log("Organizing comments - input:", flatComments);

			// First pass: create Comment objects with ACTUAL commenter data from API
			flatComments.forEach((pc) => {
				console.log("Processing comment:", pc);

				// Use the commenter data that comes from the API
				let commenterData: Comment["commenter"];

				// If the API response includes commenter data, use it directly
				if (pc.commenter) {
					console.log("Using API commenter data:", pc.commenter);
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
					console.log(
						"API commenter data missing, using fallback for user:",
						pc.userId,
					);

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

				console.log("Final commenter data:", commenterData);

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

				console.log("Created comment object:", comment);
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

			console.log("Final organized comments:", rootComments);
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
		if (post.postComments && post.postComments.length > 0) {
			return organizeComments(post.postComments);
		}
		return [];
	}, [post.postComments, organizeComments]);

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

	// Handle like/unlike
	const handleLikeToggle = async () => {
		if (!sessionUser) {
			navigate("/login");
			return;
		}

		try {
			setIsLiked(!isLiked);
			setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
			// Existing like/unlike API call here
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

			// Add to the existing comments by updating the post data
			// This will trigger a re-render with the new comment
			post.postComments = [
				{
					id: newCommentObj.id,
					userId: newCommentObj.userId,
					postId: newCommentObj.postId,
					comment: newCommentObj.comment,
					username: sessionUser.username,
					parentId: newCommentObj.parentId,
					created_at: newCommentObj.createdAt,
					updated_at: newCommentObj.updatedAt,
				},
				...post.postComments,
			];

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

			// Add to post comments data structure
			const newReplyData = {
				id: response.comment.id,
				userId: sessionUser.id,
				postId: post.id,
				comment: replyText.trim(),
				username: sessionUser.username,
				parentId: parentId,
				created_at: response.comment.createdAt,
				updated_at: response.comment.updatedAt,
			};

			post.postComments = [...post.postComments, newReplyData];

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

	// Handle comment modal open
	const handleOpenComments = useCallback(() => {
		console.log("Opening comment modal with organized comments:", comments);

		// Use the organized comments directly - they already have proper commenter data
		openCommentModal(post.id, comments);
	}, [openCommentModal, post.id, comments]);

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
			// Existing delete logic here
		}
		setShowOptions(false);
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
									<span className="font-medium">
										{post.postComments?.length || 0}
									</span>
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
									Comments ({post.postComments?.length || 0})
								</h2>
								{(post.postComments?.length || 0) > 3 && (
									<button
										onClick={handleOpenComments}
										className="text-orange-600 hover:text-orange-700 font-medium text-sm"
									>
										View all in modal
									</button>
								)}
							</div>

							{/* Display Comments using enhanced CommentThread */}
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

export default PostDetailsWithComments;
