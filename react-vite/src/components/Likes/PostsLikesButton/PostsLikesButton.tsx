import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import HeartFilled from "../../HeartsFilled";

interface PostsLikeButtonProps {
	postId: number;
	initialLikeCount: number;
	initialIsLiked?: boolean;
	onLikeToggle?: (postId: number, isLiked: boolean, newCount: number) => void;
	onLikesClick?: (postId: number) => void;
	className?: string;
	showCount?: boolean;
	size?: number;
	disabled?: boolean;
}

const PostsLikeButton: React.FC<PostsLikeButtonProps> = ({
	postId,
	initialLikeCount,
	initialIsLiked = false,
	onLikeToggle,
	onLikesClick,
	className = "",
	showCount = true,
	size = 18,
	disabled = false,
}) => {
	const [isLiked, setIsLiked] = useState(initialIsLiked);
	const [likeCount, setLikeCount] = useState(initialLikeCount);
	const [isLoading, setIsLoading] = useState(false);

	// Update state when props change
	useEffect(() => {
		setIsLiked(initialIsLiked);
		setLikeCount(initialLikeCount);
	}, [initialIsLiked, initialLikeCount]);

	const handleLikeToggle = async () => {
		if (disabled || isLoading) return;

		// Optimistic update
		const newIsLiked = !isLiked;
		const newCount = newIsLiked ? likeCount + 1 : likeCount - 1;

		setIsLiked(newIsLiked);
		setLikeCount(newCount);
		setIsLoading(true);

		try {
			const response = await fetch(`/api/posts/${postId}/like`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to toggle like");
			}

			const data = await response.json();

			// Update with server response
			setIsLiked(data.isLiked);
			setLikeCount(data.likeCount);

			// Notify parent component
			if (onLikeToggle) {
				onLikeToggle(postId, data.isLiked, data.likeCount);
			}
		} catch (error) {
			console.error("Error toggling like:", error);

			// Revert optimistic update on error
			setIsLiked(isLiked);
			setLikeCount(likeCount);
		} finally {
			setIsLoading(false);
		}
	};

	const handleLikesClick = () => {
		if (onLikesClick && likeCount > 0) {
			onLikesClick(postId);
		}
	};

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			{/* Like Button */}
			<button
				onClick={handleLikeToggle}
				disabled={disabled || isLoading}
				className={`flex items-center gap-1 transition-all duration-200 ${
					isLiked
						? "text-red-500 hover:text-red-600"
						: "text-slate-500 hover:text-red-500"
				} ${
					disabled || isLoading
						? "opacity-50 cursor-not-allowed"
						: "cursor-pointer"
				} ${isLoading ? "animate-pulse" : ""} group`}
				aria-label={isLiked ? "Unlike post" : "Like post"}
			>
				{isLiked ? (
					<HeartFilled
						size={size}
						className="transition-transform group-hover:scale-110"
					/>
				) : (
					<Heart
						size={size}
						className="transition-transform group-hover:scale-110"
					/>
				)}
			</button>

			{/* Like Count */}
			{showCount && (
				<button
					onClick={handleLikesClick}
					className={`text-sm font-medium transition-colors ${
						likeCount > 0
							? "text-slate-700 hover:text-orange-600 cursor-pointer"
							: "text-slate-500 cursor-default"
					}`}
					disabled={likeCount === 0}
					aria-label={`${likeCount} likes`}
				>
					{likeCount.toLocaleString()}
				</button>
			)}
		</div>
	);
};

export default PostsLikeButton;
