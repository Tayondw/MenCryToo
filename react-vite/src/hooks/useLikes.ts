import { useState, useCallback } from "react";
import { LikeState, UseLikesReturn, UseLikesModalReturn } from "../types/likes";

// Custom hook for managing likes across multiple posts
export const useLikes = (): UseLikesReturn => {
	const [likeStates, setLikeStates] = useState<Map<number, LikeState>>(
		new Map(),
	);

	const setLikeState = useCallback(
		(postId: number, isLiked: boolean, count: number) => {
			setLikeStates((prev) => {
				const newMap = new Map(prev);
				newMap.set(postId, {
					isLiked,
					likeCount: count,
					isLoading: false,
				});
				return newMap;
			});
		},
		[],
	);

	const getLikeState = useCallback(
		(postId: number): LikeState | null => {
			return likeStates.get(postId) || null;
		},
		[likeStates],
	);

	const fetchLikeStatus = useCallback(
		async (postId: number) => {
			try {
				const response = await fetch(`/api/posts/${postId}/like-status`);
				if (response.ok) {
					const data = await response.json();
					setLikeState(postId, data.isLiked, data.likeCount);
				}
			} catch (error) {
				console.error(`Error fetching like status for post ${postId}:`, error);
			}
		},
		[setLikeState],
	);

	const toggleLike = useCallback(
		async (postId: number, currentIsLiked: boolean, currentCount: number) => {
			// Set loading state
			setLikeStates((prev) => {
				const newMap = new Map(prev);
				newMap.set(postId, {
					isLiked: currentIsLiked,
					likeCount: currentCount,
					isLoading: true,
				});
				return newMap;
			});

			// Optimistic update
			const optimisticIsLiked = !currentIsLiked;
			const optimisticCount = optimisticIsLiked
				? currentCount + 1
				: currentCount - 1;

			setLikeStates((prev) => {
				const newMap = new Map(prev);
				newMap.set(postId, {
					isLiked: optimisticIsLiked,
					likeCount: optimisticCount,
					isLoading: true,
				});
				return newMap;
			});

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
				setLikeStates((prev) => {
					const newMap = new Map(prev);
					newMap.set(postId, {
						isLiked: data.isLiked,
						likeCount: data.likeCount,
						isLoading: false,
					});
					return newMap;
				});
			} catch (error) {
				console.error("Error toggling like:", error);

				// Revert to original state on error
				setLikeStates((prev) => {
					const newMap = new Map(prev);
					newMap.set(postId, {
						isLiked: currentIsLiked,
						likeCount: currentCount,
						isLoading: false,
					});
					return newMap;
				});

				throw error; // Re-throw for component to handle
			}
		},
		[],
	);

	return {
		likeStates,
		toggleLike,
		setLikeState,
		getLikeState,
		fetchLikeStatus,
	};
};

export const useLikesModal = (): UseLikesModalReturn => {
	const [isOpen, setIsOpen] = useState(false);
	const [postId, setPostId] = useState<number | null>(null);

	const openModal = useCallback((postId: number) => {
		setPostId(postId);
		setIsOpen(true);
	}, []);

	const closeModal = useCallback(() => {
		setIsOpen(false);
		// Don't reset postId immediately to avoid flickering
		setTimeout(() => {
			setPostId(null);
		}, 300);
	}, []);

	return {
		isOpen,
		postId,
		openModal,
		closeModal,
	};
};
