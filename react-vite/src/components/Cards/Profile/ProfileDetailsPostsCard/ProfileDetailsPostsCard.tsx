import { Heart, MessageCircle, Share2, Bookmark, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PostCardProps } from "../../../../types";
import LikeButton from "../../../Likes/PostsLikesButton";

const ProfileDetailsPostsCard: React.FC<PostCardProps> = ({
	post,
	userDetails,
	formatTimeAgo,
	onLikeToggle,
	onCommentsClick,
	onPostClick,
	currentLikeState,
	isAuthenticated,
	onLikesClick,
	currentCommentCount,
}) => {
	const navigate = useNavigate();

	// Function to truncate caption and add "...more" if needed
	const renderCaption = (caption: string, maxLines: number = 3) => {
		// Rough estimation: ~50 characters per line for 3 lines
		const maxChars = maxLines * 50;

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
						onPostClick(post.id);
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
						src={userDetails?.profileImage}
						alt={userDetails?.username}
						className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
					/>
					<div className="min-w-0 flex-1">
						<span className="font-semibold text-gray-800 text-sm truncate block">
							{userDetails?.username}
						</span>
					</div>
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
			<div className="p-4 pt-3 flex-1 flex flex-col">
				<div className="flex items-center gap-4 mb-3">
					{/* Like Button */}
					{isAuthenticated ? (
						<LikeButton
							postId={post.id}
							initialLikeCount={currentLikeState.likeCount}
							initialIsLiked={currentLikeState.isLiked}
							onLikeToggle={onLikeToggle}
							onLikesClick={() => onLikesClick(post.id)}
							size={18}
							disabled={currentLikeState.isLoading}
						/>
					) : (
						<div className="flex items-center gap-2 text-gray-600">
							<Heart size={18} />
							<span
								className="text-sm font-medium cursor-pointer hover:text-orange-600 transition-colors"
								onClick={() => onLikesClick(post.id)}
							>
								{currentLikeState.likeCount}
							</span>
						</div>
					)}

					{/* Comment Button */}
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

				{/* Caption */}
				<div className="mt-auto">
					<p className="text-gray-700 text-sm leading-relaxed">
						<span className="font-medium text-gray-700">
							{userDetails?.username}
						</span>
						<span className="mx-2 text-gray-500">•</span>
						<span className="text-gray-500 text-xs">
							{formatTimeAgo(post.updatedAt)}
						</span>
						<span className="mx-2">•</span>
						{renderCaption(post.caption)}
					</p>
				</div>
			</div>
		</article>
	);
};

export default ProfileDetailsPostsCard;
