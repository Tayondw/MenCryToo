import { redirect } from "react-router-dom";

export const groupActions = async ({ request }) => {
	const formData = await request.formData();
	const data = Object.fromEntries(formData);
	const intent = formData.get("intent");

	if (intent === "create-group" || intent === "edit-group") {
		const name = formData.get("name");
		const about = formData.get("about");
		const type = formData.get("type");
		const city = formData.get("city");
		const state = formData.get("state");
		const image = formData.get("image");
		const errors = {};

		if (!name.length || name.length < 3 || name.length > 50)
			errors.name = "Group name must be between 3 and 50 characters";
		if (!about.length || about.length < 20 || about.length > 150)
			errors.about =
				"Description must be at least 20 characters and no more than 150 characters";
		if (!type) errors.type = "Group Type is required";
		if (!city.length || city.length < 3 || city.length > 30)
			errors.city = "City name must be between 3 and 30 characters";
		if (!state.length || state.length < 2 || state.length > 2)
			errors.state = "Please enter the abbreviated form of the state";

		// Only require image if the group does not already have one
		if (intent === "create-group" && !image)
			errors.image = "Group image is required to create a group";

		if (Object.keys(errors).length) {
			return errors;
		}

		data.id = +data.id;
		data.organizer_id = +data.organizer_id;
		data.group_id = +data.group_id;
	}

	if (intent === "create-group") {
		await fetch(`/api/groups/new`, {
			method: "POST",
			body: formData,
		});
		return redirect("/groups");
	}

	if (intent === "edit-group") {
		await fetch(`/api/groups/${data.id}/edit`, {
			method: "POST",
			body: formData,
		});

		return redirect(`/groups/${data.id}`);
	}

	if (intent === "delete-group") {
		await fetch(`/api/groups/${data.id}/delete`, {
			method: "DELETE",
		});
		return redirect("/groups");
	}

	if (intent === "add-group-image" || intent === "edit-group-image") {
		data.id = +data.id;
		data.imageId = +data.imageId;
	}

	if (intent === "add-group-image") {
		await fetch(`/api/groups/${data.id}/images`, {
			method: "POST",
			body: formData,
		});

		return redirect(`/groups/${data.id}`);
	}

	if (intent === "edit-group-image") {
		await fetch(`/api/groups/${data.id}/images/${data.imageId}/edit`, {
			method: "POST",
			body: formData,
		});
		return redirect(`/groups/${data.id}`);
	}

	if (intent === "join-group") {
		data.id = +data.id;
		data.userId = +data.userId;
		await fetch(`/api/groups/${+data.id}/join-group`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				group_id: data.id,
				user_id: data.userId,
			}),
		});
		return redirect(`/groups/${data.id}`);
	}

	if (intent === "leave-group") {
		data.id = +data.id;
		data.userId = +data.userId;
		data.memberId = +data.memberId;
		await fetch(`/api/groups/${data.id}/leave-group/${data.memberId}`, {
			method: "DELETE",
		});
		return redirect(`/groups`);
	}
};

