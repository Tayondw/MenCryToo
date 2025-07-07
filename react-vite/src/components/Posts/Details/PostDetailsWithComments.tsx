import React, { useState } from "react";
import { useLoaderData, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	Heart,
	MessageCircle,
	Share2,
	ArrowLeft,
	Clock,
	User,
	Bookmark,
	MoreHorizontal,
	Edit,
	Trash2,
} from "lucide-react";
import CommentModal from "../../Comments/CommentModal";
import { useComments } from "../../../hooks/useComments";
import { RootState } from "../../../types";

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
			// Revert UI state on error
			setIsLiked(!isLiked);
			setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
			console.error("Error toggling like:", error);
		}
	};

	// Handle comment modal open
	const handleOpenComments = () => {
		// Convert your existing comments to the format expected by the modal
		const formattedComments =
			post.postComments?.map((comment) => ({
				...comment,
				commenter: {
					id: comment.userId,
					username: comment.username,
					firstName: "",
					lastName: "",
					profileImage: "/default-avatar.png", // You might need to fetch this
				},
				createdAt: comment.created_at,
				updatedAt: comment.updated_at,
			})) || [];

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

						{/* Comments Preview Section */}
						<div className="mt-8">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-semibold text-slate-900">
									Comments ({post.postComments?.length || 0})
								</h2>
								<button
									onClick={handleOpenComments}
									className="text-orange-600 hover:text-orange-700 font-medium text-sm"
								>
									View all comments
								</button>
							</div>

							{/* Show preview of first few comments */}
							{post.postComments && post.postComments.length > 0 ? (
								<div className="space-y-4">
									{post.postComments.slice(0, 3).map((comment) => (
										<div
											key={comment.id}
											className="flex gap-3 p-3 bg-slate-50 rounded-lg"
										>
											<div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 flex-shrink-0">
												<User size={14} />
											</div>
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<span className="font-semibold text-slate-900 text-sm">
														{comment.username}
													</span>
													<span className="text-xs text-slate-500">
														{new Date(comment.created_at).toLocaleDateString()}
													</span>
												</div>
												<p className="text-slate-700 text-sm">
													{comment.comment}
												</p>
											</div>
										</div>
									))}

									{post.postComments.length > 3 && (
										<button
											onClick={handleOpenComments}
											className="w-full py-3 text-center text-orange-600 hover:text-orange-700 font-medium bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
										>
											View {post.postComments.length - 3} more comments
										</button>
									)}
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
									<button
										onClick={handleOpenComments}
										className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
									>
										<MessageCircle size={16} />
										Add Comment
									</button>
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
