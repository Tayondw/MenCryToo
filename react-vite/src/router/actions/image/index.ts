import { json } from "react-router-dom";

// Action for group image operations
export const groupImageAction = async ({
	request,
	params,
}: {
	request: Request;
	params: { groupId?: string; imageId?: string };
}) => {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;
	const { groupId, imageId } = params;

	try {
		switch (intent) {
			case "add-group-image": {
				const groupIdFromForm = formData.get("groupId") as string;
				const finalGroupId = groupId || groupIdFromForm;

				if (!finalGroupId) {
					return json(
						{
							success: false,
							error: "Group ID is required",
						},
						{ status: 400 },
					);
				}

				const response = await fetch(`/api/groups/${finalGroupId}/images`, {
					method: "POST",
					credentials: "include",
					body: formData,
				});

				if (response.ok) {
					const result = await response.json();
					return json({
						success: true,
						message: "Image uploaded successfully!",
						image: result.group_image,
					});
				} else {
					const errorData = await response.json();
					return json(
						{
							success: false,
							error: errorData.message || "Failed to upload image",
						},
						{ status: 400 },
					);
				}
			}

			case "edit-group-image": {
				if (!groupId || !imageId) {
					return json(
						{
							success: false,
							error: "Group ID and Image ID are required",
						},
						{ status: 400 },
					);
				}

				const response = await fetch(
					`/api/groups/${groupId}/images/${imageId}/edit`,
					{
						method: "POST",
						credentials: "include",
						body: formData,
					},
				);

				if (response.ok) {
					const result = await response.json();
					return json({
						success: true,
						message: "Image updated successfully!",
						image: result.group_image,
					});
				} else {
					const errorData = await response.json();
					return json(
						{
							success: false,
							error: errorData.message || "Failed to update image",
						},
						{ status: 400 },
					);
				}
			}

			case "delete-group-image": {
				if (!imageId) {
					return json(
						{
							success: false,
							error: "Image ID is required",
						},
						{ status: 400 },
					);
				}

				const response = await fetch(`/api/group-images/${imageId}`, {
					method: "DELETE",
					credentials: "include",
				});

				if (response.ok) {
					return json({
						success: true,
						message: "Image deleted successfully!",
					});
				} else {
					const errorData = await response.json();
					return json(
						{
							success: false,
							error: errorData.message || "Failed to delete image",
						},
						{ status: 400 },
					);
				}
			}

			default:
				return json(
					{
						success: false,
						error: "Invalid action",
					},
					{ status: 400 },
				);
		}
	} catch (error) {
		console.error("Error performing group image action:", error);
		return json(
			{
				success: false,
				error: "Network error. Please try again",
			},
			{ status: 500 },
		);
	}
};

// Action for event image operations
export const eventImageAction = async ({
	request,
	params,
}: {
	request: Request;
	params: { eventId?: string; imageId?: string };
}) => {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;
	const { eventId, imageId } = params;

	try {
		switch (intent) {
			case "add-event-image": {
				const eventIdFromForm = formData.get("eventId") as string;
				const finalEventId = eventId || eventIdFromForm;

				if (!finalEventId) {
					return json(
						{
							success: false,
							error: "Event ID is required",
						},
						{ status: 400 },
					);
				}

				const response = await fetch(`/api/events/${finalEventId}/images`, {
					method: "POST",
					credentials: "include",
					body: formData,
				});

				if (response.ok) {
					const result = await response.json();
					return json({
						success: true,
						message: "Image uploaded successfully!",
						image: result.event_image,
					});
				} else {
					const errorData = await response.json();
					return json(
						{
							success: false,
							error: errorData.message || "Failed to upload image",
						},
						{ status: 400 },
					);
				}
			}

			case "edit-event-image": {
				if (!eventId || !imageId) {
					return json(
						{
							success: false,
							error: "Event ID and Image ID are required",
						},
						{ status: 400 },
					);
				}

				const response = await fetch(
					`/api/events/${eventId}/images/${imageId}/edit`,
					{
						method: "POST",
						credentials: "include",
						body: formData,
					},
				);

				if (response.ok) {
					const result = await response.json();
					return json({
						success: true,
						message: "Image updated successfully!",
						image: result.event_image,
					});
				} else {
					const errorData = await response.json();
					return json(
						{
							success: false,
							error: errorData.message || "Failed to update image",
						},
						{ status: 400 },
					);
				}
			}

			case "delete-event-image": {
				if (!imageId) {
					return json(
						{
							success: false,
							error: "Image ID is required",
						},
						{ status: 400 },
					);
				}

				const response = await fetch(`/api/event-images/${imageId}`, {
					method: "DELETE",
					credentials: "include",
				});

				if (response.ok) {
					return json({
						success: true,
						message: "Image deleted successfully!",
					});
				} else {
					const errorData = await response.json();
					return json(
						{
							success: false,
							error: errorData.message || "Failed to delete image",
						},
						{ status: 400 },
					);
				}
			}

			default:
				return json(
					{
						success: false,
						error: "Invalid action",
					},
					{ status: 400 },
				);
		}
	} catch (error) {
		console.error("Error performing event image action:", error);
		return json(
			{
				success: false,
				error: "Network error. Please try again",
			},
			{ status: 500 },
		);
	}
};
