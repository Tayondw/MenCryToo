import type {
	Comment,
	LegacyCommentData,
	CommentTransformOptions,
} from "../types/comments";

/**
 * Function to create a safe commenter object with proper defaults
 */
export function createSafeCommenter(
	data: Partial<{
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	}>,
	options: CommentTransformOptions = {},
): Comment["commenter"] {
	return {
		id: data.id || 0,
		username: data.username || "Unknown User",
		firstName: data.firstName || "",
		lastName: data.lastName || "",
		profileImage:
			data.profileImage ||
			options.fallbackProfileImage ||
			"/default-avatar.png",
	};
}

/**
 * Comment transformation with better user data handling
 */
export function transformLegacyComment(
	oldComment: LegacyCommentData,
	options: CommentTransformOptions = {},
): Comment {
	// If the comment already has enhanced commenter data, use it
	if (oldComment.commenter) {
		return {
			id: oldComment.id,
			userId: oldComment.userId || oldComment.user_id || 0,
			postId: oldComment.postId || oldComment.post_id || 0,
			comment: oldComment.comment,
			parentId: oldComment.parentId ?? oldComment.parent_id ?? null,
			createdAt:
				oldComment.createdAt ||
				oldComment.created_at ||
				new Date().toISOString(),
			updatedAt:
				oldComment.updatedAt ||
				oldComment.updated_at ||
				new Date().toISOString(),
			commenter: {
				...oldComment.commenter,
				// Ensure profile image has fallback
				profileImage:
					oldComment.commenter.profileImage ||
					options.fallbackProfileImage ||
					"/default-avatar.png",
			},
			replies: [],
		};
	}

	// Determine the best commenter data to use
	const userId = oldComment.userId || oldComment.user_id || 0;
	let commenterData: Comment["commenter"];

	// Check if this is the session user
	if (options.sessionUser && userId === options.sessionUser.id) {
		commenterData = createSafeCommenter(
			{
				id: options.sessionUser.id,
				username: options.sessionUser.username,
				firstName: options.sessionUser.firstName,
				lastName: options.sessionUser.lastName,
				profileImage: options.sessionUser.profileImage,
			},
			options,
		);
	}
	// Check if this is the post creator
	else if (options.postCreator && userId === options.postCreator.id) {
		commenterData = createSafeCommenter(
			{
				id: options.postCreator.id,
				username: options.postCreator.username,
				firstName: options.postCreator.firstName,
				lastName: options.postCreator.lastName,
				profileImage: options.postCreator.profileImage,
			},
			options,
		);
	}
	// Use available data from the legacy comment
	else {
		commenterData = createSafeCommenter(
			{
				id: userId,
				username: oldComment.username,
				firstName: oldComment.firstName || oldComment.first_name,
				lastName: oldComment.lastName || oldComment.last_name,
				profileImage: oldComment.profileImage || oldComment.profile_image_url,
			},
			options,
		);
	}

	const transformedComment: Comment = {
		id: oldComment.id,
		userId: userId,
		postId: oldComment.postId || oldComment.post_id || 0,
		comment: oldComment.comment,
		parentId: oldComment.parentId ?? oldComment.parent_id ?? null,
		createdAt:
			oldComment.createdAt || oldComment.created_at || new Date().toISOString(),
		updatedAt:
			oldComment.updatedAt || oldComment.updated_at || new Date().toISOString(),
		commenter: commenterData,
		replies: [],
	};

	return transformedComment;
}

/**
 * Organize flat comments into a threaded structure with enhanced user data
 */
export function organizeCommentsIntoThreads(
	flatComments: Comment[],
): Comment[] {
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

	return rootComments;
}

/**
 * Transform multiple legacy comments with consistent user data
 */
export function transformLegacyComments(
	legacyComments: LegacyCommentData[],
	options: CommentTransformOptions = {},
): Comment[] {
	return legacyComments.map((comment) =>
		transformLegacyComment(comment, options),
	);
}

/**
 * Comment validation
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
 * Format time ago for comments
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
 * Check if user can edit/delete comment
 */
export function canModifyComment(
	comment: Comment,
	currentUserId?: number,
): boolean {
	return currentUserId !== undefined && comment.userId === currentUserId;
}

/**
 * Extract mentioned username from comment text
 */
export function extractMentionFromComment(commentText: string): string | null {
	const mentionMatch = commentText.match(/^@(\w+)/);
	return mentionMatch ? mentionMatch[1] : null;
}

/**
 * Search comments by text with enhanced matching
 */
export function searchComments(
	comments: Comment[],
	searchTerm: string,
): Comment[] {
	const term = searchTerm.toLowerCase().trim();

	if (!term) return comments;

	const matchesSearch = (comment: Comment): boolean => {
		const commentMatch = comment.comment.toLowerCase().includes(term);
		const usernameMatch = comment.commenter.username
			.toLowerCase()
			.includes(term);
		const firstNameMatch = comment.commenter.firstName
			.toLowerCase()
			.includes(term);
		const lastNameMatch = comment.commenter.lastName
			.toLowerCase()
			.includes(term);

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
 * Flatten comment tree into a list
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
 * Check if comment contains @ mention for a specific user
 */
export function isReplyToUser(comment: Comment, username: string): boolean {
	const mentionedUser = extractMentionFromComment(comment.comment);
	return mentionedUser === username;
}

/**
 * Build comment with user data
 */
export function buildEnhancedComment(
	baseComment: Partial<Comment>,
	commenterData: Comment["commenter"],
): Comment {
	return {
		id: baseComment.id || 0,
		userId: baseComment.userId || 0,
		postId: baseComment.postId || 0,
		comment: baseComment.comment || "",
		parentId: baseComment.parentId || null,
		createdAt: baseComment.createdAt || new Date().toISOString(),
		updatedAt: baseComment.updatedAt || new Date().toISOString(),
		commenter: commenterData,
		replies: baseComment.replies || [],
	};
}
