import { redirect, json, LoaderFunctionArgs } from "react-router-dom";

// Cache for frequently accessed data
const cache = new Map();

interface PostUser {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	profileImage: string;
}

interface FeedPost {
	id: number;
	title: string;
	caption: string;
	creator: number;
	image: string;
	likes: number;
	comments: number;
	createdAt: string;
	updatedAt: string;
	user: PostUser;
}

interface FeedUser {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	bio: string;
	profileImage: string;
	usersTags: Array<{ id: number; name: string }>;
	createdAt: string;
	updatedAt: string;
	posts: FeedPost[];
}

interface ApiResponse {
	posts: FeedPost[];
	pagination: {
		page: number;
		pages: number;
		per_page: number;
		total: number;
		has_next: boolean;
		has_prev: boolean;
	};
	message?: string;
}

interface LoaderResponse {
	users_profile: FeedUser[];
	pagination: {
		page: number;
		pages: number;
		per_page: number;
		total: number;
		has_next: boolean;
		has_prev: boolean;
	};
	totalPosts: number;
	message?: string;
	error?: string;
}

export function clearCache(pattern?: string): void {
	if (pattern) {
		for (const key of cache.keys()) {
			if (key.includes(pattern)) {
				cache.delete(key);
			}
		}
	} else {
		cache.clear();
	}
}

export const similarPostsLoader = async ({
	request,
}: {
	request?: Request;
} = {}): Promise<LoaderResponse> => {
	try {
		const authResponse = await fetch("/api/auth/");
		if (!authResponse.ok) return redirect("/login") as never;

		const authData = await authResponse.json();
		if (authData.errors) return redirect("/login") as never;

		const url = request ? new URL(request.url) : new URL(window.location.href);
		const page = parseInt(url.searchParams.get("page") || "1");
		const perPage = parseInt(url.searchParams.get("per_page") || "20");

		const response = await fetch(
			`/api/posts/similar-feed?page=${page}&per_page=${perPage}`,
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("API Error:", response.status, errorText);
			throw new Error(`HTTP ${response.status}`);
		}

		const data: ApiResponse = await response.json();

		const postsByUser: Record<number, FeedPost[]> = {};
		const userInfo: Record<number, Omit<FeedUser, "posts">> = {};

		if (data.posts && Array.isArray(data.posts)) {
			data.posts.forEach((post: FeedPost) => {
				if (post.user) {
					const userId = post.user.id;

					if (!userInfo[userId]) {
						userInfo[userId] = {
							id: post.user.id,
							username: post.user.username,
							firstName: post.user.firstName || "",
							lastName: post.user.lastName || "",
							email: "",
							bio: "",
							profileImage: post.user.profileImage,
							usersTags: [],
							createdAt: "",
							updatedAt: "",
						};
					}

					if (!postsByUser[userId]) {
						postsByUser[userId] = [];
					}
					postsByUser[userId].push(post);
				}
			});
		}

		const users_profile: FeedUser[] = Object.keys(userInfo).map((userIdStr) => {
			const userId = parseInt(userIdStr);
			return {
				...userInfo[userId],
				posts: postsByUser[userId] || [],
			};
		});

		return {
			users_profile,
			pagination: data.pagination,
			totalPosts: data.posts?.length || 0,
			message: data.message,
		};
	} catch (error) {
		console.error("Error loading posts:", error);
		return {
			users_profile: [],
			pagination: {
				page: 1,
				pages: 0,
				per_page: 20,
				total: 0,
				has_next: false,
				has_prev: false,
			},
			totalPosts: 0,
			error: `Failed to load posts: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		};
	}
};

export const postDetailsLoader = async ({ params }: LoaderFunctionArgs) => {
	const { postId } = params;

	if (!postId) {
		throw new Error("Post ID is required");
	}

	try {
		const response = await fetch(`/api/posts/${postId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "max-age=120",
			},
		});

		if (!response.ok) {
			throw new Error("Failed to fetch post details");
		}

		const postDetails = await response.json();
		return postDetails;
	} catch (error) {
		console.error("Error loading post details:", error);
		return redirect("/similar-feed");
	}
};

