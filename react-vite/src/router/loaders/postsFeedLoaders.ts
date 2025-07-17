import { redirect, json, LoaderFunctionArgs } from "react-router-dom";
import type {
	FeedPost,
	Pagination,
	FeedResponse,
	PostsFeedLoaderData,
	FeedStats,
	CacheItem,
} from "../../types";

// Cache for frequently accessed data
const cache = new Map<string, CacheItem<unknown>>();
const CACHE_TTL = 60000; // 1 minute

// Helper function to check cache
function getCachedData<T>(key: string): T | null {
	const cached = cache.get(key) as CacheItem<T> | undefined;
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.data;
	}
	cache.delete(key);
	return null;
}

// Helper function to set cache
function setCachedData<T>(key: string, data: T): void {
	cache.set(key, {
		data,
		timestamp: Date.now(),
	} as CacheItem<T>);
}

// Clear cache utility
export function clearPostsFeedCache(pattern?: string): void {
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

// Check authentication helper
async function checkAuth(): Promise<boolean> {
	const authResponse = await fetch("/api/auth/", {
		headers: {
			"Cache-Control": "max-age=30",
		},
	});

	if (!authResponse.ok) {
		throw redirect("/login");
	}

	const authData = await authResponse.json();

	// Handle the response structure correctly
	if (!authData.authenticated || !authData.user) {
		throw redirect("/login");
	}

	// Return the actual user object
	return true;
}

// Fetch posts feed data
async function fetchFeedData(
	endpoint: string,
	page: number,
	perPage: number,
	cacheKey: string,
): Promise<FeedResponse> {
	// Check cache first
	const cached = getCachedData<FeedResponse>(cacheKey);
	if (cached) {
		return cached;
	}

	const response = await fetch(
		`/api/posts/${endpoint}?page=${page}&per_page=${perPage}`,
		{
			headers: {
				"Cache-Control": "max-age=60",
			},
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		console.error(`API Error for ${endpoint}:`, response.status, errorText);
		throw new Error(`HTTP ${response.status}: ${errorText}`);
	}

	const data: FeedResponse = await response.json();

	// Cache the response
	setCachedData(cacheKey, data);

	return data;
}

// Batch loader for optimal performance
async function fetchBatchFeedData(
	page: number,
	perPage: number,
): Promise<PostsFeedLoaderData> {
	const cacheKey = `batch-feed-${page}-${perPage}`;

	// Check cache first
	const cached = getCachedData<PostsFeedLoaderData>(cacheKey);
	if (cached) {
		return cached;
	}

	const response = await fetch(
		`/api/posts/feed/batch?page=${page}&per_page=${perPage}`,
		{
			headers: {
				"Cache-Control": "max-age=60",
			},
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		console.error("API Error for batch feed:", response.status, errorText);
		throw new Error(`HTTP ${response.status}: ${errorText}`);
	}

	const data = await response.json();

	// Transform the data to match our expected format
	const result: PostsFeedLoaderData = {
		allPosts: data.allPosts || [],
		similarPosts: data.similarPosts || [],
		allPostsPagination: data.allPostsPagination || {
			page: 1,
			pages: 0,
			per_page: perPage,
			total: 0,
			has_next: false,
			has_prev: false,
		},
		similarPostsPagination: data.similarPostsPagination || {
			page: 1,
			pages: 0,
			per_page: perPage,
			total: 0,
			has_next: false,
			has_prev: false,
		},
		stats: data.stats || {
			totalPosts: 0,
			similarUsers: 0,
			similarPosts: 0,
			userTags: 0,
		},
		activeTab: data.activeTab || "all",
		message: data.message,
	};

	// Cache the response
	setCachedData(cacheKey, result);

	return result;
}

// Fetch feed stats
async function fetchFeedStats(): Promise<FeedStats> {
	const cached = getCachedData<FeedStats>("feed-stats");
	if (cached) {
		return cached;
	}

	try {
		const response = await fetch("/api/posts/feed/stats", {
			headers: {
				"Cache-Control": "max-age=300", // 5 minutes
			},
		});

		if (!response.ok) {
			console.warn("Failed to fetch feed stats");
			return {
				totalPosts: 0,
				similarUsers: 0,
				similarPosts: 0,
				userTags: 0,
			};
		}

		const stats = await response.json();
		setCachedData("feed-stats", stats);
		return stats;
	} catch (error) {
		console.warn("Error fetching feed stats:", error);
		return {
			totalPosts: 0,
			similarUsers: 0,
			similarPosts: 0,
			userTags: 0,
		};
	}
}

// Main posts feed loader
export const postsFeedLoader = async ({
	request,
}: {
	request?: Request;
} = {}): Promise<PostsFeedLoaderData> => {
	try {
		// Check authentication - just verify user is logged in
		await checkAuth();

		// Parse URL parameters
		const url = request ? new URL(request.url) : new URL(window.location.href);
		const page = parseInt(url.searchParams.get("page") || "1");
		const perPage = Math.min(
			parseInt(url.searchParams.get("per_page") || "20"),
			50,
		);
		const activeTab = (url.searchParams.get("tab") || "all") as
			| "all"
			| "similar";

		// Use batch loader for better performance
		try {
			const batchData = await fetchBatchFeedData(page, perPage);

			// Override activeTab from URL if different
			batchData.activeTab = activeTab;

			return batchData;
		} catch (batchError) {
			console.warn(
				"Batch loader failed, falling back to individual requests:",
				batchError,
			);

			// Fallback to individual requests if batch fails
			const [allPostsResponse, similarPostsResponse, stats] =
				await Promise.allSettled([
					fetchFeedData(
						"feed/all",
						page,
						perPage,
						`all-posts-${page}-${perPage}`,
					),
					fetchFeedData(
						"feed/similar",
						page,
						perPage,
						`similar-posts-${page}-${perPage}`,
					),
					fetchFeedStats(),
				]);

			// Handle all posts response
			let allPosts: FeedPost[] = [];
			let allPostsPagination: Pagination = {
				page: 1,
				pages: 0,
				per_page: perPage,
				total: 0,
				has_next: false,
				has_prev: false,
			};

			if (allPostsResponse.status === "fulfilled") {
				allPosts = allPostsResponse.value.posts || [];
				allPostsPagination =
					allPostsResponse.value.pagination || allPostsPagination;
			} else {
				console.error("Error fetching all posts:", allPostsResponse.reason);
			}

			// Handle similar posts response
			let similarPosts: FeedPost[] = [];
			let similarPostsPagination: Pagination = {
				page: 1,
				pages: 0,
				per_page: perPage,
				total: 0,
				has_next: false,
				has_prev: false,
			};
			let message: string | undefined;

			if (similarPostsResponse.status === "fulfilled") {
				similarPosts = similarPostsResponse.value.posts || [];
				similarPostsPagination =
					similarPostsResponse.value.pagination || similarPostsPagination;
				message = similarPostsResponse.value.message;
			} else {
				console.error(
					"Error fetching similar posts:",
					similarPostsResponse.reason,
				);
				message = "Failed to load posts from similar users";
			}

			// Handle stats response
			let feedStats: FeedStats = {
				totalPosts: 0,
				similarUsers: 0,
				similarPosts: 0,
				userTags: 0,
			};

			if (stats.status === "fulfilled") {
				feedStats = stats.value;
			} else {
				console.warn("Error fetching feed stats:", stats.reason);
			}

			return {
				allPosts,
				similarPosts,
				allPostsPagination,
				similarPostsPagination,
				stats: feedStats,
				activeTab,
				message,
			};
		}
	} catch (error) {
		console.error("Error in postsFeedLoader:", error);

		// If auth failed, the error will have already thrown a redirect
		// Only return empty state for other errors
		if (error instanceof Response) {
			throw error; // Re-throw redirects
		}

		// Return empty state on other errors
		return {
			allPosts: [],
			similarPosts: [],
			allPostsPagination: {
				page: 1,
				pages: 0,
				per_page: 20,
				total: 0,
				has_next: false,
				has_prev: false,
			},
			similarPostsPagination: {
				page: 1,
				pages: 0,
				per_page: 20,
				total: 0,
				has_next: false,
				has_prev: false,
			},
			stats: {
				totalPosts: 0,
				similarUsers: 0,
				similarPosts: 0,
				userTags: 0,
			},
			activeTab: "all",
			error:
				error instanceof Error ? error.message : "Failed to load posts feed",
		};
	}
};

// Action handler for posts feed
export const postsFeedAction = async ({ request }: { request: Request }) => {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	try {
		switch (intent) {
			case "like-post": {
				const postId = formData.get("postId") as string;

				if (!postId) {
					return json({ error: "Post ID is required" }, { status: 400 });
				}

				const response = await fetch(`/api/posts/${postId}/like`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				});

				if (response.ok) {
					// Clear relevant caches
					clearPostsFeedCache("posts");
					clearPostsFeedCache("stats");
					clearPostsFeedCache("batch");
					return json({ success: true });
				} else {
					const errorData = await response.json();
					return json(
						{ error: errorData.message || "Failed to like post" },
						{ status: response.status },
					);
				}
			}

			case "unlike-post": {
				const postId = formData.get("postId") as string;

				if (!postId) {
					return json({ error: "Post ID is required" }, { status: 400 });
				}

				const response = await fetch(`/api/posts/${postId}/unlike`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				});

				if (response.ok) {
					// Clear relevant caches
					clearPostsFeedCache("posts");
					clearPostsFeedCache("stats");
					clearPostsFeedCache("batch");
					return json({ success: true });
				} else {
					const errorData = await response.json();
					return json(
						{ error: errorData.message || "Failed to unlike post" },
						{ status: response.status },
					);
				}
			}

			case "refresh-feed": {
				// Clear all caches to force refresh
				clearPostsFeedCache();
				return json({ success: true, message: "Feed refreshed" });
			}

			default:
				return json({ error: "Invalid action" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error in postsFeedAction:", error);
		return json({ error: "Network error. Please try again" }, { status: 500 });
	}
};

// Utility function to prefetch feed data
export const prefetchFeedData = async (
	page: number = 1,
	perPage: number = 20,
): Promise<void> => {
	try {
		await fetchBatchFeedData(page, perPage);
	} catch (error) {
		console.warn("Failed to prefetch feed data:", error);
	}
};

// Legacy support - redirect old loaders
export const similarPostsLoader = async (
	args: LoaderFunctionArgs | undefined,
) => {
	console.warn("similarPostsLoader is deprecated, use postsFeedLoader instead");
	return postsFeedLoader(args);
};

// Enhanced error boundary handler
export const postsFeedErrorBoundary = ({ error }: { error: Error }) => {
	console.error("Posts feed error boundary:", error);

	return {
		allPosts: [],
		similarPosts: [],
		allPostsPagination: {
			page: 1,
			pages: 0,
			per_page: 20,
			total: 0,
			has_next: false,
			has_prev: false,
		},
		similarPostsPagination: {
			page: 1,
			pages: 0,
			per_page: 20,
			total: 0,
			has_next: false,
			has_prev: false,
		},
		stats: {
			totalPosts: 0,
			similarUsers: 0,
			similarPosts: 0,
			userTags: 0,
		},
		activeTab: "all" as const,
		error: `Error loading posts feed: ${error.message}`,
	};
};
