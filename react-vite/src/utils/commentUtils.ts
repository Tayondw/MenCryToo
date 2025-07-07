import type { Comment } from "../types/comments";

/**
 * Organize flat comments into a threaded structure
 */
export function organizeCommentsIntoThreads(
	flatComments: Comment[],
): Comment[] {
	const commentMap = new Map<number, Comment>();
	const rootComments: Comment[] = [];

	// First pass: create a map of all comments and initialize replies array
	flatComments.forEach((comment) => {
		commentMap.set(comment.id, { ...comment, replies: [] });
	});

	// Second pass: organize into threads
	flatComments.forEach((comment) => {
		const commentWithReplies = commentMap.get(comment.id)!;

		if (comment.parentId === null) {
			// Root level comment
			rootComments.push(commentWithReplies);
		} else {
			// Reply to another comment
			const parentComment = commentMap.get(comment.parentId);
			if (parentComment) {
				parentComment.replies = parentComment.replies || [];
				parentComment.replies.push(commentWithReplies);
			} else {
				// Parent not found, treat as root comment
				rootComments.push(commentWithReplies);
			}
		}
	});

	// Sort comments by creation date (newest first for root, oldest first for replies)
	rootComments.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);

	// Sort replies chronologically (oldest first)
	const sortRepliesRecursively = (comment: Comment) => {
		if (comment.replies && comment.replies.length > 0) {
			comment.replies.sort(
				(a, b) =>
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
			);
			comment.replies.forEach(sortRepliesRecursively);
		}
	};

	rootComments.forEach(sortRepliesRecursively);

	return rootComments;
}

/**
 * Format time ago for comments
 */
export function formatCommentTime(dateString: string): string {
	const now = new Date();
	const commentDate = new Date(dateString);
	const diffInSeconds = Math.floor(
		(now.getTime() - commentDate.getTime()) / 1000,
	);

	if (diffInSeconds < 60) {
		return "just now";
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes}m`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours}h`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		return `${diffInDays}d`;
	}

	const diffInWeeks = Math.floor(diffInDays / 7);
	if (diffInWeeks < 4) {
		return `${diffInWeeks}w`;
	}

	// For older comments, show the actual date
	return commentDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year:
			commentDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
	});
}

/**
 * Generate @ mention text for replies
 */
export function generateMentionText(
	replyToUsername: string,
	commentText: string,
): string {
	const mention = `@${replyToUsername}`;

	// Don't add mention if it already exists at the start
	if (commentText.trim().startsWith(mention)) {
		return commentText;
	}

	return `${mention} ${commentText}`;
}

/**
 * Extract mentioned username from comment text
 */
export function extractMentionFromComment(commentText: string): string | null {
	const mentionMatch = commentText.match(/^@(\w+)/);
	return mentionMatch ? mentionMatch[1] : null;
}

/**
 * Count total replies in a comment thread
 */
export function countTotalReplies(comment: Comment): number {
	let count = 0;

	if (comment.replies) {
		count += comment.replies.length;
		comment.replies.forEach((reply) => {
			count += countTotalReplies(reply);
		});
	}

	return count;
}

/**
 * Get the depth of nested comments
 */
export function getCommentDepth(
	comment: Comment,
	allComments: Comment[],
): number {
	let depth = 0;
	let currentParentId = comment.parentId;

	while (currentParentId !== null) {
		depth++;
		const parentComment = allComments.find((c) => c.id === currentParentId);
		currentParentId = parentComment?.parentId || null;
	}

	return depth;
}

/**
 * Validate comment text
 */
export function validateComment(text: string): {
	isValid: boolean;
	error?: string;
} {
	const trimmed = text.trim();

	if (!trimmed) {
		return { isValid: false, error: "Comment cannot be empty" };
	}

	if (trimmed.length < 1) {
		return { isValid: false, error: "Comment is too short" };
	}

	if (trimmed.length > 500) {
		return {
			isValid: false,
			error: "Comment is too long (max 500 characters)",
		};
	}

	return { isValid: true };
}

/**
 * Search comments by text
 */
export function searchComments(
	comments: Comment[],
	searchTerm: string,
): Comment[] {
	const term = searchTerm.toLowerCase().trim();

	if (!term) return comments;

	const matchesSearch = (comment: Comment): boolean => {
		const commentMatch = comment.comment.toLowerCase().includes(term);
		const usernameMatch =
			comment.commenter?.username?.toLowerCase().includes(term) ?? false;
		const firstNameMatch =
			comment.commenter?.firstName?.toLowerCase().includes(term) ?? false;
		const lastNameMatch =
			comment.commenter?.lastName?.toLowerCase().includes(term) ?? false;

		return commentMatch || usernameMatch || firstNameMatch || lastNameMatch;
	};

	const searchRecursively = (comment: Comment): Comment | null => {
		const commentMatches = matchesSearch(comment);
		const matchingReplies =
			comment.replies?.map(searchRecursively).filter(Boolean) || [];

		if (commentMatches || matchingReplies.length > 0) {
			return {
				...comment,
				replies: matchingReplies as Comment[],
			};
		}

		return null;
	};

	return comments.map(searchRecursively).filter(Boolean) as Comment[];
}

/**
 * Get comment permalink
 */
export function getCommentPermalink(postId: number, commentId: number): string {
	return `/posts/${postId}#comment-${commentId}`;
}

/**
 * Check if user can edit/delete comment
 */
export function canModifyComment(
	comment: Comment,
	currentUserId?: number,
): boolean {
	return currentUserId !== undefined && comment.userId === currentUserId;
}

/**
 * Truncate long comments for preview
 */
export function truncateComment(text: string, maxLength: number = 100): string {
	if (text.length <= maxLength) return text;

	const truncated = text.substring(0, maxLength).trim();
	const lastSpace = truncated.lastIndexOf(" ");

	return (
		(lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "..."
	);
}
