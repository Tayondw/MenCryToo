import { json } from "react-router-dom";
import type { CacheItem } from "../../../types";

// Cache for frequently accessed data
const cache = new Map<string, CacheItem<unknown>>();

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
