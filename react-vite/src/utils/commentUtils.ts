import type { Comment } from "../types/comments";

/**
 * Organize flat comments into a threaded structure - Enhanced for better threading
 */
export function organizeCommentsIntoThreads(
	flatComments: Comment[],
): Comment[] {
	console.log("Organizing comments:", flatComments);

	const commentMap = new Map<number, Comment>();
	const rootComments: Comment[] = [];

	// First pass: create a map of all comments and initialize replies array
	flatComments.forEach((comment) => {
		const commentWithReplies: Comment = {
			...comment,
			replies: [],
		};
		commentMap.set(comment.id, commentWithReplies);
	});

	// Second pass: organize into threads
	flatComments.forEach((comment) => {
		const commentWithReplies = commentMap.get(comment.id)!;

		if (comment.parentId === null || comment.parentId === undefined) {
			// Root level comment
			rootComments.push(commentWithReplies);
		} else {
			// Reply to another comment
			const parentComment = commentMap.get(comment.parentId);
			if (parentComment) {
				parentComment.replies = parentComment.replies || [];
				parentComment.replies.push(commentWithReplies);
			} else {
				// Parent not found, treat as root comment (fallback)
				console.warn(
					`Parent comment ${comment.parentId} not found for comment ${comment.id}`,
				);
				rootComments.push(commentWithReplies);
			}
		}
	});

	// Sort comments by creation date (newest first for root, oldest first for replies)
	rootComments.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);

	// Sort replies chronologically (oldest first) and recursively
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

	console.log("Organized into threads:", rootComments);
	return rootComments;
}

/**
 * Format time ago for comments - Enhanced with more granular time display
 */
export function formatCommentTime(dateString: string): string {
	const now = new Date();
	const commentDate = new Date(dateString);
	const diffInSeconds = Math.floor(
		(now.getTime() - commentDate.getTime()) / 1000,
	);

	if (diffInSeconds < 10) {
		return "just now";
	}

	if (diffInSeconds < 60) {
		return `${diffInSeconds}s ago`;
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes}m ago`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours}h ago`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		return `${diffInDays}d ago`;
	}

	const diffInWeeks = Math.floor(diffInDays / 7);
	if (diffInWeeks < 4) {
		return `${diffInWeeks}w ago`;
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
 * Count total replies in a comment thread - Enhanced to handle nested replies
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

		// Prevent infinite loops
		if (depth > 10) break;
	}

	return depth;
}

/**
 * Validate comment text - Enhanced validation
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

	// Check for excessive @ mentions (spam prevention)
	const mentionCount = (trimmed.match(/@\w+/g) || []).length;
	if (mentionCount > 5) {
		return {
			isValid: false,
			error: "Too many @ mentions (max 5 allowed)",
		};
	}

	return { isValid: true };
}

/**
 * Search comments by text - Enhanced search with better matching
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

/**
 * Flatten comment tree into a list - Useful for certain operations
 */
export function flattenCommentTree(comments: Comment[]): Comment[] {
	const flattened: Comment[] = [];

	const flatten = (comment: Comment) => {
		flattened.push(comment);
		if (comment.replies) {
			comment.replies.forEach(flatten);
		}
	};

	comments.forEach(flatten);
	return flattened;
}

/**
 * Get all parent comments for a given comment
 */
export function getCommentParents(
	comment: Comment,
	allComments: Comment[],
): Comment[] {
	const parents: Comment[] = [];
	let currentParentId = comment.parentId;

	while (currentParentId !== null) {
		const parentComment = allComments.find((c) => c.id === currentParentId);
		if (parentComment) {
			parents.unshift(parentComment); // Add to beginning to maintain order
			currentParentId = parentComment.parentId;
		} else {
			break;
		}

		// Prevent infinite loops
		if (parents.length > 10) break;
	}

	return parents;
}

/**
 * Check if a comment is a reply to a specific user
 */
export function isReplyToUser(comment: Comment, username: string): boolean {
	const mentionedUser = extractMentionFromComment(comment.comment);
	return mentionedUser === username;
}

/**
 * Sort comments by different criteria
 */
