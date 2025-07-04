import { redirect } from "react-router-dom";
import { User, Tag, ProfilesData } from "../types";

// Cache for frequently accessed data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
	data: unknown;
	timestamp: number;
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

interface ProfileFeedResponse {
	users_profile: User[];
	pagination?: {
		page: number;
		pages: number;
		per_page: number;
		total: number;
		has_next: boolean;
		has_prev: boolean;
	};
}

// OPTIMIZED: Profile feed loader with pagination and caching
export async function profileFeedLoader(): Promise<ProfilesData> {
	const cacheKey = "profile-feed-page-1";
	const cached = getCachedData(cacheKey);
	if (cached) return cached as ProfilesData;

	try {
		// Use pagination and limit data
		const response = await fetch("/api/users/profile-feed?page=1&per_page=20", {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		setCachedData(cacheKey, data);
		return data;
	} catch (error) {
		console.error("Profile feed loader error:", error);
		throw new Response("Failed to load profile feed", { status: 500 });
	}
}

// Optimized loader for the profile feed page with pagination
export const profileFeedLoaderDetailed = async ({
	request,
}: {
	request?: Request;
} = {}): Promise<ProfileFeedResponse | Response> => {
	try {
		// Check authentication first (cached)
		const authResponse = await fetch("/api/auth/", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "max-age=30", // Cache auth for 30 seconds
			},
		});

		if (!authResponse.ok) {
			return redirect("/login");
		}

		const authData = await authResponse.json();
		if (authData.errors) {
			return redirect("/login");
		}

		// Get pagination parameters from URL
		const url = request ? new URL(request.url) : new URL(window.location.href);
		const page = parseInt(url.searchParams.get("page") || "1");
		const perPage = Math.min(
			parseInt(url.searchParams.get("per_page") || "20"),
			50,
		);

		// Fetch profile feed with pagination
		const profileFeedUrl = `/api/users/profile-feed?page=${page}&per_page=${perPage}`;
		const response = await fetch(profileFeedUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "max-age=60", // Cache for 1 minute
			},
		});

		if (!response.ok) {
			throw new Error("Failed to fetch profile feed");
		}

		const data = await response.json();

		// Normalize response structure
		if (data.users_profile) {
			return data;
		} else if (Array.isArray(data)) {
			return { users_profile: data };
		} else {
			return { users_profile: [] };
		}
	} catch (error) {
		console.error("Error loading profile feed:", error);
		return { users_profile: [] };
	}
};

// Fallback loader with better error handling
export const profileFeedLoaderFallback = async ({
	request,
}: {
	request?: Request;
} = {}): Promise<ProfileFeedResponse | Response> => {
	try {
		// Quick auth check
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

		// Get pagination params
		const url = request ? new URL(request.url) : new URL(window.location.href);
		const page = parseInt(url.searchParams.get("page") || "1");
		const perPage = Math.min(
			parseInt(url.searchParams.get("per_page") || "20"),
			50,
		);

		// Try specific profile feed endpoint first
		let response = await fetch(
			`/api/users/profile-feed?page=${page}&per_page=${perPage}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "max-age=60",
				},
			},
		);

		// Fallback to general users endpoint if needed
		if (!response.ok) {
			response = await fetch(`/api/users/?page=${page}&per_page=${perPage}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "max-age=60",
				},
			});
		}

		if (!response.ok) {
			throw new Error("Failed to fetch users");
		}

		const data = await response.json();

		// Normalize response structure
		if (data.users_profile) {
			return data;
		} else if (data.users) {
			return {
				users_profile: data.users,
				pagination: data.pagination,
			};
		} else if (Array.isArray(data)) {
			return { users_profile: data };
		} else {
			return { users_profile: [] };
		}
	} catch (error) {
		console.error("Error loading profile feed:", error);
		return { users_profile: [] };
	}
};

