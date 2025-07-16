import { redirect, json } from "react-router-dom";
import { User } from "../types/users";
import { CacheEntry } from "../types/cache";

// Cache for frequently accessed data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

// Profile loader with caching and minimal data
export async function profileLoader({
	params,
}: { params?: { id?: string } } = {}): Promise<{ user: User } | Response> {
	const cacheKey = "current-user-profile";
	const cached = getCachedData(cacheKey);
	if (cached) return cached as { user: User };

	try {
		// Use the new dedicated profile endpoint
		const response = await fetch("/api/auth/profile", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "max-age=120", // Cache for 2 minutes
			},
		});

		if (!response.ok) {
			if (response.status === 401) {
				return redirect("/login");
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const userData = await response.json();

		// Handle the new authentication response structure
		if (userData.errors || (!userData.authenticated && !userData.id)) {
			return redirect("/login");
		}

		// Extract user data from response
		const user = userData.user || userData;

		// If we have a user ID in params, verify it matches the current user
		if (params?.id && user.id.toString() !== params.id) {
			return redirect("/profile");
		}

		const result = { user };
		setCachedData(cacheKey, result);
		return result;
	} catch (error) {
		console.error("Profile loader error:", error);
		return redirect("/login");
	}
}

// Alternative profile loader that uses auth endpoint - BACKUP
export async function profileLoaderBackup({
	params,
}: { params?: { id?: string } } = {}): Promise<{ user: User } | Response> {
	const cacheKey = "current-user-profile-backup";
	const cached = getCachedData(cacheKey);
	if (cached) return cached as { user: User };

	try {
		// Fallback to main auth endpoint
		const response = await fetch("/api/auth/", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "max-age=120",
			},
		});

		if (!response.ok) {
			return redirect("/login");
		}

		const authData = await response.json();

		// Handle new response structure
		if (!authData.authenticated || !authData.user) {
			return redirect("/login");
		}

		const user = authData.user;

		// If we have a user ID in params, verify it matches the current user
		if (params?.id && user.id.toString() !== params.id) {
			return redirect("/profile");
		}

		const result = { user };
		setCachedData(cacheKey, result);
		return result;
	} catch (error) {
		console.error("Profile loader backup error:", error);
		return redirect("/login");
	}
}