export function sortComments(
	comments: Comment[],
	sortBy: "newest" | "oldest" | "popular" | "replies",
): Comment[] {
	const sorted = [...comments];

	switch (sortBy) {
		case "oldest":
			return sorted.sort(
				(a, b) =>
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
			);

		case "popular":
			// Sort by reply count, then by creation date
			return sorted.sort((a, b) => {
				const aReplies = countTotalReplies(a);
				const bReplies = countTotalReplies(b);
				if (aReplies !== bReplies) return bReplies - aReplies;
				return (
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			});

		case "replies":
			// Sort by number of direct replies only
			return sorted.sort((a, b) => {
				const aDirectReplies = a.replies?.length || 0;
				const bDirectReplies = b.replies?.length || 0;
				if (aDirectReplies !== bDirectReplies)
					return bDirectReplies - aDirectReplies;
				return (
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			});

		case "newest":
		default:
			return sorted.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
	}
}

/**
 * Get comment statistics
 */
export function getCommentStats(comments: Comment[]): {
	totalComments: number;
	totalReplies: number;
	maxDepth: number;
	avgRepliesPerComment: number;
} {
	const flatComments = flattenCommentTree(comments);
	const totalComments = flatComments.length;
	const rootComments = comments.length;
	const totalReplies = totalComments - rootComments;

	let maxDepth = 0;
	const calculateDepth = (comment: Comment, depth: number = 0): number => {
		maxDepth = Math.max(maxDepth, depth);
		let childMaxDepth = depth;

		if (comment.replies) {
			comment.replies.forEach((reply) => {
				childMaxDepth = Math.max(
					childMaxDepth,
					calculateDepth(reply, depth + 1),
				);
			});
		}

		return childMaxDepth;
	};

	comments.forEach((comment) => calculateDepth(comment));

	const avgRepliesPerComment =
		rootComments > 0 ? totalReplies / rootComments : 0;

	return {
		totalComments,
		totalReplies,
		maxDepth,
		avgRepliesPerComment: Math.round(avgRepliesPerComment * 100) / 100,
	};
}

/**
 * Transform old comment format to new Comment interface
 */
export function transformLegacyComment(oldComment: any): Comment {
	return {
		id: oldComment.id,
		userId: oldComment.userId || oldComment.user_id,
		postId: oldComment.postId || oldComment.post_id,
		comment: oldComment.comment,
		parentId: oldComment.parentId || oldComment.parent_id || null,
		createdAt: oldComment.createdAt || oldComment.created_at,
		updatedAt: oldComment.updatedAt || oldComment.updated_at,
		commenter: oldComment.commenter || {
			id: oldComment.userId || oldComment.user_id,
			username: oldComment.username || "unknown",
			firstName: oldComment.firstName || oldComment.first_name || "",
			lastName: oldComment.lastName || oldComment.last_name || "",
			profileImage:
				oldComment.profileImage ||
				oldComment.profile_image_url ||
				"/default-avatar.png",
		},
		replies: [],
	};
}

/**
 * Build comment breadcrumb for navigation
 */
export function buildCommentBreadcrumb(
	comment: Comment,
	allComments: Comment[],
): string[] {
	const parents = getCommentParents(comment, allComments);
	const breadcrumb = parents.map(
		(parent) => `@${parent.commenter?.username || "unknown"}`,
	);
	breadcrumb.push(`@${comment.commenter?.username || "unknown"}`);
	return breadcrumb;
}

/**
 * Check if comment contains sensitive content (basic implementation)
 */
export function containsSensitiveContent(commentText: string): boolean {
	const sensitiveWords = [
		// Add your list of sensitive words here
		"spam",
		"scam",
		// This is a basic example - in production you'd use a more comprehensive list
	];

	const lowerText = commentText.toLowerCase();
	return sensitiveWords.some((word) => lowerText.includes(word));
}

/**
 * Generate comment summary for notifications
 */
export function generateCommentSummary(
	comment: Comment,
	maxLength: number = 50,
): string {
	let summary = comment.comment;

	// Remove @ mentions from the beginning for cleaner summary
	summary = summary.replace(/^@\w+\s*/, "");

	// Truncate if needed
	if (summary.length > maxLength) {
		summary = summary.substring(0, maxLength).trim() + "...";
	}

	return summary;
}

/**
 * Calculate comment engagement score (for sorting/ranking)
 */
export function calculateEngagementScore(comment: Comment): number {
	const replyCount = countTotalReplies(comment);
	const ageInHours =
		(Date.now() - new Date(comment.createdAt).getTime()) / (1000 * 60 * 60);

	// Higher score for more recent comments with more engagement
	// This is a simple algorithm - you could make it more sophisticated
	const recencyFactor = Math.max(0, 1 - ageInHours / (24 * 7)); // Decay over a week
	const engagementFactor = Math.log(replyCount + 1); // Logarithmic scaling for replies

	return recencyFactor * engagementFactor;
}

/**
 * Filter comments by date range
 */
export function filterCommentsByDateRange(
	comments: Comment[],
	startDate: Date,
	endDate: Date,
): Comment[] {
	return comments.filter((comment) => {
		const commentDate = new Date(comment.createdAt);
		return commentDate >= startDate && commentDate <= endDate;
	});
}

/**
 * Group comments by user
 */
export function groupCommentsByUser(
	comments: Comment[],
): Map<string, Comment[]> {
	const groups = new Map<string, Comment[]>();

	const addToGroup = (comment: Comment) => {
		const username = comment.commenter?.username || "unknown";
		if (!groups.has(username)) {
			groups.set(username, []);
		}
		groups.get(username)!.push(comment);

		// Also process replies
		if (comment.replies) {
			comment.replies.forEach(addToGroup);
		}
	};

	comments.forEach(addToGroup);
	return groups;
}
