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

	console.log("Group Image Action called:", {
		intent,
		groupId,
		imageId,
		method: request.method,
		url: request.url,
	});

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

				console.log(
					"Attempting to upload group image to:",
					`/api/groups/${finalGroupId}/images`,
				);

				const response = await fetch(`/api/groups/${finalGroupId}/images`, {
					method: "POST",
					credentials: "include",
					body: formData,
				});

				console.log("Upload response status:", response.status);

				if (response.ok) {
					const result = await response.json();
					console.log("Upload successful:", result);

					return json({
						success: true,
						message: "Image uploaded successfully!",
						image: result.group_image,
					});
				} else {
					console.log(
						"Upload failed with status:",
						response.status,
						response.statusText,
					);
					const errorText = await response.text();
					console.log("Error response text:", errorText);

					const errorData = JSON.parse(errorText);
					return json(
						{
							success: false,
							error: errorData.message || "Failed to upload image",
						},
						{ status: response.status },
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

				console.log(
					"Attempting to edit group image:",
					`/api/groups/${groupId}/images/${imageId}/edit`,
				);

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
						{ status: response.status },
					);
				}
			}

			case "delete-group-image": {
				const imageIdFromForm = formData.get("imageId") as string;
				const finalImageId = imageId || imageIdFromForm;

				if (!finalImageId) {
					return json(
						{
							success: false,
							error: "Image ID is required",
						},
						{ status: 400 },
					);
				}

				console.log(
					"Attempting to delete group image:",
					`/api/group-images/${finalImageId}`,
				);

				const response = await fetch(`/api/group-images/${finalImageId}`, {
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
						{ status: response.status },
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

	console.log("Event Image Action called:", {
		intent,
		eventId,
		imageId,
		method: request.method,
		url: request.url,
	});

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

				console.log(
					"Attempting to upload event image to:",
					`/api/events/${finalEventId}/images`,
				);

				const response = await fetch(`/api/events/${finalEventId}/images`, {
					method: "POST",
					credentials: "include",
					body: formData,
				});

				console.log("Upload response status:", response.status);

				if (response.ok) {
					const result = await response.json();
					console.log("Upload successful:", result);

					return json({
						success: true,
						message: "Image uploaded successfully!",
						image: result.event_image,
					});
				} else {
					console.log(
						"Upload failed with status:",
						response.status,
						response.statusText,
					);
					const errorText = await response.text();
					console.log("Error response text:", errorText);

					const errorData = JSON.parse(errorText);
					return json(
						{
							success: false,
							error: errorData.message || "Failed to upload image",
						},
						{ status: response.status },
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

				console.log(
					"Attempting to edit event image:",
					`/api/events/${eventId}/images/${imageId}/edit`,
				);

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
						{ status: response.status },
					);
				}
			}

			case "delete-event-image": {
				const imageIdFromForm = formData.get("imageId") as string;
				const finalImageId = imageId || imageIdFromForm;

				if (!finalImageId) {
					return json(
						{
							success: false,
							error: "Image ID is required",
						},
						{ status: 400 },
					);
				}

				console.log(
					"Attempting to delete event image:",
					`/api/event-images/${finalImageId}`,
				);

				const response = await fetch(`/api/event-images/${finalImageId}`, {
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
						{ status: response.status },
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
