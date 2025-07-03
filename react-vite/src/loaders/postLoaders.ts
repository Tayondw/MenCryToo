// Fixed postLoaders.ts with proper TypeScript types

import { redirect, json, LoaderFunctionArgs } from "react-router-dom";
import { Post } from "../types"; // Import proper types

// Cache for frequently accessed data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
	data: unknown;
	timestamp: number;
}

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

// Simplified User interface for the feed
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
function getCachedData(key: string): unknown | null {
	const entry = cache.get(key) as CacheEntry | undefined;
	if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
		return entry.data;
	}
	cache.delete(key);
	return null;
}

function setCachedData(key: string, data: unknown): void {
	cache.set(key, { data, timestamp: Date.now() });
}

// Clear cache function for when data updates
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

// FIXED: Updated similarPostsLoader with proper types
export const similarPostsLoader = async ({
	request,
}: {
	request?: Request;
} = {}): Promise<LoaderResponse> => {
	try {
		// Auth check
		const authResponse = await fetch("/api/auth/");
		if (!authResponse.ok) return redirect("/login") as never;

		const authData = await authResponse.json();
		if (authData.errors) return redirect("/login") as never;

		// Get page params
		const url = request ? new URL(request.url) : new URL(window.location.href);
		const page = parseInt(url.searchParams.get("page") || "1");
		const perPage = parseInt(url.searchParams.get("per_page") || "20");

		// Fetch posts
		const response = await fetch(
			`/api/posts/similar-feed?page=${page}&per_page=${perPage}`,
            );

		if (!response.ok) {
			const errorText = await response.text();
			console.error("API Error:", response.status, errorText);
			throw new Error(`HTTP ${response.status}`);
		}

		const data: ApiResponse = await response.json();

		// Transform for Posts.tsx compatibility with proper types
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

// Direct loader (alternative) with proper types
interface DirectLoaderResponse {
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
	error?: string;
}

export const directSimilarPostsLoader = async ({
	request,
}: {
	request?: Request;
} = {}): Promise<DirectLoaderResponse> => {
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
			throw new Error(`HTTP ${response.status}`);
		}

		const data: ApiResponse = await response.json();

		return {
			posts: data.posts || [],
			pagination: data.pagination,
			message: data.message,
		};
	} catch (error) {
		console.error("Error loading posts:", error);
		return {
			posts: [],
			pagination: {
				page: 1,
				pages: 0,
				per_page: 20,
				total: 0,
				has_next: false,
				has_prev: false,
			},
			error: `Failed to load posts: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		};
	}
};

// Export types for use in components
export type { FeedPost, FeedUser, LoaderResponse, DirectLoaderResponse };

// OPTIMIZED: Posts loader with pagination and caching
export const postsLoader = async ({
	request,
}: {
	request?: Request;
} = {}) => {
	const cacheKey = "posts-feed-page-1";
	const cached = getCachedData(cacheKey);
	if (cached) return cached as { posts: unknown[]; pagination: unknown };

	try {
		// Quick auth check with caching
		const authResponse = await fetch("/api/auth/", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "max-age=30",
			},
		});

		if (!authResponse.ok) {
			return redirect("/login");
		}

		const authData = await authResponse.json();
		if (authData.errors) {
			return redirect("/login");
		}

		// Get pagination parameters
		const url = request ? new URL(request.url) : new URL(window.location.href);
		const page = parseInt(url.searchParams.get("page") || "1");
		const perPage = Math.min(
			parseInt(url.searchParams.get("per_page") || "20"),
			50,
		);

		// Fetch posts with pagination
		const response = await fetch(
			`/api/posts/feed?page=${page}&per_page=${perPage}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "max-age=60", // Cache posts for 1 minute
				},
			},
		);

		if (!response.ok) {
			throw new Error("Failed to fetch posts");
		}

		const data = await response.json();
		setCachedData(cacheKey, data);
		return data;
	} catch (error) {
		console.error("Error loading posts:", error);
		return { posts: [], pagination: {} };
	}
};

