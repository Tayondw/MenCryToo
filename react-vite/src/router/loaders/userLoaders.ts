import { redirect, json, LoaderFunctionArgs } from "react-router-dom";
import { User } from "../../types/users";
import { Tag } from "../../types/tags";

// Loader to fetch user details by ID (with caching)
export const userDetailsLoader = async ({ params }: LoaderFunctionArgs) => {
	const { userId } = params;

	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const response = await fetch(`/api/users/${userId}`, {
			headers: {
				"Cache-Control": "max-age=120", // Cache for 2 minutes
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				throw new Response("User not found", { status: 404 });
			}
			if (response.status === 401) {
				// Only redirect to login if the API specifically returns 401
				return redirect("/login");
			}
			throw new Error("Failed to fetch user details");
		}

		const userDetails = await response.json();
		return { user: userDetails, isOwnProfile: false };
	} catch (error) {
		console.error("Error loading user details:", error);
		if (error instanceof Response) {
			throw error; // Re-throw Response objects (like 404)
		}
		// For other errors, redirect to users list instead of home
		return redirect("/profile-feed");
	}
};

export const publicUserProfileLoader = async ({
	params,
}: LoaderFunctionArgs) => {
	const { userId } = params;

	if (!userId) {
		throw new Response("User ID is required", { status: 400 });
	}

	try {
		// Check if user is authenticated and if they're viewing their own profile
		let currentUser = null;
		let isOwnProfile = false;

		try {
			const authResponse = await fetch("/api/auth/", {
				headers: { "Cache-Control": "max-age=30" },
			});

			if (authResponse.ok) {
				const authData = await authResponse.json();
				if (authData.authenticated && authData.user) {
					currentUser = authData.user;
					isOwnProfile = authData.user.id.toString() === userId;
				}
			}
		} catch (authError) {
			// If auth check fails, continue as non-authenticated user
			console.error("Auth check failed, continuing as public user", authError);
		}

		// If it's their own profile, redirect to /profile
		if (isOwnProfile) {
			return redirect("/profile");
		}

		// Fetch the target user's profile data
		const response = await fetch(`/api/users/${userId}`, {
			headers: {
				"Cache-Control": "max-age=120",
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				throw new Response("User not found", { status: 404 });
			}
			throw new Response("Failed to load user profile", { status: 500 });
		}

		const userData = await response.json();

		return {
			user: userData,
			currentUser,
			isOwnProfile: false,
			isAuthenticated: !!currentUser,
		};
	} catch (error) {
		console.error("Error loading user profile:", error);
		if (error instanceof Response) {
			throw error;
		}
		throw new Response("Failed to load user profile", { status: 500 });
	}
};

// Loader to fetch all users with pagination
export const usersLoader = async ({
	request,
}: {
	request?: Request;
} = {}) => {
	try {
		// Get pagination parameters
		const url = request ? new URL(request.url) : new URL(window.location.href);
		const page = parseInt(url.searchParams.get("page") || "1");
		const perPage = Math.min(
			parseInt(url.searchParams.get("per_page") || "20"),
			50,
		);

		const response = await fetch(
			`/api/users/?page=${page}&per_page=${perPage}`,
			{
				headers: {
					"Cache-Control": "max-age=60", // Cache for 1 minute
				},
			},
		);

		if (!response.ok) {
			throw new Error("Failed to fetch users");
		}

		const data = await response.json();
		return { users: data.users || data, pagination: data.pagination };
	} catch (error) {
		console.error("Error loading users:", error);
		return { users: [], pagination: {} };
	}
};

// Loader for user profile by ID (different from userDetailsLoader - loads full profile data)
export const userProfileLoader = async ({
	params,
}: {
	params: { userId: string };
}): Promise<User | Response> => {
	try {
		const response = await fetch(`/api/users/${params.userId}/profile`, {
			headers: {
				"Cache-Control": "max-age=120", // Cache for 2 minutes
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				throw new Response("User profile not found", { status: 404 });
			}
			throw new Error("Failed to fetch user profile");
		}

		const userProfile = await response.json();
		return userProfile;
	} catch (error) {
		console.error("Error loading user profile:", error);
		return redirect("/users");
	}
};

// Loader for users with similar interests/tags
export const similarUsersLoader = async ({
	request,
}: {
	request?: Request;
} = {}) => {
	try {
		// Check authentication first
		const authResponse = await fetch("/api/auth/", {
			headers: {
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

		// Build query with user's tags for similarity matching
		const userTags = currentUser.usersTags?.map((tag: Tag) => tag.name) || [];
		const tagsQuery = userTags.length > 0 ? `&tags=${userTags.join(",")}` : "";

		const response = await fetch(
			`/api/users/similar?page=${page}&per_page=${perPage}${tagsQuery}`,
			{
				headers: {
					"Cache-Control": "max-age=300", // Cache for 5 minutes
				},
			},
		);

		if (!response.ok) {
			// Fallback to regular users if similar endpoint doesn't exist
			return usersLoader({ request });
		}

		const data = await response.json();

		// Filter out current user from results
		const filteredUsers = (data.users || data).filter(
			(user: User) => user.id !== currentUser.id,
		);

		return {
			users: filteredUsers,
			pagination: data.pagination,
			currentUser,
		};
	} catch (error) {
		console.error("Error loading similar users:", error);
		return { users: [], pagination: {} };
	}
};

// Action for user operations (follow, unfollow, etc.)
export const userAction = async ({
	request,
	params,
}: {
	request: Request;
	params: { userId?: string };
}) => {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;
	const userId = params.userId || (formData.get("userId") as string);

	if (!userId) {
		return json({ error: "User ID is required" }, { status: 400 });
	}

	try {
		switch (intent) {
			case "follow-user": {
				const currentUserId = formData.get("currentUserId") as string;

				if (!currentUserId) {
					return json(
						{ error: "Current user ID is required" },
						{ status: 400 },
					);
				}

				const response = await fetch(`/api/users/${userId}/follow`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						follower_id: parseInt(currentUserId),
					}),
				});

				if (response.ok) {
					return redirect(`/users/${userId}`);
				} else {
					return json({ error: "Failed to follow user" }, { status: 500 });
				}
			}

			case "unfollow-user": {
				const currentUserId = formData.get("currentUserId") as string;

				if (!currentUserId) {
					return json(
						{ error: "Current user ID is required" },
						{ status: 400 },
					);
				}

				const response = await fetch(`/api/users/${userId}/unfollow`, {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						follower_id: parseInt(currentUserId),
					}),
				});

				if (response.ok) {
					return redirect(`/users/${userId}`);
				} else {
					return json({ error: "Failed to unfollow user" }, { status: 500 });
				}
			}

			case "block-user": {
				const currentUserId = formData.get("currentUserId") as string;

				if (!currentUserId) {
					return json(
						{ error: "Current user ID is required" },
						{ status: 400 },
					);
				}

				const response = await fetch(`/api/users/${userId}/block`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						blocker_id: parseInt(currentUserId),
					}),
				});

				if (response.ok) {
					return redirect("/users");
				} else {
					return json({ error: "Failed to block user" }, { status: 500 });
				}
			}

			case "unblock-user": {
				const currentUserId = formData.get("currentUserId") as string;

				if (!currentUserId) {
					return json(
						{ error: "Current user ID is required" },
						{ status: 400 },
					);
				}

				const response = await fetch(`/api/users/${userId}/unblock`, {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						blocker_id: parseInt(currentUserId),
					}),
				});

				if (response.ok) {
					return redirect("/users");
				} else {
					return json({ error: "Failed to unblock user" }, { status: 500 });
				}
			}

			default:
				return json({ error: "Invalid action" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error performing user action:", error);
		return json({ error: "Network error. Please try again" }, { status: 500 });
	}
};

