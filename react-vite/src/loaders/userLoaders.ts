import { redirect, json } from "react-router-dom";
import { User } from "../types";

// Loader to fetch user details by ID
export const userDetailsLoader = async ({
	params,
}: {
	params: { userId: string };
}) => {
	try {
		const response = await fetch(`/api/users/${params.userId}`);

		if (!response.ok) {
			throw new Error("Failed to fetch user details");
		}

		const userDetails = await response.json();
		return userDetails;
	} catch (error) {
		console.error("Error loading user details:", error);
		return redirect("/");
	}
};

// Loader to fetch all users
export const usersLoader = async () => {
	try {
		const response = await fetch("/api/users/");

		if (!response.ok) {
			throw new Error("Failed to fetch users");
		}

		const data = await response.json();
		return { users: data.users || data };
	} catch (error) {
		console.error("Error loading users:", error);
		return { users: [] };
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

			default:
				return json({ error: "Invalid action" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error performing user action:", error);
		return json({ error: "Network error. Please try again" }, { status: 500 });
	}
};

// Helper function to check if user is authenticated
export const requireAuth = async () => {
	try {
		const response = await fetch("/api/auth/");

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
