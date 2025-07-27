import React from "react";
import { Clock, MessageCircle, Share2, Bookmark } from "lucide-react";
import { ProfilePostCardProps } from "../../../../types";
import LikeButton from "../../../Likes/PostsLikesButton";

const PostsCard: React.FC<ProfilePostCardProps> = ({
	post,
	currentUser,
	currentLikeState,
	currentCommentCount,
	formatTimeAgo,
	onLikeToggle,
	onCommentsClick,
	onPostClick,
	onLikesClick,
	navigate,
	PostMenu,
}) => {
	// Function to truncate caption and add "...more" if needed
	const renderCaption = (caption: string, maxLines: number = 3) => {
		// Rough estimation: ~20 characters per line for 3 lines
		const maxChars = maxLines * 20;

		if (caption.length <= maxChars) {
			return <span>{caption}</span>;
		}

		const truncated = caption.substring(0, maxChars);
		const lastSpaceIndex = truncated.lastIndexOf(" ");
		const finalText =
			lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated;

		return (
			<span>
				{finalText}
				<button
					onClick={(e) => {
						e.preventDefault();
						navigate(`/posts/${post.id}`);
					}}
					className="text-orange-600 hover:text-orange-700 font-medium ml-1 transition-colors duration-200"
				>
					...more
				</button>
			</span>
		);
	};

	return (
		<article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-orange-300 transition-all duration-300 group h-full flex flex-col">
			{/* Post Header */}
			<div className="flex items-center justify-between p-4 pb-3">
				<div className="flex items-center gap-3 min-w-0 flex-1">
					<img
						src={currentUser.profileImage}
						alt={currentUser.username}
						className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
					/>
					<div className="min-w-0 flex-1">
						<span className="font-semibold text-gray-800 text-sm truncate block">
							{currentUser.username}
						</span>
					</div>
				</div>
				<div className="flex-shrink-0">
					<PostMenu post={post} navigate={navigate} />
				</div>
			</div>

			{/* Post Title */}
			<div className="px-4 pb-3">
				<h3
					className="text-lg h-12 font-bold text-gray-800 leading-tight cursor-pointer hover:text-orange-600 transition-colors duration-200 tracking-widest place-content-center"
					onClick={() => onPostClick(post.id)}
				>
					{post.title}
				</h3>
			</div>

			{/* Post Image */}
			{post.image && (
				<div
					className="relative aspect-[4/3] overflow-hidden cursor-pointer"
					onClick={() => onPostClick(post.id)}
				>
					<img
						src={post.image}
						alt={post.title}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
				</div>
			)}

			{/* Post Content */}
			<div className="p-4 pt-3 flex-1 flex flex-col">
				<div className="flex items-center gap-4 mb-3">
					<LikeButton
						postId={post.id}
						initialLikeCount={currentLikeState.likeCount}
						initialIsLiked={currentLikeState.isLiked}
						onLikeToggle={onLikeToggle}
						onLikesClick={() => onLikesClick(post.id)}
						size={18}
						disabled={currentLikeState.isLoading}
					/>

					<button
						onClick={() => onCommentsClick(post.id)}
						className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors duration-200"
					>
						<MessageCircle size={18} />
						<span className="text-sm font-medium">{currentCommentCount}</span>
					</button>

					<button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors duration-200 ml-auto">
						<Share2 size={16} />
					</button>
					<button className="flex items-center gap-2 text-gray-600 hover:text-yellow-500 transition-colors duration-200">
						<Bookmark size={16} />
					</button>
				</div>

				<div className="mt-auto mb-4">
					<div className="flex h-10 items-start gap-2 text-gray-700 text-sm leading-relaxed">
						<div className="flex items-center gap-2 flex-shrink-0">
							<span className="font-semibold text-gray-700">
								{currentUser.username}
							</span>
							<span className="text-gray-500">•</span>
							<div className="flex items-center gap-1">
								<Clock size={12} className="text-gray-500" />
								<span className="text-gray-500 text-xs">
									{formatTimeAgo(post.updatedAt)}
								</span>
							</div>
							<span className="text-gray-500">•</span>
						</div>
						<div className="flex-1 min-w-0">{renderCaption(post.caption)}</div>
					</div>
				</div>
			</div>
		</article>
	);
};

export default PostsCard;
