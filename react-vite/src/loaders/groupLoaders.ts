import { redirect, json, LoaderFunctionArgs, ActionFunctionArgs } from "react-router-dom";

// Loader for groups list page
export const groupsLoader = async ({ request }: LoaderFunctionArgs) => {
	try {
		const url = new URL(request.url);
		const searchParams = url.searchParams;
		const page = searchParams.get("page") || "1";

		const response = await fetch(`/api/groups?page=${page}`);

		if (!response.ok) {
			throw new Error(`Failed to fetch groups: ${response.status}`);
		}

		const groups = await response.json();
		return { groups };
	} catch (error) {
		console.error("Error loading groups:", error);
		throw error;
	}
};

// Loader for group details page
export const groupDetailsLoader = async ({ params }: LoaderFunctionArgs) => {
	const { groupId } = params;

	// Add type safety check
	if (!groupId) {
		throw new Error("Group ID is required");
	}

	try {
		const response = await fetch(`/api/groups/${groupId}`);

		if (!response.ok) {
			throw new Error(`Failed to fetch group: ${response.status}`);
		}

		const group = await response.json();
		return { group };
	} catch (error) {
		console.error("Error loading group details:", error);
            throw error;
	}
};
// Action for group operations (join, leave, delete)
export const groupAction = async ({ request, params }: ActionFunctionArgs) => {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;
	const { groupId } = params || (formData.get("id") as string);

	if (!groupId) {
		return json({ error: "Group ID is required" }, { status: 400 });
	}

	try {
		switch (intent) {
			case "join-group": {
				const userId = formData.get("userId") as string;

				if (!userId) {
					return json({ error: "User ID is required" }, { status: 400 });
				}

				const response = await fetch(`/api/groups/${groupId}/join-group`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						group_id: parseInt(groupId),
						user_id: parseInt(userId),
					}),
				});

				if (response.ok) {
					return redirect(`/groups/${groupId}`);
				} else {
					return json({ error: "Failed to join group" }, { status: 500 });
				}
			}

			case "leave-group": {
				const userId = formData.get("userId") as string;
				const memberId = formData.get("memberId") as string;

				if (!userId) {
					return json({ error: "User ID is required" }, { status: 400 });
				}

				// Use memberId if provided, otherwise use userId
				const memberToRemove = memberId || userId;

				const response = await fetch(
					`/api/groups/${groupId}/leave-group/${memberToRemove}`,
					{
						method: "DELETE",
					},
				);

				if (response.ok) {
					return redirect("/groups");
				} else {
					return json({ error: "Failed to leave group" }, { status: 500 });
				}
			}

			case "delete-group": {
				const response = await fetch(`/api/groups/${groupId}/delete`, {
					method: "DELETE",
				});

				if (response.ok) {
					return redirect("/groups");
				} else {
					return json({ error: "Failed to delete group" }, { status: 500 });
				}
			}

			default:
				return json({ error: "Invalid action" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error performing group action:", error);
		return json({ error: "Network error. Please try again" }, { status: 500 });
	}
};

// Action for group creation/editing (separate from group details actions)
export const groupFormAction = async ({ request }: { request: Request }) => {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	// Validation
	const errors: Record<string, string> = {};

	if (intent === "create-group" || intent === "edit-group") {
		const name = formData.get("name") as string;
		const about = formData.get("about") as string;
		const type = formData.get("type") as string;
		const city = formData.get("city") as string;
		const state = formData.get("state") as string;
		const image = formData.get("image") as File;

		if (!name || name.length < 3 || name.length > 50) {
			errors.name = "Group name must be between 3 and 50 characters";
		}
		if (!about || about.length < 20 || about.length > 150) {
			errors.about =
				"Description must be at least 20 characters and no more than 150 characters";
		}
		if (!type) {
			errors.type = "Group Type is required";
		}
		if (!city || city.length < 3 || city.length > 30) {
			errors.city = "City name must be between 3 and 30 characters";
		}
		if (!state || state.length !== 2) {
			errors.state = "Please enter the abbreviated form of the state";
		}

		// Only require image if creating a new group
		if (intent === "create-group" && !image) {
			errors.image = "Group image is required to create a group";
		}

		if (Object.keys(errors).length > 0) {
			return json({ errors }, { status: 400 });
		}
	}

	try {
		switch (intent) {
			case "create-group": {
				const response = await fetch("/api/groups/new", {
					method: "POST",
					body: formData,
				});

				if (response.ok) {
					return redirect("/groups");
				} else {
					const errorData = await response.json();
					return json({ errors: errorData }, { status: 400 });
				}
			}

			case "edit-group": {
				const groupId = formData.get("id") as string;

				if (!groupId) {
					return json(
						{ errors: { server: "Group ID is required" } },
						{ status: 400 },
					);
				}

				const response = await fetch(`/api/groups/${groupId}/edit`, {
					method: "POST",
					body: formData,
				});

				if (response.ok) {
					return redirect(`/groups/${groupId}`);
				} else {
					const errorData = await response.json();
					return json({ errors: errorData }, { status: 400 });
				}
			}

			default:
				return json(
					{ errors: { server: "Invalid form submission" } },
					{ status: 400 },
				);
		}
	} catch (error) {
		console.error("Error with group form action:", error);
		return json(
			{
				errors: { server: "Network error. Please try again" },
			},
			{ status: 500 },
		);
	}
};
