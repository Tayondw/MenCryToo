import type {
	Comment,
	CommentFormData,
	CommentResponse,
	SingleCommentResponse,
	CommentLikeResponse,
	CommentLikesResponse,
} from "../types/comments";

class CommentApiError extends Error {
	constructor(
		message: string,
		public statusCode?: number,
		public errors?: Record<string, string>,
	) {
		super(message);
		this.name = "CommentApiError";
	}
}

class CommentApiService {
	private baseUrl = "/api/comments";

	/**
	 * Handle API response and throw errors if needed
	 */
	private async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
			let errors: Record<string, string> | undefined;

			try {
				const errorData = await response.json();
				if (errorData.errors) {
					errors = errorData.errors;
					errorMessage = errorData.message || errorMessage;
				} else if (errorData.message) {
					errorMessage = errorData.message;
				}
			} catch {
				// If JSON parsing fails, use default error message
			}

			throw new CommentApiError(errorMessage, response.status, errors);
		}

		try {
			return await response.json();
		} catch {
			throw new CommentApiError("Failed to parse response JSON");
		}
	}

	/**
	 * Get all comments for a specific post
	 */
	async getPostComments(
		postId: number,
		options: {
			page?: number;
			perPage?: number;
			includeReplies?: boolean;
			includeLikes?: boolean;
		} = {},
	): Promise<CommentResponse> {
		const {
			page = 1,
			perPage = 20,
			includeReplies = true,
			includeLikes = false,
		} = options;

		const params = new URLSearchParams({
			page: page.toString(),
			per_page: perPage.toString(),
			include_replies: includeReplies.toString(),
			include_likes: includeLikes.toString(),
		});

		const response = await fetch(
			`${this.baseUrl}/posts/${postId}/comments?${params}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			},
		);

		return this.handleResponse<CommentResponse>(response);
	}

	/**
	 * Get a specific comment by ID
	 */
	async getComment(commentId: number): Promise<Comment> {
		const response = await fetch(`${this.baseUrl}/${commentId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		const data = await this.handleResponse<Comment>(response);
		return data;
	}

	/**
	 * Get replies for a specific comment
	 */
	async getCommentReplies(
		commentId: number,
		options: {
			page?: number;
			perPage?: number;
		} = {},
	): Promise<CommentResponse> {
		const { page = 1, perPage = 10 } = options;

		const params = new URLSearchParams({
			page: page.toString(),
			per_page: perPage.toString(),
		});

		const response = await fetch(
			`${this.baseUrl}/${commentId}/replies?${params}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			},
		);

		return this.handleResponse<CommentResponse>(response);
	}

	/**
	 * Create a new comment
	 */
	async createComment(
		commentData: CommentFormData,
	): Promise<SingleCommentResponse> {
		const formData = new FormData();
		formData.append("comment", commentData.comment);

		if (commentData.parentId) {
			formData.append("parent_id", commentData.parentId.toString());
		}

		const response = await fetch(
			`${this.baseUrl}/posts/${commentData.postId}/comments`,
			{
				method: "POST",
				body: formData,
				credentials: "include",
			},
		);

		return this.handleResponse<SingleCommentResponse>(response);
	}

	/**
	 * Create a reply to a comment
	 */
	async createReply(
		commentData: CommentFormData,
	): Promise<SingleCommentResponse> {
		if (!commentData.parentId) {
			throw new CommentApiError("Parent ID is required for replies");
		}

		const formData = new FormData();
		formData.append("comment", commentData.comment);
		formData.append("parent_id", commentData.parentId.toString());

		const response = await fetch(
			`${this.baseUrl}/posts/${commentData.postId}/comments`,
			{
				method: "POST",
				body: formData,
				credentials: "include",
			},
		);

		return this.handleResponse<SingleCommentResponse>(response);
	}

	/**
	 * Update an existing comment
	 */
	async updateComment(
		commentId: number,
		newText: string,
	): Promise<SingleCommentResponse> {
		const response = await fetch(`${this.baseUrl}/${commentId}/edit`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ comment: newText }),
			credentials: "include",
		});

		return this.handleResponse<SingleCommentResponse>(response);
	}

	/**
	 * Delete a comment
	 */
	async deleteComment(
		postId: number,
		commentId: number,
	): Promise<{ message: string }> {
		const response = await fetch(
			`${this.baseUrl}/posts/${postId}/comments/${commentId}`,
			{
				method: "DELETE",
				credentials: "include",
			},
		);

		return this.handleResponse<{ message: string }>(response);
	}

	/**
	 * Toggle like on a comment
	 */
	async toggleCommentLike(commentId: number): Promise<CommentLikeResponse> {
		const response = await fetch(`${this.baseUrl}/${commentId}/like`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		return this.handleResponse<CommentLikeResponse>(response);
	}

	/**
	 * Get like status for current user and total count
	 */
	async getCommentLikeStatus(commentId: number): Promise<{
		isLiked: boolean;
		likeCount: number;
		commentId: number;
	}> {
		const response = await fetch(`${this.baseUrl}/${commentId}/like-status`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		return this.handleResponse<{
			isLiked: boolean;
			likeCount: number;
			commentId: number;
		}>(response);
	}

	/**
	 * Get all users who liked a specific comment
	 */
	async getCommentLikes(commentId: number): Promise<CommentLikesResponse> {
		const response = await fetch(`${this.baseUrl}/${commentId}/likes`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		return this.handleResponse<CommentLikesResponse>(response);
	}

	/**
	 * Get like status for multiple comments at once
	 */
	async getBatchCommentLikeStatus(commentIds: number[]): Promise<{
		statuses: Record<number, { isLiked: boolean; likeCount: number }>;
	}> {
		const response = await fetch(`${this.baseUrl}/batch-like-status`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ commentIds }),
			credentials: "include",
		});

		return this.handleResponse<{
			statuses: Record<number, { isLiked: boolean; likeCount: number }>;
		}>(response);
	}

	/**
	 * Get recent comments across all posts (admin/dashboard use)
	 */
	async getRecentComments(
		options: {
			page?: number;
			perPage?: number;
		} = {},
	): Promise<CommentResponse> {
		const { page = 1, perPage = 20 } = options;

		const params = new URLSearchParams({
			page: page.toString(),
			per_page: perPage.toString(),
		});

		const response = await fetch(`${this.baseUrl}/recent?${params}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		return this.handleResponse<CommentResponse>(response);
	}

	/**
	 * Validate comment text before submission
	 */
	validateComment(text: string): { isValid: boolean; error?: string } {
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
	 * Format comment for display
	 */
	formatCommentForDisplay(comment: Comment): Comment {
		return {
			...comment,
			// Ensure profile image has fallback
			commenter: {
				...comment.commenter,
				profileImage: comment.commenter.profileImage || "/default-avatar.png",
			},
			// Ensure replies array exists
			replies: comment.replies || [],
			// Ensure like data exists
			likes: comment.likes || 0,
			isLiked: comment.isLiked || false,
		};
	}

	/**
	 * Build comment tree from flat array
	 */
	buildCommentTree(flatComments: Comment[]): Comment[] {
		const commentMap = new Map<number, Comment>();
		const rootComments: Comment[] = [];

		// First pass: create map and initialize replies
		flatComments.forEach((comment) => {
			const formattedComment = this.formatCommentForDisplay(comment);
			commentMap.set(comment.id, formattedComment);
		});

		// Second pass: organize into tree
		flatComments.forEach((comment) => {
			const commentWithReplies = commentMap.get(comment.id)!;

			if (comment.parentId === null || comment.parentId === undefined) {
				rootComments.push(commentWithReplies);
			} else {
				const parent = commentMap.get(comment.parentId);
				if (parent) {
					parent.replies = parent.replies || [];
					parent.replies.push(commentWithReplies);
				} else {
					// Parent not found, treat as root
					rootComments.push(commentWithReplies);
				}
			}
		});

		// Sort by creation date
		rootComments.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);

		// Sort replies chronologically
		const sortReplies = (comment: Comment) => {
			if (comment.replies && comment.replies.length > 0) {
				comment.replies.sort(
					(a, b) =>
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
				);
				comment.replies.forEach(sortReplies);
			}
		};

		rootComments.forEach(sortReplies);

		return rootComments;
	}
}

// Export singleton instance
export const commentApi = new CommentApiService();
export { CommentApiError };
export default commentApi;
