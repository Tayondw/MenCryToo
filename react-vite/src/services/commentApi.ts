import type {
	Comment,
	CommentResponse,
	SingleCommentResponse,
	CommentFormData,
	LegacyCommentData,
} from "../types/comments";
import {
	transformLegacyComment,
} from "../utils/commentUtils";

class CommentAPI {
	private baseUrl = "/api";

	/**
	 * Get comments for a specific post with enhanced user data
	 */
	async getPostComments(
		postId: number,
		page: number = 1,
		perPage: number = 20,
	): Promise<CommentResponse> {
		try {
			const response = await fetch(
				`${this.baseUrl}/comments/posts/${postId}/comments?page=${page}&per_page=${perPage}&include_replies=true`,
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
					errorData.message || `Failed to fetch comments: ${response.status}`,
				);
			}

			const data = await response.json();
			console.log("Raw API response:", data);

			// Transform API response to ensure consistent Comment format
			const transformedComments = this.transformApiComments(
				data.comments || [],
			);

			return {
				comments: transformedComments,
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
	 * Create a new comment with enhanced response handling
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

			// Transform the response to ensure consistent format
			const comment = this.transformApiComment(data);

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
	 * Create a reply to a comment with enhanced handling
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

			// Transform the response to ensure consistent format
			const comment = this.transformApiComment(data);

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
	 * Transform API comment data to consistent Comment format
	 */
	private transformApiComment(apiData: any): Comment {
		// If it's already in the new format with enhanced commenter data
		if (apiData.commenter && typeof apiData.commenter === "object") {
			return {
				id: apiData.id,
				userId: apiData.userId || apiData.user_id,
				postId: apiData.postId || apiData.post_id,
				comment: apiData.comment,
				parentId: apiData.parentId ?? apiData.parent_id ?? null,
				createdAt: apiData.createdAt || apiData.created_at,
				updatedAt: apiData.updatedAt || apiData.updated_at,
				commenter: {
					id: apiData.commenter.id,
					username: apiData.commenter.username,
					firstName: apiData.commenter.firstName || "",
					lastName: apiData.commenter.lastName || "",
					profileImage: apiData.commenter.profileImage || "/default-avatar.png",
				},
				replies: [],
			};
		}

		// Legacy format transformation
		return transformLegacyComment(apiData as LegacyCommentData);
	}

	/**
	 * Transform array of API comments
	 */
	private transformApiComments(apiComments: any[]): Comment[] {
		return apiComments.map((comment) => this.transformApiComment(comment));
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
			const comment = this.transformApiComment(data.comment);

			return {
				comment,
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
			const transformedComments = this.transformApiComments(data.replies || []);

			return {
				comments: transformedComments,
				pagination: data.pagination || {
					page: 1,
					pages: 1,
					total: 0,
					hasNext: false,
					hasPrev: false,
				},
			};
		} catch (error) {
			console.error("Error fetching comment replies:", error);
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
			return this.transformApiComment(data);
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
			const transformedComments = this.transformApiComments(
				data.comments || [],
			);

			return {
				comments: transformedComments,
				pagination: data.pagination || {
					page: 1,
					pages: 1,
					total: 0,
					hasNext: false,
					hasPrev: false,
				},
			};
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
}

// Export singleton instance
export const commentApi = new CommentAPI();
export default commentApi;
