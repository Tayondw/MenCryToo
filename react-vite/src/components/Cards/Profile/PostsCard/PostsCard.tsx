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
	return (
		<article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
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
					className="text-lg font-bold text-gray-800 leading-tight cursor-pointer hover:text-orange-600 transition-colors duration-200"
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
			<div className="p-4 pt-3">
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

				<div className="space-y-2">
					<div className="flex items-center gap-2 text-xs text-gray-500">
						<span className="font-medium text-gray-700">
							{currentUser.username}
						</span>
						<Clock size={12} />
						<span>{formatTimeAgo(post.updatedAt)}</span>
					</div>
					<p className="text-gray-700 text-sm leading-relaxed">
						{post.caption}
					</p>
				</div>
			</div>
		</article>
	);
};

export default PostsCard;
