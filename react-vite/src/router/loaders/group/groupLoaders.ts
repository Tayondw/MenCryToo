import { redirect, LoaderFunctionArgs } from "react-router-dom";
import { GroupData, GroupMemberLoaderData } from "../../../types";

// Add cache busting and proper error handling
export const groupsLoader = async ({ request }: LoaderFunctionArgs) => {
	try {
		const url = new URL(request.url);
		const searchParams = url.searchParams;
		const page = searchParams.get("page") || "1";
		const per_page = searchParams.get("per_page") || "20";

		// Add cache busting timestamp to ensure fresh data
		const timestamp = Date.now();

		const response = await fetch(
			`/api/groups?page=${page}&per_page=${per_page}&_t=${timestamp}`,
			{
				credentials: "include",
				headers: {
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch groups: ${response.status}`);
		}

		const data = await response.json();

		// Handle both paginated and non-paginated responses
		let groupsData;
		if (data.groups) {
			// Paginated response: { groups: [...], pagination: {...} }
			groupsData = data;
		} else if (Array.isArray(data)) {
			// Direct array response: [...]
			groupsData = { groups: data };
		} else {
			// Unknown format, try to extract groups
			groupsData = { groups: data.groups || [] };
		}

		return {
			allGroups: groupsData,
			currentPage: parseInt(page),
			perPage: parseInt(per_page),
		};
	} catch (error) {
		console.error("Error loading groups:", error);
		return {
			allGroups: { groups: [] },
			currentPage: 1,
			perPage: 20,
			error: error instanceof Error ? error.message : "Failed to load groups",
		};
	}
};

// Group details loader with better error handling
export const groupDetailsLoader = async ({ params }: LoaderFunctionArgs) => {
	const { groupId } = params;

	if (!groupId) {
		throw new Response("Group ID is required", { status: 400 });
	}

	try {
		// Add cache busting for fresh data
		const timestamp = Date.now();
		const response = await fetch(`/api/groups/${groupId}?_t=${timestamp}`, {
			credentials: "include",
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				throw new Response("Group not found", { status: 404 });
			}
			throw new Error(`Failed to fetch group: ${response.status}`);
		}

		const group = (await response.json()) as GroupData;

		// Ensure members array exists and is properly formatted
		if (!group.members) {
			group.members = [];
		}

		// Ensure organizer is included in members if not already present
		if (
			group.organizer &&
			!group.members.some(
				(member: GroupMemberLoaderData) => member.userId === group.organizerId,
			)
		) {
			const organizerMember = {
				id: `organizer_${group.organizerId}`,
				userId: group.organizerId,
				groupId: group.id,
				isOrganizer: true,
				user: {
					id: group.organizer.id,
					firstName: group.organizer.firstName,
					lastName: group.organizer.lastName,
					username: group.organizer.username,
					email: group.organizer.email,
					profileImage: group.organizer.profileImage,
				},
			};
			group.members.unshift(organizerMember);
		}

		return group;
	} catch (error) {
		console.error("Error loading group details:", error);
		if (error instanceof Response) {
			throw error; // Re-throw Response errors (like 404)
		}
		throw new Response("Failed to load group", { status: 500 });
	}
};

export const updateGroupLoader = async ({ params }: LoaderFunctionArgs) => {
	const { groupId } = params;

	if (!groupId) {
		throw new Response("Group ID is required", { status: 400 });
	}

	try {
		// First check authentication
		const authResponse = await fetch("/api/auth/", {
			headers: { "Cache-Control": "max-age=30" },
		});

		if (!authResponse.ok) {
			return redirect("/login");
		}

		const authData = await authResponse.json();
		if (!authData.authenticated || !authData.user) {
			return redirect("/login");
		}

		// Then load group data
		const timestamp = Date.now();
		const groupResponse = await fetch(
			`/api/groups/${groupId}?_t=${timestamp}`,
			{
				credentials: "include",
				headers: {
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			},
		);

		if (!groupResponse.ok) {
			if (groupResponse.status === 404) {
				throw new Response("Group not found", { status: 404 });
			}
			throw new Error(`Failed to fetch group: ${groupResponse.status}`);
		}

		const groupDetails = await groupResponse.json();

		// Check if user is the organizer
		if (authData.user.id !== groupDetails.organizerId) {
			throw new Response("Unauthorized - You must be the group organizer", {
				status: 403,
			});
		}

		// Return both user and group data in the format expected by UpdateGroup
		return {
			...groupDetails,
			user: authData.user,
		};
	} catch (error) {
		console.error("Error loading group for update:", error);
		if (error instanceof Response) {
			throw error;
		}
		throw new Response("Failed to load group", { status: 500 });
	}
};

// New loader for Create Event route
export const createEventLoader = async ({ params }: LoaderFunctionArgs) => {
	const { groupId } = params;

	if (!groupId) {
		throw new Response("Group ID is required", { status: 400 });
	}

	try {
		// First check authentication
		const authResponse = await fetch("/api/auth/", {
			headers: { "Cache-Control": "max-age=30" },
		});

		if (!authResponse.ok) {
			return redirect("/login");
		}

		const authData = await authResponse.json();
		if (!authData.authenticated || !authData.user) {
			return redirect("/login");
		}

		// Then load group data
		const timestamp = Date.now();
		const groupResponse = await fetch(
			`/api/groups/${groupId}?_t=${timestamp}`,
			{
				credentials: "include",
				headers: {
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			},
		);

		if (!groupResponse.ok) {
			if (groupResponse.status === 404) {
				throw new Response("Group not found", { status: 404 });
			}
			throw new Error(`Failed to fetch group: ${groupResponse.status}`);
		}

		const groupDetails = await groupResponse.json();

		// Check if user is the organizer
		if (authData.user.id !== groupDetails.organizerId) {
			throw new Response("Unauthorized - You must be the group organizer", {
				status: 403,
			});
		}

		// Return both user and group data in the format expected by CreateEvent
		return {
			...groupDetails,
			user: authData.user,
		};
	} catch (error) {
		console.error("Error loading group for event creation:", error);
		if (error instanceof Response) {
			throw error;
		}
		throw new Response("Failed to load group", { status: 500 });
	}
};