// Update profile loader with current user data
export async function updateProfileLoader(): Promise<{ user: User }> {
	const cacheKey = "current-user-update";
	const cached = getCachedData(cacheKey);
	if (cached) return cached as { user: User };

	try {
		const response = await fetch("/api/auth/", {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const userData = await response.json();
		const result = { user: userData };
		setCachedData(cacheKey, result);
		return result;
	} catch (error) {
		console.error("Update profile loader error:", error);
		throw new Response("Failed to load user data for update", { status: 500 });
	}
}

// User profile loader with selective data loading
export async function userProfileLoader({
	params,
}: {
	params: { userId: string };
}): Promise<User> {
	const { userId } = params;
	const cacheKey = `user-profile-${userId}`;
	const cached = getCachedData(cacheKey);
	if (cached) return cached as User;

	try {
		const response = await fetch(`/api/users/${userId}`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});

		if (!response.ok) {
			if (response.status === 404) {
				throw new Response("User not found", { status: 404 });
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const userData = await response.json();
		setCachedData(cacheKey, userData);
		return userData;
	} catch (error) {
		console.error("User profile loader error:", error);
		throw new Response("Failed to load user profile", { status: 500 });
	}
}

// Profile Page Action (handles add-tags and delete-profile)
export const profileAction = async ({ request }: { request: Request }) => {
	const formData = await request.formData();
	const intent = formData.get("intent");

	if (intent === "add-tags") {
		const userId = formData.get("userId") as string;

		if (!userId) {
			return json({ error: "User ID is required" }, { status: 400 });
		}

		const userTags = formData.getAll("userTags");

		if (userTags.length === 0) {
			return json({ error: "Please select at least one tag" }, { status: 400 });
		}

		try {
			const requestBody = {
				userTags: userTags,
				userId: parseInt(userId),
			};

			const response = await fetch(`/api/users/${userId}/add-tags`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			if (response.ok) {
				// Clear relevant caches after successful update
				clearCache("profile");
				clearCache("user");
				return redirect("/profile");
			} else {
				const errorData = await response.json();
				return json(
					{ error: errorData.message || "Failed to add tags" },
					{ status: 500 },
				);
			}
		} catch (error) {
			console.error("Error adding tags:", error);
			return json(
				{ error: "Network error. Please try again" },
				{ status: 500 },
			);
		}
	}

	if (intent === "delete-profile") {
		const userId = formData.get("userId") as string;

		if (!userId) {
			return json({ error: "User ID is required" }, { status: 400 });
		}

		try {
			const response = await fetch(`/api/users/${userId}/profile/delete`, {
				method: "DELETE",
				body: formData,
			});

			if (response.ok) {
				// Clear the user session by calling logout endpoint
				await fetch("/api/auth/logout", {
					method: "GET",
				});

				// Clear all caches
				clearCache();

				// Use window.location.href for full page navigation and state reset
				if (typeof window !== "undefined") {
					window.location.href = "/";
				}
				return null;
			} else {
				const errorData = await response.json();
				return json(
					{ error: errorData.message || "Failed to delete profile" },
					{ status: 500 },
				);
			}
		} catch (error) {
			console.error("Error deleting profile:", error);
			return json(
				{ error: "Network error. Please try again" },
				{ status: 500 },
			);
		}
	}

	return json({ error: "Invalid form submission" }, { status: 400 });
};

// Update profile action with minimal response
export const profileUpdateAction = async ({
	request,
	params,
}: {
	request: Request;
	params: { id?: string };
}) => {
	const formData = await request.formData();
	const intent = formData.get("intent");

	if (intent === "delete-profile") {
		const userId = formData.get("userId") as string;

		if (!userId) {
			return json({ error: "User ID is required" }, { status: 400 });
		}

		try {
			const response = await fetch(`/api/users/${userId}/profile/delete`, {
				method: "DELETE",
				body: formData,
			});

			if (response.ok) {
				await fetch("/api/auth/logout", {
					method: "GET",
				});

				// Clear all caches
				clearCache();

				if (typeof window !== "undefined") {
					window.location.href = "/";
				}
				return null;
			} else {
				const errorData = await response.json();
				return json(
					{ error: errorData.message || "Failed to delete profile" },
					{ status: 500 },
				);
			}
		} catch (error) {
			console.error("Error deleting profile:", error);
			return json(
				{ error: "Network error. Please try again" },
				{ status: 500 },
			);
		}
	}

	if (intent !== "update-profile") {
		return json({ error: "Invalid form submission" }, { status: 400 });
	}

	const userId = params.id || (formData.get("userId") as string);

	if (!userId) {
		return json({ errors: { server: "User ID is required" } }, { status: 400 });
	}

	// Streamlined validation
	const errors: Record<string, string> = {};

	const firstName = formData.get("firstName") as string;
	const lastName = formData.get("lastName") as string;
	const username = formData.get("username") as string;
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const confirmPassword = formData.get("confirmPassword") as string;
	const bio = formData.get("bio") as string;

	// Quick validation
	if (!firstName || firstName.length < 3 || firstName.length > 20) {
		errors.firstName = "First name must be between 3 and 20 characters";
	}

	if (!lastName || lastName.length < 3 || lastName.length > 20) {
		errors.lastName = "Last name must be between 3 and 20 characters";
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!email || !emailRegex.test(email)) {
		errors.email = "Please enter a valid email address";
	} else if (email.length > 50) {
		errors.email = "Email must be less than 50 characters";
	}

	if (!username || username.length < 3 || username.length > 20) {
		errors.username = "Username must be between 3 and 20 characters";
	}

	if (password && (password.length < 8 || password.length > 25)) {
		errors.password = "Password must be between 8 and 25 characters";
	}

	if (password !== confirmPassword) {
		errors.confirmPassword = "Passwords do not match";
	}

	if (!bio || bio.length < 50 || bio.length > 500) {
		errors.bio = "Bio must be between 50 and 500 characters";
	}

	const userTags = formData.getAll("userTags");
	if (userTags.length === 0) {
		errors.userTags = "Please select at least one tag";
	}

	if (Object.keys(errors).length > 0) {
		return json({ errors }, { status: 400 });
	}

	try {
		const response = await fetch(`/api/users/${userId}/profile/update`, {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			// Clear relevant caches after successful update
			clearCache("profile");
			clearCache("user");

			// Redirect to profile instead of returning data for faster response
			return redirect("/profile");
		} else if (response.status < 500) {
			const errorData = await response.json();
			return json({ errors: errorData }, { status: 400 });
		} else {
			return json(
				{
					errors: { server: "Something went wrong. Please try again" },
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("Error updating profile:", error);
		return json(
			{
				errors: { server: "Network error. Please try again" },
			},
			{ status: 500 },
		);
	}
};

// Profile delete action
export const profileDeleteAction = async ({
	request,
}: {
	request: Request;
}) => {
	const formData = await request.formData();
	const intent = formData.get("intent");

	if (intent !== "delete-profile") {
		return json({ error: "Invalid form submission" }, { status: 400 });
	}

	const userId = formData.get("userId") as string;

	if (!userId) {
		return json({ error: "User ID is required" }, { status: 400 });
	}

	try {
		const response = await fetch(`/api/users/${userId}/profile/delete`, {
			method: "DELETE",
			body: formData,
		});

		if (response.ok) {
			await fetch("/api/auth/logout", {
				method: "GET",
			});

			// Clear all caches
			clearCache();

			if (typeof window !== "undefined") {
				window.location.href = "/";
			}
			return null;
		} else {
			const errorData = await response.json();
			return json(
				{ error: errorData.message || "Failed to delete profile" },
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("Error deleting profile:", error);
		return json({ error: "Network error. Please try again" }, { status: 500 });
	}
};
