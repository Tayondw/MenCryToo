import type {
	Comment,
	CommentResponse,
	SingleCommentResponse,
	CommentFormData,
} from "../types/comments";

class CommentAPI {
	private baseUrl = "/api";

	/**
	 * Get comments for a specific post - Fixed endpoint to match backend routes
	 */
	async getPostComments(
		postId: number,
		page: number = 1,
		perPage: number = 20,
	): Promise<CommentResponse> {
		try {
			// Use the correct endpoint that matches your backend routes
			const response = await fetch(
				`${this.baseUrl}/comments/posts/${postId}/comments?page=${page}&per_page=${perPage}&include_replies=true`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include", // Important for session/auth
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message || `Failed to fetch comments: ${response.status}`,
				);
			}

			const data = await response.json();
			console.log("Raw API response:", data);

			// Handle different response formats from your backend
			if (Array.isArray(data)) {
				return {
					comments: data,
					pagination: {
						page: 1,
						pages: 1,
						total: data.length,
						hasNext: false,
						hasPrev: false,
					},
				};
			}

			// Handle the expected format from your backend
			return {
				comments: data.comments || [],
				pagination: data.pagination || {
					page: 1,
					pages: 1,
					total: 0,
					hasNext: false,
					hasPrev: false,
				},
			};
		} catch (error) {
			console.error("Error fetching post comments:", error);
			throw error;
		}
	}

	/**
	 * Get replies for a specific comment
	 */
	async getCommentReplies(
		commentId: number,
		page: number = 1,
		perPage: number = 10,
	): Promise<CommentResponse> {
		try {
			const response = await fetch(
				`${this.baseUrl}/comments/${commentId}/replies?page=${page}&per_page=${perPage}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message ||
						`Failed to fetch comment replies: ${response.status}`,
				);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error("Error fetching comment replies:", error);
			throw error;
		}
	}

	/**
	 * Create a new comment - Fixed endpoint and format
	 */
	async createComment(
		commentData: CommentFormData,
	): Promise<SingleCommentResponse> {
		try {
			const formData = new FormData();
			formData.append("comment", commentData.comment);

			// Get CSRF token from cookie
			const csrfToken = this.getCsrfToken();
			if (csrfToken) {
				formData.append("csrf_token", csrfToken);
			}

			console.log("Creating comment with data:", {
				postId: commentData.postId,
				comment: commentData.comment,
			});

			// Use the correct endpoint that matches your backend routes
			const response = await fetch(
				`${this.baseUrl}/comments/posts/${commentData.postId}/comments`,
				{
					method: "POST",
					body: formData,
					credentials: "include",
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error("Error response:", errorData);
				throw new Error(
					errorData.message ||
						errorData.errors?.comment ||
						`Failed to create comment: ${response.status}`,
				);
			}

			const data = await response.json();
			console.log("Comment creation response:", data);

			// Transform the response to match expected format
			const comment: Comment = {
				id: data.id,
				userId: data.userId || data.user_id,
				postId: data.postId || data.post_id,
				comment: data.comment,
				parentId: data.parentId || data.parent_id || null,
				createdAt: data.createdAt || data.created_at,
				updatedAt: data.updatedAt || data.updated_at,
				commenter: data.commenter || {
					id: data.userId || data.user_id,
					username: data.username || "unknown",
					firstName: "",
					lastName: "",
					profileImage: "/default-avatar.png",
				},
				replies: [],
			};

			return {
				comment,
				success: true,
			};
		} catch (error) {
			console.error("Error creating comment:", error);
			throw error;
		}
	}

	/**
	 * Create a reply to a comment - Fixed endpoint and format
	 */
	async createReply(
		commentData: CommentFormData,
	): Promise<SingleCommentResponse> {
		try {
			const formData = new FormData();

			// Add @ mention if replying to someone
			let commentText = commentData.comment;
			if (
				commentData.replyToUsername &&
				!commentText.startsWith(`@${commentData.replyToUsername}`)
			) {
				commentText = `@${commentData.replyToUsername} ${commentText}`;
			}

			formData.append("comment", commentText);
			if (commentData.parentId) {
				formData.append("parent_id", commentData.parentId.toString());
			}

			// Get CSRF token from cookie
			const csrfToken = this.getCsrfToken();
			if (csrfToken) {
				formData.append("csrf_token", csrfToken);
			}

			console.log("Creating reply with data:", {
				postId: commentData.postId,
				parentId: commentData.parentId,
				comment: commentText,
			});

			// Use the same endpoint as regular comments - your backend handles replies
			const response = await fetch(
				`${this.baseUrl}/comments/posts/${commentData.postId}/comments`,
				{
					method: "POST",
					body: formData,
					credentials: "include",
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error("Error response:", errorData);
				throw new Error(
					errorData.message ||
						errorData.errors?.comment ||
						`Failed to create reply: ${response.status}`,
				);
			}

			const data = await response.json();
			console.log("Reply creation response:", data);

			// Transform the response to match expected format
			const comment: Comment = {
				id: data.id,
				userId: data.userId || data.user_id,
				postId: data.postId || data.post_id,
				comment: data.comment,
				parentId: data.parentId || data.parent_id || commentData.parentId,
				createdAt: data.createdAt || data.created_at,
				updatedAt: data.updatedAt || data.updated_at,
				commenter: data.commenter || {
					id: data.userId || data.user_id,
					username: data.username || "unknown",
					firstName: "",
					lastName: "",
					profileImage: "/default-avatar.png",
				},
				replies: [],
			};

			return {
				comment,
				success: true,
			};
		} catch (error) {
			console.error("Error creating reply:", error);
			throw error;
		}
	}

	/**
	 * Update an existing comment
	 */
	async updateComment(
		commentId: number,
		newText: string,
	): Promise<SingleCommentResponse> {
		try {
			const response = await fetch(
				`${this.baseUrl}/comments/${commentId}/edit`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify({ comment: newText }),
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message || `Failed to update comment: ${response.status}`,
				);
			}

			const data = await response.json();
			return {
				comment: data.comment,
				success: true,
				message: data.message,
			};
		} catch (error) {
			console.error("Error updating comment:", error);
			throw error;
		}
	}

	/**
	 * Delete a comment - Fixed endpoint
	 */
	async deleteComment(
		postId: number,
		commentId: number,
	): Promise<{ success: boolean; message: string }> {
		try {
			// Use the correct endpoint that matches your backend routes
			const response = await fetch(
				`${this.baseUrl}/comments/posts/${postId}/comments/${commentId}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message || `Failed to delete comment: ${response.status}`,
				);
			}

			const data = await response.json();
			return {
				success: true,
				message: data.message || "Comment deleted successfully",
			};
		} catch (error) {
			console.error("Error deleting comment:", error);
			throw error;
		}
	}

	/**
	 * Like/unlike a comment
	 */
	async toggleCommentLike(
		commentId: number,
	): Promise<{ success: boolean; liked: boolean }> {
		try {
			const response = await fetch(
				`${this.baseUrl}/comments/${commentId}/like`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
				},
			);

			if (!response.ok) {
				throw new Error(`Failed to toggle comment like: ${response.status}`);
			}

			const data = await response.json();
			return {
				success: true,
				liked: data.liked || false,
			};
		} catch (error) {
			console.error("Error toggling comment like:", error);
			throw error;
		}
	}

	/**
	 * Get a specific comment
	 */
	async getComment(commentId: number): Promise<Comment> {
		try {
			const response = await fetch(`${this.baseUrl}/comments/${commentId}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch comment: ${response.status}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error("Error fetching comment:", error);
			throw error;
		}
	}

	/**
	 * Get recent comments (for dashboard/admin)
	 */
	async getRecentComments(
		page: number = 1,
		perPage: number = 20,
	): Promise<CommentResponse> {
		try {
			const response = await fetch(
				`${this.baseUrl}/comments/recent?page=${page}&per_page=${perPage}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
				},
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch recent comments: ${response.status}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error("Error fetching recent comments:", error);
			throw error;
		}
	}

	/**
	 * Helper to get CSRF token from cookie
	 */
	private getCsrfToken(): string | null {
		const match = document.cookie.match(/csrf_token=([^;]+)/);
		return match ? decodeURIComponent(match[1]) : null;
	}

	/**
	 * Helper to handle API errors consistently
	 */
	private handleApiError(error: unknown): never {
		if (error && typeof error === "object" && "response" in error) {
			const apiError = error as {
				response: { status: number; data?: { message?: string } };
			};
			throw new Error(
				`API Error: ${apiError.response.status} - ${
					apiError.response.data?.message || "Unknown error"
				}`,
			);
		} else if (error && typeof error === "object" && "request" in error) {
			throw new Error("Network error: Unable to reach server");
		} else {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			throw new Error(`Error: ${errorMessage}`);
		}
	}
}

// Export singleton instance
export const commentApi = new CommentAPI();
export default commentApi;