// MAIN ACTION HANDLER - reads FormData only once
export const postAction = async ({
	request,
	params,
}: {
	request: Request;
	params: { postId?: string };
}) => {
	// READ FORMDATA ONLY ONCE at the very beginning
	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	console.log("Post action intent:", intent);

	try {
		switch (intent) {
			case "create-post": {
				const userId = formData.get("userId") as string;
				const title = formData.get("title") as string;
				const caption = formData.get("caption") as string;
				const image = formData.get("image") as File;

				// Validate data
				const errors: Record<string, string> = {};

				if (!title || title.length < 5 || title.length > 25) {
					errors.title = "Title must be between 5 and 25 characters";
				}
				if (!caption || caption.length < 50 || caption.length > 500) {
					errors.caption = "Caption must be between 50 and 500 characters";
				}
				if (!image || image.size === 0) {
					errors.image = "Image is required";
				}
				if (!userId) {
					errors.server = "User ID is required";
				}

				if (Object.keys(errors).length > 0) {
					return json({ errors }, { status: 400 });
				}

				// Create new FormData for API call
				const apiFormData = new FormData();
				apiFormData.append("title", title);
				apiFormData.append("caption", caption);
				apiFormData.append("image", image);

				const response = await fetch(`/api/users/${userId}/posts/create`, {
					method: "POST",
					body: apiFormData,
				});

				if (!response.ok) {
					const errorData = await response.json();
					return json({ errors: errorData }, { status: 400 });
				}

				clearCache("posts");
				clearCache("profile");
				return redirect("/profile");
			}

			case "edit-post": {
				const postId = (formData.get("postId") as string) || params.postId;
				const userId = formData.get("userId") as string;
				const title = formData.get("title") as string;
				const caption = formData.get("caption") as string;
				const image = formData.get("image") as File;

				// Validate data
				const errors: Record<string, string> = {};

				if (!title || title.length < 5 || title.length > 25) {
					errors.title = "Title must be between 5 and 25 characters";
				}
				if (!caption || caption.length < 50 || caption.length > 500) {
					errors.caption = "Caption must be between 50 and 500 characters";
				}

				if (Object.keys(errors).length > 0) {
					return json({ errors }, { status: 400 });
				}

				// Create new FormData for API call
				const apiFormData = new FormData();
				apiFormData.append("title", title);
				apiFormData.append("caption", caption);
				if (image && image.size > 0) {
					apiFormData.append("image", image);
				}

				const response = await fetch(`/api/users/${userId}/posts/${postId}`, {
					method: "POST",
					body: apiFormData,
				});

				if (!response.ok) {
					const errorData = await response.json();
					return json({ errors: errorData }, { status: 400 });
				}

				clearCache(`post-${postId}`);
				clearCache("posts");
				clearCache("profile");
				return window.location.href = "/profile";
			}

			case "delete-post": {
				const postId = (formData.get("postId") as string) || params.postId;

				if (!postId) {
					return json({ error: "Post ID is required" }, { status: 400 });
				}

				const response = await fetch(`/api/posts/${postId}/delete`, {
					method: "DELETE",
				});

				if (response.ok) {
					clearCache(`post-${postId}`);
					clearCache("posts");
					clearCache("profile");
					return window.location.href = "/profile";
				} else {
					return json({ error: "Failed to delete post" }, { status: 500 });
				}
			}

			case "like-post": {
				const postId = (formData.get("postId") as string) || params.postId;

				if (!postId) {
					return json({ error: "Post ID is required" }, { status: 400 });
				}

				const response = await fetch(`/api/posts/${postId}/like`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				});

				if (response.ok) {
					clearCache(`post-${postId}`);
					clearCache("posts");
					return json({ success: true });
				} else {
					return json({ error: "Failed to like post" }, { status: 500 });
				}
			}

			case "unlike-post": {
				const postId = (formData.get("postId") as string) || params.postId;

				if (!postId) {
					return json({ error: "Post ID is required" }, { status: 400 });
				}

				const response = await fetch(`/api/posts/${postId}/unlike`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				});

				if (response.ok) {
					clearCache(`post-${postId}`);
					clearCache("posts");
					return json({ success: true });
				} else {
					return json({ error: "Failed to unlike post" }, { status: 500 });
				}
			}

			default:
				return json({ error: "Invalid action" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error performing post action:", error);
		return json({ error: "Network error. Please try again" }, { status: 500 });
	}
};

// Export types
export type { FeedPost, FeedUser, LoaderResponse };