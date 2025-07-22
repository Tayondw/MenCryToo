import { redirect, json, ActionFunctionArgs } from "react-router-dom";

// Group action with proper error handling and redirect logic
export const groupAction = async ({ request, params }: ActionFunctionArgs) => {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;
	const { groupId } = params || {};
	const groupIdFromForm = formData.get("id") as string;
	const finalGroupId = groupId || groupIdFromForm;

	if (!finalGroupId) {
		return json({ error: "Group ID is required" }, { status: 400 });
	}

	try {
		switch (intent) {
			case "join-group": {
				const userId = formData.get("userId") as string;

				if (!userId) {
					return json({ error: "User ID is required" }, { status: 400 });
				}

				const response = await fetch(`/api/groups/${finalGroupId}/join-group`, {
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						group_id: parseInt(finalGroupId),
						user_id: parseInt(userId),
					}),
				});

				if (response.ok) {
					// Force page reload to get fresh data
					window.location.href = `/groups/${finalGroupId}`;
					return null;
				} else {
					const errorData = await response.json();
					return json(
						{ error: errorData.message || "Failed to join group" },
						{ status: 500 },
					);
				}
			}

			case "leave-group": {
				const userId = formData.get("userId") as string;
				const memberId = formData.get("memberId") as string;

				if (!userId) {
					return json({ error: "User ID is required" }, { status: 400 });
				}

				const memberToRemove = memberId || userId;

				const response = await fetch(
					`/api/groups/${finalGroupId}/leave-group/${memberToRemove}`,
					{
						method: "DELETE",
						credentials: "include",
					},
				);

				if (response.ok) {
					return redirect("/groups");
				} else {
					const errorData = await response.json();
					return json(
						{ error: errorData.message || "Failed to leave group" },
						{ status: 500 },
					);
				}
			}

			case "delete-group": {
				const response = await fetch(`/api/groups/${finalGroupId}/delete`, {
					method: "DELETE",
					credentials: "include",
				});

				if (response.ok) {
					// Use window.location for immediate redirect with cache clearing
					window.location.href = "/groups";
					return null;
				} else {
					const errorData = await response.json();
					return json(
						{ error: errorData.message || "Failed to delete group" },
						{ status: 500 },
					);
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

// Group form action with proper redirects
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
					credentials: "include",
					body: formData,
				});

				if (response.ok) {
					const createdGroup = await response.json();
					// Navigate to the newly created group, not just groups list
					if (createdGroup.group?.id) {
						window.location.href = `/groups/${createdGroup.group.id}`;
						return null;
					} else {
						// Fallback to groups list if no ID returned
						window.location.href = "/groups";
						return null;
					}
				} else {
					const errorData = await response.json();
					return json(
						{ errors: errorData.errors || errorData },
						{ status: 400 },
					);
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
					credentials: "include",
					body: formData,
				});

				if (response.ok) {
					// Force page refresh to get updated data
					window.location.href = `/groups/${groupId}`;
					return null;
				} else {
					const errorData = await response.json();
					return json(
						{ errors: errorData.errors || errorData },
						{ status: 400 },
					);
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
