import { redirect, json } from "react-router-dom";

// Signup action to handle form submission
export const signupAction = async ({ request }: { request: Request }) => {
	const formData = await request.formData();

	// Get form data
	const email = formData.get("email") as string;
	const username = formData.get("username") as string;
	const password = formData.get("password") as string;
	const confirmPassword = formData.get("confirmPassword") as string;
	const firstName = formData.get("firstName") as string;
	const lastName = formData.get("lastName") as string;
	const bio = formData.get("bio") as string;
	const profileImage = formData.get("profileImage") as File;
	const userTags = formData.getAll("userTags") as string[];

	// Validation
	const errors: Record<string, string> = {};

	if (password !== confirmPassword) {
		errors.confirmPassword =
			"Confirm Password field must be the same as the Password field";
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (email.length > 50) errors.email = "Email must be less than 50 characters";
	if (!emailRegex.test(email) || email.length <= 0)
		errors.email = "Invalid email";
	if (username.length > 20)
		errors.username =
			"Username too long! Come on, who ya tryna confuse? Yourself?";
	if (username.length < 3)
		errors.username = "Username is too short! At least 3 characters man!";
	if (!username.length)
		errors.username =
			"Now you know you need a username, I need 3 to 20 characters for you to signup!";
	if (password.length > 25) errors.password = "Password is too long!";
	if (password.length < 8) errors.password = "Password is too short!";
	if (password.length < 0) errors.password = "Password is required";
	if (!firstName.length || firstName.length < 3 || firstName.length > 20)
		errors.firstName = "First name must be between 3 and 20 characters";
	if (!lastName.length || lastName.length < 3 || lastName.length > 20)
		errors.lastName = "Last name must be between 3 and 20 characters";
	if (!bio.length || bio.length < 50 || bio.length > 500)
		errors.bio = "Please enter at least 50 characters describing yourself";
	if (!profileImage) errors.profileImage = "Please add a profile image";
	if (!userTags.length)
		errors.userTags = "Please select 1 or more tags that fit your description";

	if (Object.keys(errors).length > 0) {
		return json({ errors }, { status: 400 });
	}

	try {
		// Submit to backend
		const response = await fetch("/api/auth/signup", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			const data = await response.json();

			// Handle group/event joining if needed
			const url = new URL(request.url);
			const groupId = url.searchParams.get("groupId");
			const eventId = url.searchParams.get("eventId");

			if (groupId) {
				await fetch(`/api/groups/${groupId}/join-group`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ group_id: groupId, user_id: data.id }),
				});
			}

			if (eventId) {
				await fetch(`/api/events/${eventId}/attend-event`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ event_id: eventId, user_id: data.id }),
				});
			}

			// Redirect to home or intended destination
			const from = url.searchParams.get("from") || "/";
			return redirect(from);
		} else {
			const errorData = await response.json();
			return json({ errors: errorData }, { status: 400 });
		}
	} catch (error) {
		console.error("Signup error:", error);
		return json(
			{
				errors: { server: "Something went wrong. Please try again." },
			},
			{ status: 500 },
		);
	}
};

// Login action
export const loginAction = async ({ request }: { request: Request }) => {
	const formData = await request.formData();
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	const errors: Record<string, string> = {};

	if (!email || email.length < 4) errors.email = "Email is required";
	if (!password || password.length < 6)
		errors.password = "Password must be at least 6 characters";

	if (Object.keys(errors).length > 0) {
		return json({ errors }, { status: 400 });
	}

	try {
		const response = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});

		if (response.ok) {
			const url = new URL(request.url);
			const from = url.searchParams.get("from") || "/";
			return redirect(from);
		} else if (response.status < 500) {
			const errorData = await response.json();
			return json({ errors: errorData }, { status: 400 });
		} else {
			return json(
				{
					errors: { server: "Something went wrong. Please try again" },
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("Login error:", error);
		return json(
			{
				errors: { server: "Network error. Please try again" },
			},
			{ status: 500 },
		);
	}
};
