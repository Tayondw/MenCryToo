import type {
	Comment,
	CommentResponse,
	SingleCommentResponse,
	CommentFormData,
} from "../types/comments";

class CommentAPI {
	private baseUrl = "/api";

	/**
	 * Get comments for a specific post
	 */
	async getPostComments(
		postId: number,
		page: number = 1,
		perPage: number = 20,
	): Promise<CommentResponse> {
		try {
			const response = await fetch(
				`${this.baseUrl}/posts/${postId}/comments?page=${page}&per_page=${perPage}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch comments: ${response.status}`);
			}

			const data = await response.json();

			// Handle different response formats
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

			return data;
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
				},
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch comment replies: ${response.status}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error("Error fetching comment replies:", error);
			throw error;
		}
	}

	/**
	 * Create a new comment
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

			const response = await fetch(
				`${this.baseUrl}/posts/${commentData.postId}/comments`,
				{
					method: "POST",
					body: formData,
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.message || `Failed to create comment: ${response.status}`,
				);
			}

			const data = await response.json();
			return {
				comment: data,
				success: true,
			};
		} catch (error) {
			console.error("Error creating comment:", error);
			throw error;
		}
	}

	/**
	 * Create a reply to a comment
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

			const response = await fetch(
				`${this.baseUrl}/posts/${commentData.postId}/comments`,
				{
					method: "POST",
					body: formData,
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.message || `Failed to create reply: ${response.status}`,
				);
			}

			const data = await response.json();
			return {
				comment: data,
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
					body: JSON.stringify({ comment: newText }),
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
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
	 * Delete a comment
	 */
	async deleteComment(
		postId: number,
		commentId: number,
	): Promise<{ success: boolean; message: string }> {
		try {
			const response = await fetch(
				`${this.baseUrl}/posts/${postId}/comments/${commentId}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
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