export const eventActions = async ({ request }) => {
	const formData = await request.formData();
	const data = Object.fromEntries(formData);
	const intent = formData.get("intent");

	// Only validate fields for creation and editing
	if (intent === "create-event" || intent === "edit-event") {
		const name = formData.get("name");
		const description = formData.get("description");
		const type = formData.get("type");
		const capacity = formData.get("capacity");
		const image = formData.get("image");
		const startDate = formData.get("startDate");
		const endDate = formData.get("endDate");
		const today = new Date();
		const errors = {};

		if (!name || name.length < 5 || name.length > 50)
			errors.name = "Event name must be between 5 and 50 characters";
		if (!description || description.length < 50 || description.length > 150)
			errors.description =
				"Description must be at least 50 characters and no more than 150 characters";
		if (!type) errors.type = "Event Type is required";
		if (!capacity || capacity < 2 || capacity > 300)
			errors.capacity =
				"Event capacity must have at least two people attending and cannot exceed more than 300 people";
		// Only require image if the group does not already have one
		if (intent === "create-event" && !image)
			errors.image = "Group image is required to create a group";

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

		if (Object.keys(errors).length) {
			return errors;
		}

		data.capacity = +data.capacity;
            data.group_id = +data.group_id;
	}

	// Execute action based on the intent
	if (intent === "create-event") {
		await fetch(`/api/groups/${data.group_id}/events/new`, {
			method: "POST",
			body: formData,
		});
		return redirect("/events");
	}

      if (intent === "edit-event") {
            data.eventId = +data.eventId
		await fetch(`/api/groups/${data.group_id}/events/${data.eventId}`, {
			method: "POST",
			body: formData,
		});
		return window.location.href = `/events/${data.eventId}`;
	}

	if (intent === "delete-event") {
		await fetch(`/api/events/${data.id}`, {
			method: "DELETE",
		});
		return redirect("/events");
	}

	if (intent === "add-event-image") {
		data.eventId = +data.eventId;
		data.imageId = +data.imageId;
		await fetch(`/api/events/${data.eventId}/images`, {
			method: "POST",
			body: formData,
		});
		return redirect(`/events/${data.eventId}`);
	}

	if (intent === "edit-event-image") {
		data.eventId = +data.eventId;
		data.imageId = +data.imageId;
		await fetch(`/api/events/${data.eventId}/images/${data.imageId}/edit`, {
			method: "POST",
			body: formData,
		});
		return redirect(`/events/${data.eventId}`);
	}

	if (intent === "attend-event") {
		data.id = +data.id;
		data.userId = +data.userId;
		data.attendeeId = +data.attendeeId;
		await fetch(`/api/events/${data.id}/attend-event`, {
			method: "POST",
			body: JSON.stringify({
				event_id: data.id,
				user_id: data.userId,
			}),
		});
		return redirect(`/events/${data.id}`);
	}

	if (intent === "leave-event") {
		data.id = +data.id;
		data.userId = +data.userId;
		data.attendeeId = +data.attendeeId;
		return await fetch(
			`/api/events/${data.id}/leave-event/${data.attendeeId}`,
			{
				method: "DELETE",
			},
		);
	}
};

export const venueActions = async ({ request }) => {
	let formData = await request.formData();
	let data = Object.fromEntries(formData);
	let intent = formData.get("intent");
	data.id = +data.id;

	if (intent === "create-venue") {
		return await fetch(`/api/groups/${data.id}/venues`, {
			method: "POST",
			body: formData,
		});
	}

	if (intent === "edit-venue") {
		return await fetch(`/api/venues/${data.id}/edit`, {
			method: "POST",
			body: formData,
		});
	}
};

export const profileActions = async ({ request }) => {
	const formData = await request.formData();
	const intent = formData.get("intent");
	const data = Object.fromEntries(formData);
	const errors = {};
	// Handle profile deletion separately
	if (intent === "delete-profile") {
		const userId = formData.get("userId");
		await fetch(`/api/users/${userId}/profile/delete`, {
			method: "DELETE",
		});
		return (window.location.href = "/");
	}
	if (intent === "update-profile") {
		// For other actions like create or update profile
		const firstName = formData.get("firstName");
		const lastName = formData.get("lastName");
		const username = formData.get("username");
		const email = formData.get("email");
		const password = formData.get("password");
		const confirmPassword = formData.get("confirmPassword");
		const bio = formData.get("bio");
		const profileImage = formData.get("profileImage");
		// const userTags = formData.getAll("userTags");

		if (password !== confirmPassword)
			errors.confirmPassword =
				"Confirm Password field must be the same as the Password field";
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (email) {
			if (email.length > 50)
				errors.email = "Email must be less than 50 characters";
		}
		if (!emailRegex.test(email) || email.length <= 0)
			errors.email = "Invalid email";
		if (username) {
			if (username.length > 20)
				errors.username =
					"Username too long! Come on, who ya tryna confuse? Yourself?";
			if (username.length < 3)
				errors.username = "Username is too short! At least 3 characters man!";
			if (!username.length)
				errors.username =
					"Now you know you need a username, I need 3 to 20 characters for you to signup!";
		}
		if (password) {
			if (password.length > 25) errors.password = "Password is too long!";
			if (password.length < 8) errors.password = "Password is too short!";
			if (password.length < 0) errors.password = "Password is required";
		}
		if (!firstName.length || firstName.length < 3 || firstName.length > 20)
			errors.firstName = "First name must be between 3 and 20 characters";
		if (!lastName.length || lastName.length < 3 || lastName.length > 20)
			errors.lastName = "Last name must be between 3 and 20 characters";
		if (!bio.length || bio.length < 50 || bio.length > 500)
			errors.bio = "Please enter at least 50 characters describing yourself";

		// Only require profileImage if the user does not already have one
		if (intent === "create-profile" && !profileImage)
			errors.profileImage = "Please add a profile image";

		if (Object.keys(errors).length) {
			return errors;
		}

		data.userId = +data.userId;

		const response = await fetch(`/api/users/${data.userId}/profile/update`, {
			method: "POST",
			body: formData,
		});
		if (response.ok) {
			return (window.location.href = "/profile");
			// return redirect("/profile")
		}
	}
};

