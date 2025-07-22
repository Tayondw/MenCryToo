import { redirect, LoaderFunctionArgs } from "react-router-dom";

// Loader for events list page
export const eventsLoader = async ({ request }: LoaderFunctionArgs) => {
	try {
		const url = new URL(request.url);
		const searchParams = url.searchParams;
		const page = searchParams.get("page") || "1";
		const per_page = searchParams.get("per_page") || "20";

		// Add cache busting for fresh data
		const timestamp = Date.now();

		const response = await fetch(
			`/api/events?page=${page}&per_page=${per_page}&_t=${timestamp}`,
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
			throw new Error(`Failed to fetch events: ${response.status}`);
		}

		const data = await response.json();

		// Handle both paginated and non-paginated responses
		let eventsData;
		if (data.events) {
			// Paginated response: { events: [...], pagination: {...} }
			eventsData = data;
		} else if (Array.isArray(data)) {
			// Direct array response: [...]
			eventsData = { events: data };
		} else {
			// Unknown format, try to extract events
			eventsData = { events: data.events || [] };
		}

		return {
			allEvents: eventsData,
			currentPage: parseInt(page),
			perPage: parseInt(per_page),
		};
	} catch (error) {
		console.error("Error loading events:", error);
		// Return empty data instead of throwing to prevent complete failure
		return {
			allEvents: { events: [] },
			currentPage: 1,
			perPage: 20,
			error: error instanceof Error ? error.message : "Failed to load events",
		};
	}
};

// Loader for event details page
export const eventDetailsLoader = async ({ params }: LoaderFunctionArgs) => {
	const { eventId } = params;

	if (!eventId) {
		throw new Error("Event ID is required");
	}

	try {
		// Add cache busting for fresh data
		const timestamp = Date.now();

		const response = await fetch(`/api/events/${eventId}?_t=${timestamp}`, {
			credentials: "include",
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch event: ${response.status}`);
		}

		const event = await response.json();
		return event;
	} catch (error) {
		console.error("Error loading event:", error);
		throw error;
	}
};

export const updateEventLoader = async ({ params }: LoaderFunctionArgs) => {
	const { groupId, eventId } = params;

	if (!groupId || !eventId) {
		console.error("Missing required params:", { groupId, eventId });
		throw new Response("Group ID and Event ID are required", { status: 400 });
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

		// Then load both event and group data
		const timestamp = Date.now();

		const [eventResponse, groupResponse] = await Promise.all([
			fetch(`/api/events/${eventId}?_t=${timestamp}`, {
				credentials: "include",
				headers: {
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			}),
			fetch(`/api/groups/${groupId}?_t=${timestamp}`, {
				credentials: "include",
				headers: {
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			}),
		]);

		if (!eventResponse.ok) {
			console.error("Event fetch failed:", eventResponse.status);
			if (eventResponse.status === 404) {
				// Instead of throwing, redirect to events page with error message
				return redirect("/events?error=event-not-found");
			}
			// For other errors, redirect to the event page
			return redirect(`/events/${eventId}?error=fetch-failed`);
		}

		if (!groupResponse.ok) {
			console.error("Group fetch failed:", groupResponse.status);
			if (groupResponse.status === 404) {
				// Redirect to groups page with error message
				return redirect("/groups?error=group-not-found");
			}
			// For other errors, redirect to the group page
			return redirect(`/groups/${groupId}?error=fetch-failed`);
		}

		const [eventDetails, groupDetails] = await Promise.all([
			eventResponse.json(),
			groupResponse.json(),
		]);

		// Check if user is the group organizer (who can edit events)
		if (authData.user.id !== groupDetails.organizerId) {
			console.error("User not authorized - not group organizer");
			// Instead of throwing, redirect back to event with error
			return redirect(`/events/${eventId}?error=unauthorized`);
		}

		// Return both event and group data in the format expected by UpdateEvent
		return {
			event: eventDetails,
			group: groupDetails,
			user: authData.user,
		};
	} catch (error) {
		console.error("Error loading event for update:", error);

		// Handle different types of errors more gracefully
		if (error instanceof Response) {
			// Re-throw Response errors as they're handled by React Router
			throw error;
		}

		if (error instanceof TypeError && error.message.includes("fetch")) {
			// Network error - redirect with error message
			console.error("Network error detected");
			return redirect(`/events/${eventId}?error=network`);
		}

		// For any other error, redirect to the event page with a generic error
		console.error("Unknown error:", error);
		return redirect(`/events/${eventId}?error=unknown`);
	}
};