import React, { useState } from "react";
import { useLoaderData, Link, useNavigate, Form } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	Heart,
	MessageCircle,
	Share2,
	ArrowLeft,
	Clock,
	User,
	Send,
	Bookmark,
	MoreHorizontal,
	Edit,
	Trash2,
} from "lucide-react";
import { RootState } from "../../../types";

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

const PostDetails: React.FC = () => {
	const post = useLoaderData() as PostDetails;
	const sessionUser = useSelector((state: RootState) => state.session.user);
	const navigate = useNavigate();

	const [comment, setComment] = useState("");
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

			// This would be replaced with actual API call
			// const action = isLiked ? 'unlike-post' : 'like-post';
			// const formData = new FormData();
			// formData.append('intent', action);
			// formData.append('postId', post.id.toString());

			// await fetch(`/api/posts/${post.id}/${isLiked ? 'unlike' : 'like'}`, {
			//   method: 'POST',
			//   body: formData
			// });
		} catch (error) {
			// Revert UI state on error
			setIsLiked(!isLiked);
			setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
			console.error("Error toggling like:", error);
		}
	};

	// Handle comment submission
	const handleCommentSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!comment.trim() || !sessionUser) return;

		// This would be replaced with actual API call
		console.log("Submit comment:", comment);
		setComment("");
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
			// This would be replaced with actual API call
			const formData = new FormData();
			formData.append("intent", "delete-post");
			formData.append("postId", post.id.toString());

			// Submit form to delete post
			const form = document.createElement("form");
			form.method = "post";
			form.action = `/posts/${post.id}/delete`;

			const intentInput = document.createElement("input");
			intentInput.type = "hidden";
			intentInput.name = "intent";
			intentInput.value = "delete-post";

			const postIdInput = document.createElement("input");
			postIdInput.type = "hidden";
			postIdInput.name = "postId";
			postIdInput.value = post.id.toString();

			form.appendChild(intentInput);
			form.appendChild(postIdInput);
			document.body.appendChild(form);
			form.submit();
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
								<button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors">
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

						{/* Comments Section */}
						<div className="mt-8">
							<h2 className="text-xl font-semibold text-slate-900 mb-4">
								Comments ({post.postComments?.length || 0})
							</h2>

							{/* Comment Form */}
							{sessionUser ? (
								<form onSubmit={handleCommentSubmit} className="mb-6">
									<div className="flex items-start gap-3">
										<img
											src={sessionUser.profileImage}
											alt={sessionUser.username}
											className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
										/>
										<div className="flex-1 relative">
											<textarea
												value={comment}
												onChange={(e) => setComment(e.target.value)}
												placeholder="Add a comment..."
												className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
												rows={3}
											/>
											<button
												type="submit"
												disabled={!comment.trim()}
												className="absolute right-3 bottom-3 text-orange-500 hover:text-orange-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
											>
												<Send size={20} />
											</button>
										</div>
									</div>
								</form>
							) : (
								<div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-center">
									<p className="text-slate-600 mb-2">
										You need to be logged in to comment
									</p>
									<Link
										to="/login"
										className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
									>
										<User size={16} />
										Sign In to Comment
									</Link>
								</div>
							)}

							{/* Comments List */}
							{post.postComments && post.postComments.length > 0 ? (
								<div className="space-y-6">
									{post.postComments.map((comment) => (
										<div key={comment.id} className="flex gap-3">
											<Link
												to={`/users/${comment.userId}`}
												className="flex-shrink-0"
											>
												<div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
													<User size={16} />
												</div>
											</Link>
											<div className="flex-1">
												<div className="bg-slate-50 rounded-lg p-4">
													<div className="flex items-center justify-between mb-2">
														<Link
															to={`/users/${comment.userId}`}
															className="font-semibold text-slate-900 hover:text-orange-600 transition-colors"
														>
															{comment.username}
														</Link>
														<span className="text-xs text-slate-500">
															{new Date(
																comment.created_at,
															).toLocaleDateString()}
														</span>
													</div>
													<p className="text-slate-700">{comment.comment}</p>
												</div>
												<div className="flex items-center gap-4 mt-2 ml-2">
													<button className="text-xs text-slate-500 hover:text-orange-500 transition-colors">
														Like
													</button>
													<button className="text-xs text-slate-500 hover:text-blue-500 transition-colors">
														Reply
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8 bg-slate-50 rounded-lg">
									<MessageCircle
										size={32}
										className="mx-auto text-slate-300 mb-2"
									/>
									<p className="text-slate-600">
										No comments yet. Be the first to comment!
									</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Delete Post Form - Hidden */}
				<Form
					method="post"
					action={`/posts/${post.id}/delete`}
					id="delete-post-form"
					className="hidden"
				>
					<input type="hidden" name="intent" value="delete-post" />
					<input type="hidden" name="postId" value={post.id.toString()} />
				</Form>
			</div>
		</div>
	);
};

export default PostDetails;
