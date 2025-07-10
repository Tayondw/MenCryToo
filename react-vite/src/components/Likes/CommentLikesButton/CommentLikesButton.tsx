import React, { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import HeartFilled from "../../HeartsFilled";

interface CommentLikeButtonProps {
	commentId: number;
	initialLikeCount: number;
	initialIsLiked?: boolean;
	onLikeToggle?: (
		commentId: number,
		isLiked: boolean,
		newCount: number,
	) => void;
	onLikesClick?: (commentId: number) => void;
	className?: string;
	showCount?: boolean;
	size?: number;
	disabled?: boolean;
}

interface LikeResponse {
	success: boolean;
	isLiked: boolean;
	likeCount: number;
	commentId: number;
	message?: string;
	// Legacy fields
	liked?: boolean;
}

const CommentLikesButton: React.FC<CommentLikeButtonProps> = ({
	commentId,
	initialLikeCount,
	initialIsLiked = false,
	onLikeToggle,
	onLikesClick,
	className = "",
	showCount = true,
	size = 14,
	disabled = false,
}) => {
	const [isLiked, setIsLiked] = useState(initialIsLiked);
	const [likeCount, setLikeCount] = useState(initialLikeCount);
	const [isLoading, setIsLoading] = useState(false);

	// Update state when props change
	useEffect(() => {
		console.log("CommentLikeButton props updated:", {
			commentId,
			initialIsLiked,
			initialLikeCount,
		});
		setIsLiked(initialIsLiked);
		setLikeCount(initialLikeCount);
	}, [initialIsLiked, initialLikeCount, commentId]);

	const handleLikeToggle = useCallback(async () => {
		if (disabled || isLoading) return;

		console.log("Starting like toggle for comment:", commentId);

		// Optimistic update
		const newIsLiked = !isLiked;
		const newCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

		setIsLiked(newIsLiked);
		setLikeCount(newCount);
		setIsLoading(true);

		try {
			const response = await fetch(`/api/comments/${commentId}/like`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data: LikeResponse = await response.json();
			console.log("Like toggle response:", data);

			// Handle both new and legacy response formats
			const serverIsLiked = data.isLiked ?? data.liked ?? false;
			const serverLikeCount = data.likeCount ?? 0;

			// Update with server response
			setIsLiked(serverIsLiked);
			setLikeCount(serverLikeCount);

			// Notify parent component with the actual server response
			if (onLikeToggle) {
				console.log("Notifying parent of like toggle:", {
					commentId,
					isLiked: serverIsLiked,
					likeCount: serverLikeCount,
				});
				onLikeToggle(commentId, serverIsLiked, serverLikeCount);
			}

			console.log("Comment like toggled successfully:", {
				commentId,
				isLiked: serverIsLiked,
				likeCount: serverLikeCount,
			});
		} catch (error) {
			console.error("Error toggling comment like:", error);

			// Revert optimistic update on error
			setIsLiked(isLiked);
			setLikeCount(likeCount);
		} finally {
			setIsLoading(false);
		}
	}, [commentId, disabled, isLoading, isLiked, likeCount, onLikeToggle]);

	const handleLikesClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (onLikesClick && likeCount > 0) {
				onLikesClick(commentId);
			}
		},
		[onLikesClick, commentId, likeCount],
	);

	const handleHeartClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			handleLikeToggle();
		},
		[handleLikeToggle],
	);

	console.log("CommentLikeButton render state:", {
		commentId,
		isLiked,
		likeCount,
		isLoading,
	});

	return (
		<div className={`flex items-center gap-1 ${className}`}>
			{/* Like Button */}
			<button
				onClick={handleHeartClick}
				disabled={disabled || isLoading}
				className={`flex items-center transition-all duration-200 ${
					isLiked
						? "text-red-500 hover:text-red-600"
						: "text-slate-400 hover:text-red-500"
				} ${
					disabled || isLoading
						? "opacity-50 cursor-not-allowed"
						: "cursor-pointer"
				} ${isLoading ? "animate-pulse" : ""} group`}
				aria-label={isLiked ? "Unlike comment" : "Like comment"}
				title={isLiked ? "Unlike comment" : "Like comment"}
			>
				{isLiked ? (
					<HeartFilled
						size={size}
						className="transition-transform group-hover:scale-110"
						color="currentColor"
					/>
				) : (
					<Heart
						size={size}
						className="transition-transform group-hover:scale-110"
						fill="none"
					/>
				)}
			</button>

			{/* Like Count - Always show if there are likes, even if showCount is false */}
			{(showCount || likeCount > 0) && likeCount > 0 && (
				<button
					onClick={handleLikesClick}
					className="text-xs font-medium transition-colors text-slate-600 hover:text-red-500 cursor-pointer"
					disabled={likeCount === 0}
					aria-label={`${likeCount} likes`}
					title={`${likeCount} ${likeCount === 1 ? "like" : "likes"}`}
				>
					{likeCount.toLocaleString()}
				</button>
			)}

			{/* Loading indicator when processing */}
			{isLoading && (
				<div className="w-3 h-3 border border-red-300 border-t-red-500 rounded-full animate-spin ml-1" />
			)}
		</div>
	);
};

export default CommentLikesButton;
