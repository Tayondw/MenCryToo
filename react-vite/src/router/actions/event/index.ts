import { redirect, json } from "react-router-dom";

// Action for event operations (attend, leave, delete)
export const eventAction = async ({
	request,
	params,
}: {
	request: Request;
	params: { eventId?: string };
}) => {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;
	const eventId = params.eventId || (formData.get("id") as string);

	if (!eventId) {
		return json({ error: "Event ID is required" }, { status: 400 });
	}

	try {
		switch (intent) {
			case "attend-event": {
				const userId = formData.get("userId") as string;

				if (!userId) {
					return json({ error: "User ID is required" }, { status: 400 });
				}

				const response = await fetch(`/api/events/${eventId}/attend-event`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						event_id: parseInt(eventId),
						user_id: parseInt(userId),
					}),
				});

				if (response.ok) {
					return redirect(`/events/${eventId}`);
				} else {
					return json({ error: "Failed to attend event" }, { status: 500 });
				}
			}

			case "leave-event": {
				const userId = formData.get("userId") as string;
				const attendeeId = formData.get("attendeeId") as string;

				if (!userId) {
					return json({ error: "User ID is required" }, { status: 400 });
				}

				// Use attendeeId if provided, otherwise use userId
				const attendeeToRemove = attendeeId || userId;

				const response = await fetch(
					`/api/events/${eventId}/leave-event/${attendeeToRemove}`,
					{
						method: "DELETE",
					},
				);

				if (response.ok) {
					return redirect(`/events/${eventId}`);
				} else {
					return json({ error: "Failed to leave event" }, { status: 500 });
				}
			}

			case "delete-event": {
				const response = await fetch(`/api/events/${eventId}`, {
					method: "DELETE",
				});

				if (response.ok) {
					return redirect("/events");
				} else {
					return json({ error: "Failed to delete event" }, { status: 500 });
				}
			}

			default:
				return json({ error: "Invalid action" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error performing event action:", error);
		return json({ error: "Network error. Please try again" }, { status: 500 });
	}
};

// Action for event creation/editing (separate from event details actions)
export const eventFormAction = async ({ request }: { request: Request }) => {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	// Validation
	const errors: Record<string, string> = {};

	if (intent === "create-event" || intent === "edit-event") {
		const name = formData.get("name") as string;
		const description = formData.get("description") as string;
		const type = formData.get("type") as string;
		const capacity = formData.get("capacity") as string;
		const startDate = formData.get("startDate") as string;
		const endDate = formData.get("endDate") as string;
		const image = formData.get("image") as File;

		if (!name || name.length < 5 || name.length > 50) {
			errors.name = "Event name must be between 5 and 50 characters";
		}
		if (!description || description.length < 50 || description.length > 150) {
			errors.description =
				"Description must be at least 50 characters and no more than 150 characters";
		}
		if (!type) {
			errors.type = "Event Type is required";
		}
		if (!capacity || parseInt(capacity) < 2 || parseInt(capacity) > 300) {
			errors.capacity =
				"Event capacity must have at least two people attending and cannot exceed more than 300 people";
		}

		// Date validation
		const today = new Date();
		const start = new Date(startDate);
		const end = new Date(endDate);

		if (!startDate || isNaN(start.getTime())) {
			errors.startDate = "Invalid start date";
		} else if (start < today) {
			errors.startDate = "Start date must be after or on the current date";
		}

		if (!endDate || isNaN(end.getTime())) {
			errors.endDate = "Invalid end date";
		} else if (end < start) {
			errors.endDate = "End date must be after the start date";
		}

		// Only require image if creating a new event
		if (intent === "create-event" && !image) {
			errors.image = "Event image is required to create an event";
		}

		if (Object.keys(errors).length > 0) {
			return json({ errors }, { status: 400 });
		}
	}

	try {
		switch (intent) {
			case "create-event": {
				const groupId = formData.get("group_id") as string;

				if (!groupId) {
					return json(
						{ errors: { server: "Group ID is required" } },
						{ status: 400 },
					);
				}

				const response = await fetch(`/api/groups/${groupId}/events/new`, {
					method: "POST",
					credentials: "include",
					body: formData,
				});

				if (response.ok) {
					// Get the response data which contains the new event
					const responseData = await response.json();
					const newEventId = responseData.event?.id;

					if (newEventId) {
						// Redirect to the newly created event page
						if (typeof window !== "undefined") {
							window.location.href = `/events/${newEventId}`;
							return null;
						}
						return redirect(`/events/${newEventId}`);
					} else {
						// Fallback to events list if no event ID is returned
						const timestamp = Date.now();
						if (typeof window !== "undefined") {
							window.location.href = `/events?refresh=${timestamp}`;
							return null;
						}
						return redirect(`/events?refresh=${timestamp}`);
					}
				} else {
					const errorData = await response.json();
					return json({ errors: errorData }, { status: 400 });
				}
			}

			case "edit-event": {
				const eventId = formData.get("eventId") as string;
				const groupId = formData.get("group_id") as string;

				if (!eventId || !groupId) {
					return json(
						{ errors: { server: "Event ID and Group ID are required" } },
						{ status: 400 },
					);
				}

				const response = await fetch(
					`/api/groups/${groupId}/events/${eventId}/edit`,
					{
						method: "POST",
						credentials: "include",
						body: formData,
					},
				);

				if (response.ok) {
					// Force cache refresh for event details
					const timestamp = Date.now();

					if (typeof window !== "undefined") {
						window.location.href = `/events/${eventId}?refresh=${timestamp}`;
						return null;
					}

					return redirect(`/events/${eventId}?refresh=${timestamp}`);
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
		console.error("Error with event form action:", error);
		return json(
			{
				errors: { server: "Network error. Please try again" },
			},
			{ status: 500 },
		);
	}
};