// Helper function to check if user is authenticated
export const requireAuth = async (): Promise<User | Response> => {
	try {
		const response = await fetch("/api/auth/", {
			headers: {
				"Cache-Control": "max-age=30",
			},
		});

		if (!response.ok) {
			return redirect("/login");
		}

		const data = await response.json();
		if (data.errors) {
			return redirect("/login");
		}

		return data as User;
	} catch (error) {
		console.error("Error checking authentication:", error);
		return redirect("/login");
	}
};

// Action for user search
export const userSearchAction = async ({ request }: { request: Request }) => {
	const formData = await request.formData();
	const searchQuery = formData.get("search") as string;
	const filters = {
		tags: formData.getAll("tags") as string[],
		location: formData.get("location") as string,
		interests: formData.getAll("interests") as string[],
	};

	if (
		!searchQuery &&
		!filters.tags.length &&
		!filters.location &&
		!filters.interests.length
	) {
		return json({ error: "Please provide search criteria" }, { status: 400 });
	}

	try {
		const params = new URLSearchParams();

		if (searchQuery) params.append("q", searchQuery);
		if (filters.tags.length) params.append("tags", filters.tags.join(","));
		if (filters.location) params.append("location", filters.location);
		if (filters.interests.length)
			params.append("interests", filters.interests.join(","));

		const response = await fetch(`/api/users/search?${params.toString()}`);

		if (!response.ok) {
			throw new Error("Search failed");
		}

		const results = await response.json();
		return results;
	} catch (error) {
		console.error("User search error:", error);
		return json({ error: "Search failed. Please try again" }, { status: 500 });
	}
};
