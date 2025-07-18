import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { commentApi } from "../services/commentApi";
import type {
	Comment,
	CommentFormData,
      CommentModalState,
      UseCommentsOptions,
      UseCommentsReturn
} from "../types/comments";


export const useComments = (
	options: UseCommentsOptions = {},
): UseCommentsReturn => {
	const {
		initialComments = [],
		forceRefreshOnClose = false,
		redirectOnClose,
		refreshDelay = 100,
	} = options;

	const location = useLocation();
	const navigate = useNavigate();

	// State
	const [modal, setModal] = useState<CommentModalState>({
		isOpen: false,
		postId: null,
		comments: initialComments,
		isLoading: false,
		error: null,
		page: 1,
		hasMore: true,
	});

	const [comments, setComments] = useState<Comment[]>(initialComments);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Refs for tracking changes and refresh logic
	const loadingRef = useRef(false);
	const currentPostId = useRef<number | null>(null);
	const onCommentsChangeRef = useRef<
		((postId: number, newCount: number) => void) | null
	>(null);
	const initialCommentCountRef = useRef<number>(0);
	const hasChangesRef = useRef<boolean>(false);

	// Determine if page should refresh on close
	const shouldRefreshPage = useCallback(() => {
		if (forceRefreshOnClose) return true;

		if (!hasChangesRef.current) return false;

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
	}, [forceRefreshOnClose, location.pathname]);

	// Force refresh function
	const forceRefresh = useCallback(() => {
		setTimeout(() => {
			if (redirectOnClose) {
				navigate(redirectOnClose);
			} else {
				window.location.reload();
			}
		}, refreshDelay);
	}, [navigate, redirectOnClose, refreshDelay]);

	// Clear error
	const clearError = useCallback(() => {
		setError(null);
		setModal((prev) => ({ ...prev, error: null }));
	}, []);

	// Count comments recursively (including replies)
	const countCommentsRecursively = useCallback(
		(commentsList: Comment[]): number => {
			return commentsList.reduce((total, comment) => {
				let count = 1; // Count the comment itself
				if (comment.replies && comment.replies.length > 0) {
					count += countCommentsRecursively(comment.replies);
				}
				return total + count;
			}, 0);
		},
		[],
	);

	// Track comment count changes and mark if changes occurred
	useEffect(() => {
		if (modal.isOpen && modal.postId && onCommentsChangeRef.current) {
			const currentCount = countCommentsRecursively(modal.comments);

			// Check if count changed from initial
			if (currentCount !== initialCommentCountRef.current) {
				hasChangesRef.current = true;
				onCommentsChangeRef.current(modal.postId, currentCount);
			}
		}
	}, [modal.comments, modal.isOpen, modal.postId, countCommentsRecursively]);

	// Load comments for a post
	const loadComments = useCallback(
		async (postId: number, page: number = 1): Promise<Comment[]> => {
			if (loadingRef.current) return [];

			loadingRef.current = true;
			setIsLoading(true);
			clearError();

			try {
				const response = await commentApi.getPostComments(postId, {
					page,
					perPage: 20,
					includeReplies: true,
					includeLikes: false,
				});
				const newComments = response.comments || [];

				if (page === 1) {
					setComments(newComments);
					setModal((prev) => ({
						...prev,
						comments: newComments,
						page: 2,
						hasMore: response.pagination?.hasNext || false,
					}));
				} else {
					setComments((prev) => [...prev, ...newComments]);
					setModal((prev) => ({
						...prev,
						comments: [...prev.comments, ...newComments],
						page: page + 1,
						hasMore: response.pagination?.hasNext || false,
					}));
				}

				currentPostId.current = postId;
				return newComments;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to load comments";
				setError(errorMessage);
				setModal((prev) => ({ ...prev, error: errorMessage }));
				throw err;
			} finally {
				setIsLoading(false);
				loadingRef.current = false;
				setModal((prev) => ({ ...prev, isLoading: false }));
			}
		},
		[clearError],
	);

	// Refresh comments (reload from page 1)
	const refreshComments = useCallback(async (): Promise<void> => {
		if (currentPostId.current) {
			await loadComments(currentPostId.current, 1);
		}
	}, [loadComments]);

	// Open modal with callback and change tracking
	const openModal = useCallback(
		(
			postId: number,
			initialComments?: Comment[],
			onCommentsChange?: (postId: number, newCount: number) => void,
		) => {
			const commentsToUse = initialComments || [];
			const initialCount = countCommentsRecursively(commentsToUse);

			// Set up tracking
			initialCommentCountRef.current = initialCount;
			onCommentsChangeRef.current = onCommentsChange || null;
			hasChangesRef.current = false;

			setModal((prev) => ({
				...prev,
				isOpen: true,
				postId,
				comments: commentsToUse,
				page: 1,
				hasMore: true,
				error: null,
			}));

			if (commentsToUse.length > 0) {
				setComments(commentsToUse);
			}

			// Auto-load if no initial comments provided
			if (!initialComments || initialComments.length === 0) {
				loadComments(postId, 1);
			}
		},
		[loadComments, countCommentsRecursively],
	);

	// Close modal with refresh logic
	const closeModal = useCallback(() => {
		// Call the callback one final time before closing if there were changes
		if (
			modal.isOpen &&
			modal.postId &&
			onCommentsChangeRef.current &&
			hasChangesRef.current
		) {
			const finalCount = countCommentsRecursively(modal.comments);
			onCommentsChangeRef.current(modal.postId, finalCount);
		}

		// Close modal state
		setModal((prev) => ({
			...prev,
			isOpen: false,
			postId: null,
			error: null,
		}));

		// Handle page refresh logic
		if (shouldRefreshPage()) {
			forceRefresh();
		}

		// Clear refs
		onCommentsChangeRef.current = null;
		initialCommentCountRef.current = 0;
		hasChangesRef.current = false;
	}, [
		modal.isOpen,
		modal.postId,
		modal.comments,
		countCommentsRecursively,
		shouldRefreshPage,
		forceRefresh,
	]);

	// Add comment with change tracking
	const addComment = useCallback(
		async (formData: CommentFormData): Promise<Comment> => {
			try {
				const response = formData.parentId
					? await commentApi.createReply(formData)
					: await commentApi.createComment(formData);

				const newComment = response.comment;

				// Mark that changes occurred
				hasChangesRef.current = true;

				// Add to local state
				setComments((prev) => [newComment, ...prev]);
				setModal((prev) => ({
					...prev,
					comments: [newComment, ...prev.comments],
				}));

				return newComment;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to add comment";
				setError(errorMessage);
				throw err;
			}
		},
		[],
	);

	// Edit comment
	const editComment = useCallback(
		async (commentId: number, newText: string): Promise<void> => {
			try {
				await commentApi.updateComment(commentId, newText);

				// Mark that changes occurred
				hasChangesRef.current = true;

				const updateCommentInList = (comments: Comment[]): Comment[] => {
					return comments.map((comment) => {
						if (comment.id === commentId) {
							return {
								...comment,
								comment: newText,
								updatedAt: new Date().toISOString(),
							};
						}
						if (comment.replies) {
							return {
								...comment,
								replies: updateCommentInList(comment.replies),
							};
						}
						return comment;
					});
				};

				setComments((prev) => updateCommentInList(prev));
				setModal((prev) => ({
					...prev,
					comments: updateCommentInList(prev.comments),
				}));
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to edit comment";
				setError(errorMessage);
				throw err;
			}
		},
		[],
	);

	// Delete comment with change tracking
	const deleteComment = useCallback(
		async (commentId: number): Promise<void> => {
			if (!modal.postId) throw new Error("No post ID available");

			try {
				await commentApi.deleteComment(modal.postId, commentId);

				// Mark that changes occurred
				hasChangesRef.current = true;

				const removeCommentFromList = (comments: Comment[]): Comment[] => {
					return comments.filter((comment) => {
						if (comment.id === commentId) return false;
						if (comment.replies) {
							comment.replies = removeCommentFromList(comment.replies);
						}
						return true;
					});
				};

				setComments((prev) => removeCommentFromList(prev));
				setModal((prev) => ({
					...prev,
					comments: removeCommentFromList(prev.comments),
				}));
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to delete comment";
				setError(errorMessage);
				throw err;
			}
		},
		[modal.postId],
	);

	// Get comment count
	const getCommentCount = useCallback((): number => {
		return countCommentsRecursively(comments);
	}, [comments, countCommentsRecursively]);

	// Get comment by ID
	const getCommentById = useCallback(
		(id: number): Comment | undefined => {
			const findComment = (comments: Comment[]): Comment | undefined => {
				for (const comment of comments) {
					if (comment.id === id) return comment;
					if (comment.replies) {
						const found = findComment(comment.replies);
						if (found) return found;
					}
				}
				return undefined;
			};

			return findComment(comments);
		},
		[comments],
	);

	return {
		// State
		modal,
		comments,
		isLoading,
		error,

		// Actions
		openModal,
		closeModal,
		addComment,
		editComment,
		deleteComment,
		loadComments,
		refreshComments,

		// Utilities
		getCommentCount,
		getCommentById,
		clearError,

		// Refresh capabilities
		forceRefresh,
		hasChanges: hasChangesRef.current,
	};
};