// OPTIMIZED: Post details loader with caching
export async function postLoader({
	params,
}: {
	params: { postId: string };
}): Promise<Post> {
	const { postId } = params;
	const cacheKey = `post-${postId}`;
	const cached = getCachedData(cacheKey);
	if (cached) return cached as Post;

	try {
		const response = await fetch(`/api/posts/${postId}`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});

		if (!response.ok) {
			if (response.status === 404) {
				throw new Response("Post not found", { status: 404 });
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const postData = await response.json();
		setCachedData(cacheKey, postData);
		return postData;
	} catch (error) {
		console.error("Post loader error:", error);
		throw new Response("Failed to load post", { status: 500 });
	}
}

// Loader for single post details
export const postDetailsLoader = async ({ params }: LoaderFunctionArgs) => {
	const { postId } = params;

	// Add type safety check
	if (!postId) {
		throw new Error("Post ID is required");
	}

	try {
		const response = await fetch(`/api/posts/${postId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "max-age=120", // Cache post details for 2 minutes
			},
		});

		if (!response.ok) {
			throw new Error("Failed to fetch post details");
		}

		const postDetails = await response.json();
		return postDetails;
	} catch (error) {
		console.error("Error loading post details:", error);
		return redirect("/posts-feed");
	}
};

// OPTIMIZED: Create post action with cache clearing
export const createPostAction = async ({
	request,
	params,
}: {
	request: Request;
	params: Record<string, string | undefined>;
}) => {
	const { userId } = params;
	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	if (intent !== "create-post") {
		return { errors: { server: "Invalid action" } };
	}

	// Validate post data
	const errors: Record<string, string> = {};
	const title = formData.get("title") as string;
	const caption = formData.get("caption") as string;
	const image = formData.get("image") as File;

	if (!title || title.length < 5 || title.length > 25) {
		errors.title = "Title must be between 5 and 25 characters";
	}
	if (!caption || caption.length < 5 || caption.length > 250) {
		errors.caption = "Caption must be between 5 and 250 characters";
	}
	if (!image) {
		errors.image = "Image is required";
	}
	if (!userId) {
		errors.server = "User ID is required";
	}

	if (Object.keys(errors).length > 0) {
		return { errors };
	}

	try {
		const response = await fetch(`/api/users/${userId}/posts/create`, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json();
			return { errors: errorData };
		}

		// Clear post-related caches
		clearCache("posts");
		clearCache("profile");

		// Redirect for better performance
		return redirect("/profile");
	} catch (error) {
		console.error("Post creation error:", error);
		return { errors: { server: "Failed to create post. Please try again." } };
	}
};

// OPTIMIZED: Update post action with cache management
export const updatePostAction = async ({
	request,
	params,
}: {
	request: Request;
	params: Record<string, string | undefined>;
}) => {
	const { postId, userId } = params;
	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	if (intent !== "edit-post") {
		return { errors: { server: "Invalid action" } };
	}

	// Validate edited data
	const errors: Record<string, string> = {};
	const title = formData.get("title") as string;
	const caption = formData.get("caption") as string;

	if (!title || title.length < 5 || title.length > 25) {
		errors.title = "Title must be between 5 and 25 characters";
	}
	if (!caption || caption.length < 5 || caption.length > 250) {
		errors.caption = "Caption must be between 5 and 250 characters";
	}

	if (Object.keys(errors).length > 0) {
		return { errors };
	}

	try {
		const response = await fetch(`/api/users/${userId}/posts/${postId}`, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json();
			return { errors: errorData };
		}

		// Clear specific post and related caches
		clearCache(`post-${postId}`);
		clearCache("posts");
		clearCache("profile");

		return redirect(`/profile`);
	} catch (error) {
		console.error("Post update error:", error);
		return { errors: { server: "Failed to update post. Please try again." } };
	}
};

// Action for post operations (create, edit, delete, like)
export const postAction = async ({
	request,
	params,
}: {
	request: Request;
	params: { postId?: string };
}) => {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	try {
		switch (intent) {
			case "create-post": {
				// Use the optimized create post action
				return createPostAction({ request, params });
			}

			case "edit-post": {
				// Use the optimized update post action
				return updatePostAction({ request, params });
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
					// Clear post-related caches
					clearCache(`post-${postId}`);
					clearCache("posts");
					clearCache("profile");

					return redirect("/profile");
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
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (response.ok) {
					// Clear post cache to reflect like change
					clearCache(`post-${postId}`);
					clearCache("posts");

					// Return success without redirect for like actions
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
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (response.ok) {
					// Clear post cache to reflect unlike change
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

// Rest of the file remains the same...
// (createPostAction, updatePostAction, postAction functions)

// import { redirect, json, LoaderFunctionArgs } from "react-router-dom";
// import { Post, User } from "../types";

// // Cache for frequently accessed data
// const cache = new Map();
// const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// interface CacheEntry {
// 	data: unknown;
// 	timestamp: number;
// }

// interface PostsLoaderData {
// 	posts: Post[];
// 	pagination: {
// 		page: number;
// 		pages: number;
// 		per_page: number;
// 		total: number;
// 		has_next: boolean;
// 		has_prev: boolean;
// 	};
// 	message?: string;
// 	error?: string;
// }

// interface UserWithPosts extends User {
// 	posts: Post[];
// }

// interface ProfilesData {
// 	users_profile: UserWithPosts[];
// 	pagination?: {
// 		page: number;
// 		pages: number;
// 		per_page: number;
// 		total: number;
// 		has_next: boolean;
// 		has_prev: boolean;
// 	};
// 	totalPosts?: number;
//       message?: string;
//       error?: string;
// }

// function getCachedData(key: string): unknown | null {
// 	const entry = cache.get(key) as CacheEntry | undefined;
// 	if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
// 		return entry.data;
// 	}
// 	cache.delete(key);
// 	return null;
// }

// function setCachedData(key: string, data: unknown): void {
// 	cache.set(key, { data, timestamp: Date.now() });
// }

// // Clear cache function for when data updates
// export function clearCache(pattern?: string): void {
// 	if (pattern) {
// 		for (const key of cache.keys()) {
// 			if (key.includes(pattern)) {
// 				cache.delete(key);
// 			}
// 		}
// 	} else {
// 		cache.clear();
// 	}
// }

// // OPTIMIZED: Posts loader with pagination and caching
// export const postsLoader = async ({
// 	request,
// }: {
// 	request?: Request;
// } = {}) => {
// 	const cacheKey = "posts-feed-page-1";
// 	const cached = getCachedData(cacheKey);
// 	if (cached) return cached as { posts: unknown[]; pagination: unknown };

// 	try {
// 		// Quick auth check with caching
// 		const authResponse = await fetch("/api/auth/", {
// 			method: "GET",
// 			headers: {
// 				"Content-Type": "application/json",
// 				"Cache-Control": "max-age=30",
// 			},
// 		});

// 		if (!authResponse.ok) {
// 			return redirect("/login");
// 		}

// 		const authData = await authResponse.json();
// 		if (authData.errors) {
// 			return redirect("/login");
// 		}

// 		// Get pagination parameters
// 		const url = request ? new URL(request.url) : new URL(window.location.href);
// 		const page = parseInt(url.searchParams.get("page") || "1");
// 		const perPage = Math.min(
// 			parseInt(url.searchParams.get("per_page") || "20"),
// 			50,
// 		);

// 		// Fetch posts with pagination
// 		const response = await fetch(
// 			`/api/posts/feed?page=${page}&per_page=${perPage}`,
// 			{
// 				method: "GET",
// 				headers: {
// 					"Content-Type": "application/json",
// 					"Cache-Control": "max-age=60", // Cache posts for 1 minute
// 				},
// 			},
// 		);

// 		if (!response.ok) {
// 			throw new Error("Failed to fetch posts");
// 		}

// 		const data = await response.json();
// 		setCachedData(cacheKey, data);
// 		return data;
// 	} catch (error) {
// 		console.error("Error loading posts:", error);
// 		return { posts: [], pagination: {} };
// 	}
// };

// // OPTIMIZED: Similar posts loader with better performance
// export const similarPostsLoader = async ({
// 	request,
// }: {
// 	request?: Request;
// } = {}): Promise<ProfilesData> => {
// 	try {
// 		// Quick auth check
// 		const authResponse = await fetch("/api/auth/", {
// 			method: "GET",
// 			headers: {
// 				"Content-Type": "application/json",
// 				"Cache-Control": "max-age=30",
// 			},
// 		});

// 		if (!authResponse.ok) {
// 			return redirect("/login") as never;
// 		}

// 		const authData = await authResponse.json();
// 		if (authData.errors) {
// 			return redirect("/login") as never;
// 		}

// 		// Get pagination parameters
// 		const url = request ? new URL(request.url) : new URL(window.location.href);
// 		const page = parseInt(url.searchParams.get("page") || "1");
// 		const perPage = Math.min(
// 			parseInt(url.searchParams.get("per_page") || "20"),
// 			50,
// 		);

// 		// Call the new optimized posts feed endpoint
// 		const response = await fetch(
// 			`/api/posts/similar-feed?page=${page}&per_page=${perPage}`,
// 			{
// 				method: "GET",
// 				headers: {
// 					"Content-Type": "application/json",
// 					"Cache-Control": "max-age=60", // Cache for 1 minute
// 				},
// 			},
// 		);

// 		if (!response.ok) {
// 			const errorText = await response.text();
// 			console.error("API Error:", response.status, errorText);
// 			throw new Error(`HTTP ${response.status}: ${errorText}`);
// 		}

// 		const data: PostsLoaderData = await response.json();

// 		// Transform to match Posts.tsx expectations
// 		// Posts.tsx expects users_profile with posts, but now we have posts directly
// 		// We'll group posts by user to maintain compatibility
// 		const postsByUser: Record<number, Post[]> = {};
// 		const userInfo: Record<number, Omit<UserWithPosts, "posts">> = {};

// 		if (data.posts && Array.isArray(data.posts)) {
// 			data.posts.forEach((post: Post) => {
// 				if (post.user) {
// 					const userId = post.user.id;

// 					// Store user info
// 					if (!userInfo[userId]) {
// 						userInfo[userId] = {
// 							id: post.user.id,
// 							username: post.user.username,
// 							firstName: post.user.firstName || "",
// 							lastName: post.user.lastName || "",
// 							email: post.user.email || "",
// 							bio: post.user.bio || "",
// 							profileImage: post.user.profileImage,
// 							usersTags: [], // We don't need tags for Posts component
// 							createdAt: post.user.createdAt || "",
// 							updatedAt: post.user.updatedAt || "",
// 							// Add other required User properties with defaults
// 							hashedPassword: "",
// 						};
// 					}

// 					// Group posts by user
// 					if (!postsByUser[userId]) {
// 						postsByUser[userId] = [];
// 					}
// 					postsByUser[userId].push(post);
// 				}
// 			});
// 		}

// 		// Transform back to users_profile format for Posts.tsx compatibility
// 		const users_profile: UserWithPosts[] = Object.keys(userInfo).map(
// 			(userIdStr) => {
// 				const userId = parseInt(userIdStr);
// 				return {
// 					...userInfo[userId],
// 					posts: postsByUser[userId] || [],
// 				} as UserWithPosts;
// 			},
// 		);

// 		return {
// 			users_profile,
// 			pagination: data.pagination,
// 			totalPosts: data.posts?.length || 0,
// 			message: data.message,
// 		};
// 	} catch (error) {
// 		console.error("Error loading similar posts:", error);
// 		return {
// 			users_profile: [],
// 			pagination: {
// 				page: 1,
// 				pages: 0,
// 				per_page: 20,
// 				total: 0,
// 				has_next: false,
// 				has_prev: false,
// 			},
// 			totalPosts: 0,
// 			error: `Failed to load posts from similar users: ${
// 				error instanceof Error ? error.message : "Unknown error"
// 			}`,
// 		};
// 	}
// };

// // DIRECT posts loader that doesn't transform data
// export const directSimilarPostsLoader = async ({
// 	request,
// }: {
// 	request?: Request;
// } = {}): Promise<PostsLoaderData> => {
// 	try {
// 		const authResponse = await fetch("/api/auth/", {
// 			method: "GET",
// 			headers: {
// 				"Content-Type": "application/json",
// 				"Cache-Control": "max-age=30",
// 			},
// 		});

// 		if (!authResponse.ok) {
// 			return redirect("/login") as never;
// 		}

// 		const authData = await authResponse.json();
// 		if (authData.errors) {
// 			return redirect("/login") as never;
// 		}

// 		const url = request ? new URL(request.url) : new URL(window.location.href);
// 		const page = parseInt(url.searchParams.get("page") || "1");
// 		const perPage = Math.min(
// 			parseInt(url.searchParams.get("per_page") || "20"),
// 			50,
// 		);

// 		const response = await fetch(
// 			`/api/posts/similar-feed?page=${page}&per_page=${perPage}`,
// 			{
// 				method: "GET",
// 				headers: {
// 					"Content-Type": "application/json",
// 					"Cache-Control": "max-age=60",
// 				},
// 			},
// 		);

// 		if (!response.ok) {
// 			const errorText = await response.text();
// 			console.error("API Error:", response.status, errorText);
// 			throw new Error(`HTTP ${response.status}: ${errorText}`);
// 		}

// 		const data: PostsLoaderData = await response.json();
// 		return data;
// 	} catch (error) {
// 		console.error("Error loading similar posts:", error);
// 		return {
// 			posts: [],
// 			pagination: {
// 				page: 1,
// 				pages: 0,
// 				per_page: 20,
// 				total: 0,
// 				has_next: false,
// 				has_prev: false,
// 			},
// 			error: `Failed to load posts from similar users: ${
// 				error instanceof Error ? error.message : "Unknown error"
// 			}`,
// 		};
// 	}
// };

// // OPTIMIZED: Post details loader with caching
// export async function postLoader({
// 	params,
// }: {
// 	params: { postId: string };
// }): Promise<Post> {
// 	const { postId } = params;
// 	const cacheKey = `post-${postId}`;
// 	const cached = getCachedData(cacheKey);
// 	if (cached) return cached as Post;

// 	try {
// 		const response = await fetch(`/api/posts/${postId}`, {
// 			method: "GET",
// 			headers: { "Content-Type": "application/json" },
// 		});

// 		if (!response.ok) {
// 			if (response.status === 404) {
// 				throw new Response("Post not found", { status: 404 });
// 			}
// 			throw new Error(`HTTP error! status: ${response.status}`);
// 		}

// 		const postData = await response.json();
// 		setCachedData(cacheKey, postData);
// 		return postData;
// 	} catch (error) {
// 		console.error("Post loader error:", error);
// 		throw new Response("Failed to load post", { status: 500 });
// 	}
// }

// // Loader for single post details
// export const postDetailsLoader = async ({ params }: LoaderFunctionArgs) => {
// 	const { postId } = params;

// 	if (!postId) {
// 		throw new Error("Post ID is required");
// 	}

// 	try {
// 		const response = await fetch(`/api/posts/${postId}`, {
// 			method: "GET",
// 			headers: {
// 				"Content-Type": "application/json",
// 				"Cache-Control": "max-age=120", // Cache post details for 2 minutes
// 			},
// 		});

// 		if (!response.ok) {
// 			throw new Error("Failed to fetch post details");
// 		}

// 		const postDetails = await response.json();
// 		return postDetails;
// 	} catch (error) {
// 		console.error("Error loading post details:", error);
// 		return redirect("/posts-feed");
// 	}
// };

// // OPTIMIZED: Create post action with cache clearing
// export const createPostAction = async ({
// 	request,
// 	params,
// }: {
// 	request: Request;
// 	params: Record<string, string | undefined>;
// }) => {
// 	const { userId } = params;
// 	const formData = await request.formData();
// 	const intent = formData.get("intent") as string;

// 	if (intent !== "create-post") {
// 		return { errors: { server: "Invalid action" } };
// 	}

// 	// Validate post data
// 	const errors: Record<string, string> = {};
// 	const title = formData.get("title") as string;
// 	const caption = formData.get("caption") as string;
// 	const image = formData.get("image") as File;

// 	if (!title || title.length < 5 || title.length > 25) {
// 		errors.title = "Title must be between 5 and 25 characters";
// 	}
// 	if (!caption || caption.length < 5 || caption.length > 250) {
// 		errors.caption = "Caption must be between 5 and 250 characters";
// 	}
// 	if (!image) {
// 		errors.image = "Image is required";
// 	}
// 	if (!userId) {
// 		errors.server = "User ID is required";
// 	}

// 	if (Object.keys(errors).length > 0) {
// 		return json({ errors }, { status: 400 });
// 	}

// 	try {
// 		const response = await fetch(`/api/users/${userId}/posts/create`, {
// 			method: "POST",
// 			body: formData,
// 		});

// 		if (!response.ok) {
// 			const errorData = await response.json();
// 			return json({ errors: errorData }, { status: 400 });
// 		}

// 		// Clear post-related caches
// 		clearCache("posts");
// 		clearCache("profile");

// 		// Redirect for better performance
// 		return redirect("/posts-feed");
// 	} catch (error) {
// 		console.error("Post creation error:", error);
// 		return { errors: { server: "Failed to create post. Please try again." } };
// 	}
// };

// // OPTIMIZED: Update post action with cache management
// export const updatePostAction = async ({
// 	request,
// 	params,
// }: {
// 	request: Request;
// 	params: Record<string, string | undefined>;
// }) => {
// 	const { postId, userId } = params;
// 	const formData = await request.formData();
// 	const intent = formData.get("intent") as string;

// 	if (intent !== "edit-post") {
// 		return { errors: { server: "Invalid action" } };
// 	}

// 	// Validate edited data
// 	const errors: Record<string, string> = {};
// 	const title = formData.get("title") as string;
// 	const caption = formData.get("caption") as string;

// 	if (!title || title.length < 5 || title.length > 25) {
// 		errors.title = "Title must be between 5 and 25 characters";
// 	}
// 	if (!caption || caption.length < 5 || caption.length > 250) {
// 		errors.caption = "Caption must be between 5 and 250 characters";
// 	}
// 	if (!postId || !userId) {
// 		return json({ error: "Post ID and User ID are required" }, { status: 400 });
// 	}

// 	if (Object.keys(errors).length > 0) {
// 		return json({ errors }, { status: 400 });
// 	}

// 	try {
// 		const response = await fetch(`/api/users/${userId}/posts/${postId}`, {
// 			method: "POST",
// 			body: formData,
// 		});

// 		if (!response.ok) {
// 			const errorData = await response.json();
// 			return json({ errors: errorData }, { status: 400 });
// 		}

// 		// Clear specific post and related caches
// 		clearCache(`post-${postId}`);
// 		clearCache("posts");
// 		clearCache("profile");

// 		return redirect(`/profile`);
// 	} catch (error) {
// 		console.error("Post update error:", error);
// 		return { errors: { server: "Failed to update post. Please try again." } };
// 	}
// };

// // Action for post operations (create, edit, delete, like)
// export const postAction = async ({
// 	request,
// 	params,
// }: {
// 	request: Request;
// 	params: { postId?: string };
// }) => {
// 	const formData = await request.formData();
// 	const intent = formData.get("intent") as string;

// 	try {
// 		switch (intent) {
// 			case "create-post": {
// 				// Use the optimized create post action
// 				return createPostAction({ request, params });
// 			}

// 			case "edit-post": {
// 				// Use the optimized update post action
// 				return updatePostAction({ request, params });
// 			}

// 			case "delete-post": {
// 				const postId = (formData.get("postId") as string) || params.postId;

// 				if (!postId) {
// 					return json({ error: "Post ID is required" }, { status: 400 });
// 				}

// 				const response = await fetch(`/api/posts/${postId}/delete`, {
// 					method: "DELETE",
// 				});

// 				if (response.ok) {
// 					// Clear post-related caches
// 					clearCache(`post-${postId}`);
// 					clearCache("posts");
// 					clearCache("profile");

// 					return redirect("/profile");
// 				} else {
// 					return json({ error: "Failed to delete post" }, { status: 500 });
// 				}
// 			}

// 			case "like-post": {
// 				const postId = (formData.get("postId") as string) || params.postId;

// 				if (!postId) {
// 					return json({ error: "Post ID is required" }, { status: 400 });
// 				}

// 				const response = await fetch(`/api/posts/${postId}/like`, {
// 					method: "POST",
// 					headers: {
// 						"Content-Type": "application/json",
// 					},
// 				});

// 				if (response.ok) {
// 					// Clear post cache to reflect like change
// 					clearCache(`post-${postId}`);
// 					clearCache("posts");

// 					// Return success without redirect for like actions
// 					return json({ success: true });
// 				} else {
// 					return json({ error: "Failed to like post" }, { status: 500 });
// 				}
// 			}

// 			case "unlike-post": {
// 				const postId = (formData.get("postId") as string) || params.postId;

// 				if (!postId) {
// 					return json({ error: "Post ID is required" }, { status: 400 });
// 				}

// 				const response = await fetch(`/api/posts/${postId}/unlike`, {
// 					method: "POST",
// 					headers: {
// 						"Content-Type": "application/json",
// 					},
// 				});

// 				if (response.ok) {
// 					// Clear post cache to reflect unlike change
// 					clearCache(`post-${postId}`);
// 					clearCache("posts");

// 					return json({ success: true });
// 				} else {
// 					return json({ error: "Failed to unlike post" }, { status: 500 });
// 				}
// 			}

// 			default:
// 				return json({ error: "Invalid action" }, { status: 400 });
// 		}
// 	} catch (error) {
// 		console.error("Error performing post action:", error);
// 		return json({ error: "Network error. Please try again" }, { status: 500 });
// 	}
// };

// // Action for post operations (create, edit, delete, like)
// export const postAction = async ({
// 	request,
// 	params,
// }: {
// 	request: Request;
// 	params: { postId?: string };
// }) => {
// 	const formData = await request.formData();
// 	const intent = formData.get("intent") as string;

// 	try {
// 		switch (intent) {
// 			case "create-post": {
// 				// Validate post data
// 				const errors: Record<string, string> = {};
// 				const title = formData.get("title") as string;
// 				const caption = formData.get("caption") as string;
// 				const image = formData.get("image") as File;
// 				const userId = formData.get("userId") as string;

// 				if (!title || title.length < 5 || title.length > 25) {
// 					errors.title = "Title must be between 5 and 25 characters";
// 				}
// 				if (!caption || caption.length < 5 || caption.length > 250) {
// 					errors.caption = "Caption must be between 5 and 250 characters";
// 				}
// 				if (!image) {
// 					errors.image = "Image is required";
// 				}
// 				if (!userId) {
// 					errors.server = "User ID is required";
// 				}

// 				if (Object.keys(errors).length > 0) {
// 					return json({ errors }, { status: 400 });
// 				}

// 				const response = await fetch(`/api/users/${userId}/posts/create`, {
// 					method: "POST",
// 					body: formData,
// 				});

// 				if (response.ok) {
// 					return redirect("/posts-feed");
// 				} else {
// 					const errorData = await response.json();
// 					return json({ errors: errorData }, { status: 400 });
// 				}
// 			}

// 			case "edit-post": {
// 				const postId = formData.get("postId") as string;
// 				const userId = formData.get("userId") as string;

// 				if (!postId || !userId) {
// 					return json(
// 						{ error: "Post ID and User ID are required" },
// 						{ status: 400 },
// 					);
// 				}

// 				// Validate edited data
// 				const errors: Record<string, string> = {};
// 				const title = formData.get("title") as string;
// 				const caption = formData.get("caption") as string;

// 				if (!title || title.length < 5 || title.length > 25) {
// 					errors.title = "Title must be between 5 and 25 characters";
// 				}
// 				if (!caption || caption.length < 5 || caption.length > 250) {
// 					errors.caption = "Caption must be between 5 and 250 characters";
// 				}

// 				if (Object.keys(errors).length > 0) {
// 					return json({ errors }, { status: 400 });
// 				}

// 				const response = await fetch(`/api/users/${userId}/posts/${postId}`, {
// 					method: "POST",
// 					body: formData,
// 				});

// 				if (response.ok) {
// 					return redirect("/profile");
// 				} else {
// 					const errorData = await response.json();
// 					return json({ errors: errorData }, { status: 400 });
// 				}
// 			}

// 			case "delete-post": {
// 				const postId = (formData.get("postId") as string) || params.postId;

// 				if (!postId) {
// 					return json({ error: "Post ID is required" }, { status: 400 });
// 				}

// 				const response = await fetch(`/api/posts/${postId}/delete`, {
// 					method: "DELETE",
// 				});

// 				if (response.ok) {
// 					return redirect("/profile");
// 				} else {
// 					return json({ error: "Failed to delete post" }, { status: 500 });
// 				}
// 			}

// 			case "like-post": {
// 				const postId = (formData.get("postId") as string) || params.postId;

// 				if (!postId) {
// 					return json({ error: "Post ID is required" }, { status: 400 });
// 				}

// 				const response = await fetch(`/api/posts/${postId}/like`, {
// 					method: "POST",
// 					headers: {
// 						"Content-Type": "application/json",
// 					},
// 				});

// 				if (response.ok) {
// 					// Return success without redirect for like actions
// 					return json({ success: true });
// 				} else {
// 					return json({ error: "Failed to like post" }, { status: 500 });
// 				}
// 			}

// 			case "unlike-post": {
// 				const postId = (formData.get("postId") as string) || params.postId;

// 				if (!postId) {
// 					return json({ error: "Post ID is required" }, { status: 400 });
// 				}

// 				const response = await fetch(`/api/posts/${postId}/unlike`, {
// 					method: "POST",
// 					headers: {
// 						"Content-Type": "application/json",
// 					},
// 				});

// 				if (response.ok) {
// 					return json({ success: true });
// 				} else {
// 					return json({ error: "Failed to unlike post" }, { status: 500 });
// 				}
// 			}

// 			default:
// 				return json({ error: "Invalid action" }, { status: 400 });
// 		}
// 	} catch (error) {
// 		console.error("Error performing post action:", error);
// 		return json({ error: "Network error. Please try again" }, { status: 500 });
// 	}
// };
