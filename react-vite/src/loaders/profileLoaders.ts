import { redirect, json } from "react-router-dom";

// Loader to fetch current user profile data
export const profileLoader = async ({
	params,
}: { params?: { id?: string } } = {}) => {
	try {
		const response = await fetch("/api/auth/");

		if (response.ok) {
			const user = await response.json();
			if (user.errors) {
				return redirect("/login");
			}

			// If we have a user ID in params, verify it matches the current user
			if (params?.id && user.id.toString() !== params.id) {
				return redirect("/profile"); // Redirect to their own profile
			}

			return { user };
		} else {
			return redirect("/login");
		}
	} catch (error) {
		console.error("Error loading profile:", error);
		return redirect("/login");
	}
};

// Action to handle profile update form submission
export const profileUpdateAction = async ({
	request,
	params,
}: {
	request: Request;
	params: { id?: string };
}) => {
	const formData = await request.formData();
	const intent = formData.get("intent");

	if (intent === "delete-profile") {
		const userId = formData.get("userId") as string;

		if (!userId) {
			return json({ error: "User ID is required" }, { status: 400 });
		}

		try {
			const response = await fetch(`/api/users/${userId}/profile/delete`, {
				method: "DELETE",
				body: formData,
			});

			if (response.ok) {
				// Redirect to home page after successful deletion
				return redirect("/");
			} else {
				return json({ error: "Failed to delete profile" }, { status: 500 });
			}
		} catch (error) {
			console.error("Error deleting profile:", error);
			return json(
				{ error: "Network error. Please try again" },
				{ status: 500 },
			);
		}
	}

	if (intent !== "update-profile") {
		return json({ error: "Invalid form submission" }, { status: 400 });
	}

	// Get the user ID from params or form data
	const userId = params.id || (formData.get("userId") as string);

	if (!userId) {
		return json({ errors: { server: "User ID is required" } }, { status: 400 });
	}

	// Validation
	const errors: Record<string, string> = {};

	const firstName = formData.get("firstName") as string;
	const lastName = formData.get("lastName") as string;
	const username = formData.get("username") as string;
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const confirmPassword = formData.get("confirmPassword") as string;
	const bio = formData.get("bio") as string;

	// Validation logic
	if (!firstName || firstName.length < 3 || firstName.length > 20) {
		errors.firstName = "First name must be between 3 and 20 characters";
	}

	if (!lastName || lastName.length < 3 || lastName.length > 20) {
		errors.lastName = "Last name must be between 3 and 20 characters";
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!email || !emailRegex.test(email)) {
		errors.email = "Please enter a valid email address";
	} else if (email.length > 50) {
		errors.email = "Email must be less than 50 characters";
	}

	if (!username || username.length < 3 || username.length > 20) {
		errors.username = "Username must be between 3 and 20 characters";
	}

	if (password && (password.length < 8 || password.length > 25)) {
		errors.password = "Password must be between 8 and 25 characters";
	}

	if (password !== confirmPassword) {
		errors.confirmPassword = "Passwords do not match";
	}

	if (!bio || bio.length < 50 || bio.length > 500) {
		errors.bio = "Bio must be between 50 and 500 characters";
	}

	const userTags = formData.getAll("userTags");
	if (userTags.length === 0) {
		errors.userTags = "Please select at least one tag";
	}

	// Return validation errors if any
	if (Object.keys(errors).length > 0) {
		return json({ errors }, { status: 400 });
	}

	try {
		// Submit to backend API
		const response = await fetch(`/api/users/${userId}/profile/update`, {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			// Success - redirect to profile page
			// The profile page will automatically reload with fresh data via its loader
			return redirect("/profile");
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
		console.error("Error updating profile:", error);
		return json(
			{
				errors: { server: "Network error. Please try again" },
			},
			{ status: 500 },
		);
	}
};

// Action to handle profile deletion
export const profileDeleteAction = async ({
	request,
}: {
	request: Request;
}) => {
	const formData = await request.formData();
	const intent = formData.get("intent");

	if (intent !== "delete-profile") {
		return json({ error: "Invalid form submission" }, { status: 400 });
	}

	const userId = formData.get("userId") as string;

	if (!userId) {
		return json({ error: "User ID is required" }, { status: 400 });
	}

	try {
		const response = await fetch(`/api/users/${userId}/profile/delete`, {
			method: "DELETE",
			body: formData,
		});

		if (response.ok) {
			// Redirect to home page after successful deletion
			return redirect("/");
		} else {
			return json({ error: "Failed to delete profile" }, { status: 500 });
		}
	} catch (error) {
		console.error("Error deleting profile:", error);
		return json({ error: "Network error. Please try again" }, { status: 500 });
	}
};
