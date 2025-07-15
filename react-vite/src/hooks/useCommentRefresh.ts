import { useCallback, useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface CommentRefreshOptions {
	// Force refresh on any comment change
	forceRefresh?: boolean;
	// Custom redirect path on close
	redirectPath?: string;
	// Delay before refresh (ms)
	refreshDelay?: number;
	// Callback for when refresh happens
	onRefresh?: () => void;
}

interface CommentRefreshReturn {
	// Function to call when comments change
	onCommentChange: (changeType: "add" | "delete", newCount: number) => void;
	// Function to call when modal closes (handles refresh logic)
	onModalClose: () => void;
	// Whether comments have changed
	hasChanged: boolean;
	// Current comment count
	currentCount: number;
}

export const useCommentRefresh = (
	options: CommentRefreshOptions = {},
): CommentRefreshReturn => {
	const {
		forceRefresh = false,
		redirectPath,
		refreshDelay = 100,
		onRefresh,
	} = options;

	const location = useLocation();
	const navigate = useNavigate();

	// Track comment changes
	const initialCountRef = useRef<number>(0);
	const currentCountRef = useRef<number>(0);
	const hasChangedRef = useRef<boolean>(false);

	// Determine if current page should refresh when comments change
	const shouldRefreshPage = useCallback(() => {
		if (forceRefresh) return true;

		if (!hasChangedRef.current) return false;

		const currentPath = location.pathname;

		// Pages that should refresh when comments change
		const refreshablePages = [
			"/posts-feed",
			"/similar-feed",
			"/profile",
			"/profile-feed",
		];

		// Check if current page should refresh
		const shouldRefresh =
			refreshablePages.some((page) => currentPath.startsWith(page)) ||
			currentPath.match(/^\/posts\/\d+$/); // Individual post pages

		return shouldRefresh;
	}, [forceRefresh, location.pathname]);

	// Handle comment count changes
	const onCommentChange = useCallback(
		(changeType: "add" | "delete", newCount: number) => {
			// Set initial count if not set
			if (initialCountRef.current === 0) {
				initialCountRef.current = newCount;
			}

			// Update current count and mark as changed
			currentCountRef.current = newCount;
			hasChangedRef.current = true;
		},
		[],
	);

	// Handle modal close with refresh logic
	const onModalClose = useCallback(() => {
		if (!shouldRefreshPage()) {
			return;
		}

		// Call onRefresh callback if provided
		if (onRefresh) {
			onRefresh();
		}

		// Delay refresh to allow any state updates
		setTimeout(() => {
			if (redirectPath) {
				// Custom redirect
				navigate(redirectPath);
			} else {
				// Force page refresh
				window.location.href = window.location.href;
			}
		}, refreshDelay);
	}, [shouldRefreshPage, onRefresh, redirectPath, navigate, refreshDelay]);

	// Reset when component unmounts or location changes significantly
	useEffect(() => {
		// Reset refs when location changes
		return () => {
			initialCountRef.current = 0;
			currentCountRef.current = 0;
			hasChangedRef.current = false;
		};
	}, [location.pathname]);

	return {
		onCommentChange,
		onModalClose,
		hasChanged: hasChangedRef.current,
		currentCount: currentCountRef.current,
	};
};

// Alternative approach: Create a global comment state manager
class CommentStateManager {
	private listeners: Map<string, (count: number) => void> = new Map();
	private commentCounts: Map<number, number> = new Map(); // postId -> count

	// Register a listener for comment count changes
	subscribe(postId: number, callback: (count: number) => void): () => void {
		const key = `post-${postId}`;
		this.listeners.set(key, callback);

		// Return unsubscribe function
		return () => {
			this.listeners.delete(key);
		};
	}

	// Update comment count for a post
	updateCount(postId: number, newCount: number): void {
		const oldCount = this.commentCounts.get(postId) || 0;
		this.commentCounts.set(postId, newCount);

		// Notify listeners
		const key = `post-${postId}`;
		const listener = this.listeners.get(key);
		if (listener && newCount !== oldCount) {
			listener(newCount);
		}
	}

	// Get current count for a post
	getCount(postId: number): number {
		return this.commentCounts.get(postId) || 0;
	}

	// Clear count for a post
	clearCount(postId: number): void {
		this.commentCounts.delete(postId);
		const key = `post-${postId}`;
		this.listeners.delete(key);
	}

	// Force refresh for pages that should update
	forceRefreshIfNeeded(): void {
		const currentPath = window.location.pathname;

		const refreshablePages = [
			"/posts-feed",
			"/similar-feed",
			"/profile",
			"/profile-feed",
		];

		const shouldRefresh =
			refreshablePages.some((page) => currentPath.startsWith(page)) ||
			currentPath.match(/^\/posts\/\d+$/);

		if (shouldRefresh) {
			setTimeout(() => {
				window.location.href = window.location.href;
			}, 100);
		}
	}
}

// Export singleton instance
export const commentStateManager = new CommentStateManager();

// Hook to use the global comment state manager
export const useCommentState = (postId: number) => {
	const [count, setCount] = useState(0);

	useEffect(() => {
		// Get initial count
		const initialCount = commentStateManager.getCount(postId);
		setCount(initialCount);

		// Subscribe to updates
		const unsubscribe = commentStateManager.subscribe(postId, (newCount) => {
			setCount(newCount);
		});

		return unsubscribe;
	}, [postId]);

	const updateCount = useCallback(
		(newCount: number) => {
			commentStateManager.updateCount(postId, newCount);
		},
		[postId],
	);

	return { count, updateCount };
};

// Enhanced hook that combines refresh logic with state management
export const useCommentModal = (
	postId: number,
	options: CommentRefreshOptions = {},
) => {
	const { count, updateCount } = useCommentState(postId);
	const { onCommentChange, onModalClose } = useCommentRefresh(options);

	// Combined handler for comment changes
	const handleCommentChange = useCallback(
		(changeType: "add" | "delete", newCount: number) => {
			// Update global state
			updateCount(newCount);
			// Handle refresh logic
			onCommentChange(changeType, newCount);
		},
		[updateCount, onCommentChange],
	);

	// Enhanced close handler
	const handleModalClose = useCallback(() => {
		// Trigger refresh logic
		onModalClose();
	}, [onModalClose]);

	return {
		commentCount: count,
		onCommentChange: handleCommentChange,
		onModalClose: handleModalClose,
	};
};
