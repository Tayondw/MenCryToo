import { redirect } from "react-router-dom";
import { User } from "../types";

interface ProfileFeedResponse {
	users_profile: User[];
}

// Loader for the profile feed page
export const profileFeedLoader = async (): Promise<
	ProfileFeedResponse | Response
> => {
	try {
		// First check if user is authenticated
		const authResponse = await fetch("/api/auth/");
		if (!authResponse.ok) {
			return redirect("/login");
		}

		const authData = await authResponse.json();
		if (authData.errors) {
			return redirect("/login");
		}

		// Fetch all user profiles for the feed
		const response = await fetch("/api/users/profile-feed");

		if (!response.ok) {
			throw new Error("Failed to fetch profile feed");
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error loading profile feed:", error);
		// Return empty data instead of redirecting on fetch error
		return { users_profile: [] };
	}
};

// Alternative loader that fetches all users if the specific endpoint doesn't exist
export const profileFeedLoaderFallback = async (): Promise<
	ProfileFeedResponse | Response
> => {
	try {
		// First check if user is authenticated
		const authResponse = await fetch("/api/auth/");
		if (!authResponse.ok) {
			return redirect("/login");
		}

		const authData = await authResponse.json();
		if (authData.errors) {
			return redirect("/login");
		}

		// Try the specific profile feed endpoint first
		let response = await fetch("/api/users/profile-feed");

		// If that fails, try the general users endpoint
		if (!response.ok) {
			response = await fetch("/api/users/");
		}

		if (!response.ok) {
			throw new Error("Failed to fetch users");
		}

		const data = await response.json();

		// Normalize the response structure
		if (Array.isArray(data)) {
			return { users_profile: data };
		} else if (data.users_profile) {
			return data;
		} else if (data.users) {
			return { users_profile: data.users };
		} else {
			return { users_profile: [] };
		}
	} catch (error) {
		console.error("Error loading profile feed:", error);
		return { users_profile: [] };
	}
};