export const postActions = async ({ request }) => {
	let formData = await request.formData();
	let data = Object.fromEntries(formData);
	let intent = formData.get("intent");
	const errors = {};

	if (intent === "create-post" || intent === "edit-post") {
		data.userId = +data.userId;
		data.postId = +data.postId;
		const title = formData.get("title");
		const caption = formData.get("caption");
		const image = formData.get("image");

		if (!title.length || title.length < 5 || title.length > 25)
			errors.title = "Title must be between 3 and 20 characters";
		if (!caption.length || caption.length < 50 || caption.length > 500)
			errors.caption = "Caption must be between 5 and 250 characters";
		if (intent === "create-post" && !image)
			errors.image = "Please add an image";
		if (Object.keys(errors).length) return errors;
	}

	if (intent === "create-post") {
		const response = await fetch(`/api/users/${data.userId}/posts/create`, {
			method: "POST",
			body: formData,
		});
		if (response.ok) return (window.location.href = "/posts-feed");
		else console.log(errors);
	}

	if (intent === "edit-post") {
		const response = await fetch(
			`/api/users/${data.userId}/posts/${data.postId}`,
			{
				method: "POST",
				body: formData,
			},
		);
		if (response.ok) return (window.location.href = "/profile");
		else console.log(errors);
      }
      
      if (intent === "delete-post") {
            data.postId = +data.postId;
		await fetch(`/api/posts/${data.postId}/delete`, {
			method: "DELETE",
            });
            return window.location.href = "/profile"
	}
	// if (intent === "add-comment") {
	// 	data.commentId = +data.commentId;
	// 	return await fetch(`/api/posts/${data.id}/comments`, {
	// 		method: "POST",
	// 		body: formData,
	// 	});
	// }

	// if (intent === "remove-comment") {
	// 	return await fetch(`/api/posts/${data.id}/comments/${data.commentId}`, {
	// 		method: "DELETE",
	// 		body: formData,
	// 	});
	// }

	// if (intent === "add-like") {
	// 	return await fetch(`/api/posts/${data.id}/like`, {
	// 		method: "POST",
	// 		body: formData,
	// 	});
	// }

	// if (intent === "remove-like") {
	// 	return await fetch(`/api/posts/${data.id}/unlike`, {
	// 		method: "POST",
	// 		body: formData,
	// 	});
	// }
};

export const partnershipActions = async ({ request }) => {
	let formData = await request.formData();
	// let data = Object.fromEntries(formData);
	let intent = formData.get("intent");
	const errors = {};

	if (intent === "create-partnership") {
		const firstName = formData.get("firstName");
		const lastName = formData.get("lastName");
		const phone = formData.get("phone");
		const email = formData.get("email");
		const subject = formData.get("subject");
		const message = formData.get("message");
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (email) {
			if (email.length > 50)
				errors.email = "Email must be less than 50 characters";
		}
		if (!emailRegex.test(email) || email.length <= 0)
			errors.email = "Invalid email";
		if (!firstName.length || firstName.length < 3 || firstName.length > 20)
			errors.firstName = "First name must be between 3 and 20 characters";
		if (!lastName.length || lastName.length < 3 || lastName.length > 20)
			errors.lastName = "Last name must be between 3 and 20 characters";
		if (isNaN(Number(phone))) {
			errors.phone = "Invalid phone number";
		}
		if (!subject.length || subject.length < 3 || subject.length > 20)
			errors.subject = "Subject must be between 3 and 20 characters";
		if (!message.length || message.length < 10 || message.length > 500)
			errors.message =
				"Please enter at least 10 characters describing yourself";
		if (Object.keys(errors).length) {
			return errors;
		}

		const response = await fetch(`/api/partnerships/`, {
			method: "POST",
			body: formData,
		});
		if (response.ok) return redirect("/");
	}
};