// Optimized loader for similar users with better performance
export const similarUsersLoader = async ({
	request,
}: {
	request?: Request;
} = {}): Promise<ProfileFeedResponse | Response> => {
	try {
		// Get current user for tag comparison
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

		const currentUser = await authResponse.json();
		if (currentUser.errors) {
			return redirect("/login");
		}

		// Get pagination params
		const url = request ? new URL(request.url) : new URL(window.location.href);
		const page = parseInt(url.searchParams.get("page") || "1");
		const perPage = Math.min(
			parseInt(url.searchParams.get("per_page") || "20"),
			50,
		);

		// Fetch users with similar tags
		const userTags = currentUser.usersTags?.map((tag: Tag) => tag.name) || [];
		const tagsQuery = userTags.length > 0 ? `&tags=${userTags.join(",")}` : "";

		const response = await fetch(
			`/api/users/profile-feed?page=${page}&per_page=${perPage}&similar=true${tagsQuery}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "max-age=120", // Cache similar users for 2 minutes
				},
			},
		);

		if (!response.ok) {
			// Fallback to regular profile feed
			return profileFeedLoaderDetailed({ request });
		}

		const data = await response.json();

		// Filter out current user and return similar users
		if (data.users_profile) {
			const similarUsers = data.users_profile.filter(
				(user: User) => user.id !== currentUser.id,
			);
			return {
				users_profile: similarUsers,
				pagination: data.pagination,
			};
		}

		return { users_profile: [] };
	} catch (error) {
		console.error("Error loading similar users:", error);
		return { users_profile: [] };
	}
};

// import { redirect } from "react-router-dom";
// import { User, Tag } from "../types";

// interface ProfileFeedResponse {
// 	users_profile: User[];
// 	pagination?: {
// 		page: number;
// 		pages: number;
// 		per_page: number;
// 		total: number;
// 		has_next: boolean;
// 		has_prev: boolean;
// 	};
// }

// // Optimized loader for the profile feed page with pagination
// export const profileFeedLoader = async ({
// 	request,
// }: {
// 	request?: Request;
// } = {}): Promise<ProfileFeedResponse | Response> => {
// 	try {
// 		// Check authentication first (cached)
// 		const authResponse = await fetch("/api/auth/", {
// 			headers: {
// 				"Cache-Control": "max-age=30", // Cache auth for 30 seconds
// 			},
// 		});

// 		if (!authResponse.ok) {
// 			return redirect("/login");
// 		}

// 		const authData = await authResponse.json();
// 		if (authData.errors) {
// 			return redirect("/login");
// 		}

// 		// Get pagination parameters from URL
// 		const url = request ? new URL(request.url) : new URL(window.location.href);
// 		const page = parseInt(url.searchParams.get("page") || "1");
// 		const perPage = Math.min(
// 			parseInt(url.searchParams.get("per_page") || "20"),
// 			50,
// 		);

// 		// Fetch profile feed with pagination
// 		const profileFeedUrl = `/api/users/profile-feed?page=${page}&per_page=${perPage}`;
// 		const response = await fetch(profileFeedUrl, {
// 			headers: {
// 				"Cache-Control": "max-age=60", // Cache for 1 minute
// 			},
// 		});

// 		if (!response.ok) {
// 			throw new Error("Failed to fetch profile feed");
// 		}

// 		const data = await response.json();

// 		// Normalize response structure
// 		if (data.users_profile) {
// 			return data;
// 		} else if (Array.isArray(data)) {
// 			return { users_profile: data };
// 		} else {
// 			return { users_profile: [] };
// 		}
// 	} catch (error) {
// 		console.error("Error loading profile feed:", error);
// 		return { users_profile: [] };
// 	}
// };

// // Fallback loader with better error handling
// export const profileFeedLoaderFallback = async ({
// 	request,
// }: {
// 	request?: Request;
// } = {}): Promise<ProfileFeedResponse | Response> => {
// 	try {
// 		// Quick auth check
// 		const authResponse = await fetch("/api/auth/", {
// 			headers: {
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

// 		// Get pagination params
// 		const url = request ? new URL(request.url) : new URL(window.location.href);
// 		const page = parseInt(url.searchParams.get("page") || "1");
// 		const perPage = Math.min(
// 			parseInt(url.searchParams.get("per_page") || "20"),
// 			50,
// 		);

// 		// Try specific profile feed endpoint first
// 		let response = await fetch(
// 			`/api/users/profile-feed?page=${page}&per_page=${perPage}`,
// 			{
// 				headers: {
// 					"Cache-Control": "max-age=60",
// 				},
// 			},
// 		);

// 		// Fallback to general users endpoint if needed
// 		if (!response.ok) {
// 			response = await fetch(`/api/users/?page=${page}&per_page=${perPage}`, {
// 				headers: {
// 					"Cache-Control": "max-age=60",
// 				},
// 			});
// 		}

// 		if (!response.ok) {
// 			throw new Error("Failed to fetch users");
// 		}

// 		const data = await response.json();

// 		// Normalize response structure
// 		if (data.users_profile) {
// 			return data;
// 		} else if (data.users) {
// 			return {
// 				users_profile: data.users,
// 				pagination: data.pagination,
// 			};
// 		} else if (Array.isArray(data)) {
// 			return { users_profile: data };
// 		} else {
// 			return { users_profile: [] };
// 		}
// 	} catch (error) {
// 		console.error("Error loading profile feed:", error);
// 		return { users_profile: [] };
// 	}
// };

// // Optimized loader for similar users with better performance
// export const similarUsersLoader = async ({
// 	request,
// }: {
// 	request?: Request;
// } = {}): Promise<ProfileFeedResponse | Response> => {
// 	try {
// 		// Get current user for tag comparison
// 		const authResponse = await fetch("/api/auth/", {
// 			headers: {
// 				"Cache-Control": "max-age=30",
// 			},
// 		});

// 		if (!authResponse.ok) {
// 			return redirect("/login");
// 		}

// 		const currentUser = await authResponse.json();
// 		if (currentUser.errors) {
// 			return redirect("/login");
// 		}

// 		// Get pagination params
// 		const url = request ? new URL(request.url) : new URL(window.location.href);
// 		const page = parseInt(url.searchParams.get("page") || "1");
// 		const perPage = Math.min(
// 			parseInt(url.searchParams.get("per_page") || "20"),
// 			50,
// 		);

// 		// Fetch users with similar tags
// 		const userTags = currentUser.usersTags?.map((tag: Tag) => tag.name) || [];
// 		const tagsQuery = userTags.length > 0 ? `&tags=${userTags.join(",")}` : "";

// 		const response = await fetch(
// 			`/api/users/profile-feed?page=${page}&per_page=${perPage}&similar=true${tagsQuery}`,
// 			{
// 				headers: {
// 					"Cache-Control": "max-age=120", // Cache similar users for 2 minutes
// 				},
// 			},
// 		);

// 		if (!response.ok) {
// 			// Fallback to regular profile feed
// 			return profileFeedLoader({ request });
// 		}

// 		const data = await response.json();

// 		// Filter out current user and return similar users
// 		if (data.users_profile) {
// 			const similarUsers = data.users_profile.filter(
// 				(user: User) => user.id !== currentUser.id,
// 			);
// 			return {
// 				users_profile: similarUsers,
// 				pagination: data.pagination,
// 			};
// 		}

// 		return { users_profile: [] };
// 	} catch (error) {
// 		console.error("Error loading similar users:", error);
// 		return { users_profile: [] };
// 	}
// };

// import { redirect } from "react-router-dom";
// import { User } from "../types";

// interface ProfileFeedResponse {
// 	users_profile: User[];
// }

// // Loader for the profile feed page
// export const profileFeedLoader = async (): Promise<
// 	ProfileFeedResponse | Response
// > => {
// 	try {
// 		// First check if user is authenticated
// 		const authResponse = await fetch("/api/auth/");
// 		if (!authResponse.ok) {
// 			return redirect("/login");
// 		}

// 		const authData = await authResponse.json();
// 		if (authData.errors) {
// 			return redirect("/login");
// 		}

// 		// Fetch all user profiles for the feed
// 		const response = await fetch("/api/users/profile-feed");

// 		if (!response.ok) {
// 			throw new Error("Failed to fetch profile feed");
// 		}

// 		const data = await response.json();
// 		return data;
// 	} catch (error) {
// 		console.error("Error loading profile feed:", error);
// 		// Return empty data instead of redirecting on fetch error
// 		return { users_profile: [] };
// 	}
// };

// // Alternative loader that fetches all users if the specific endpoint doesn't exist
// export const profileFeedLoaderFallback = async (): Promise<
// 	ProfileFeedResponse | Response
// > => {
// 	try {
// 		// First check if user is authenticated
// 		const authResponse = await fetch("/api/auth/");
// 		if (!authResponse.ok) {
// 			return redirect("/login");
// 		}

// 		const authData = await authResponse.json();
// 		if (authData.errors) {
// 			return redirect("/login");
// 		}

// 		// Try the specific profile feed endpoint first
// 		let response = await fetch("/api/users/profile-feed");

// 		// If that fails, try the general users endpoint
// 		if (!response.ok) {
// 			response = await fetch("/api/users/");
// 		}

// 		if (!response.ok) {
// 			throw new Error("Failed to fetch users");
// 		}

// 		const data = await response.json();

// 		// Normalize the response structure
// 		if (Array.isArray(data)) {
// 			return { users_profile: data };
// 		} else if (data.users_profile) {
// 			return data;
// 		} else if (data.users) {
// 			return { users_profile: data.users };
// 		} else {
// 			return { users_profile: [] };
// 		}
// 	} catch (error) {
// 		console.error("Error loading profile feed:", error);
// 		return { users_profile: [] };
// 	}
// };
