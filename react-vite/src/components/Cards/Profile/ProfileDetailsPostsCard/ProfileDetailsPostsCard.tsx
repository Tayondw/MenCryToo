import { Heart, MessageCircle, Share2, Bookmark, Clock } from "lucide-react";
import { PostCardProps } from "../../../../types";
import LikeButton from "../../../Likes/PostsLikesButton";
import "../../../Profile/Profile.css";

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
}) => (
	<article className="post-card-fixed group">
		{/* Post Header */}
		<div className="post-header-fixed">
			<div className="post-user-info-fixed">
				<img
					src={userDetails?.profileImage}
					alt={userDetails?.username}
					className="post-avatar-fixed"
				/>
				<div className="min-w-0 flex-1">
					<span className="post-username-fixed block">
						{userDetails?.username}
					</span>
				</div>
			</div>
		</div>

		{/* Post Title */}
		<div className="post-title-section-fixed">
			<h3 className="post-title-fixed" onClick={() => onPostClick(post.id)}>
				{post.title}
			</h3>
		</div>

		{/* Post Image */}
		{post.image && (
			<div
				className="post-image-section-fixed"
				onClick={() => onPostClick(post.id)}
			>
				<img src={post.image} alt={post.title} className="post-image-fixed" />
				<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
			</div>
		)}

		{/* Post Content */}
		<div className="post-content-fixed">
			<div className="post-actions-fixed">
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
			<div className="post-caption-fixed">
				<span className="caption-username-fixed">{userDetails?.username}</span>
				<span className="caption-time-fixed">
					<Clock size={12} />
					{formatTimeAgo(post.updatedAt)}
				</span>
				<span className="caption-text-fixed">{post.caption}</span>
			</div>
		</div>
	</article>
);

export default ProfileDetailsPostsCard;
