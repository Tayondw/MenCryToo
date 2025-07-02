import { ActionFunctionArgs, json, redirect } from "react-router-dom";

interface FormErrors {
	email?: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
	subject?: string;
	message?: string;
	backendError?: string;
}

export const contactActions = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	const intent = formData.get("intent") as string | null;
	const errors: FormErrors = {};

	if (intent === "create-contact") {
		const firstName = formData.get("firstName") as string | null;
		const lastName = formData.get("lastName") as string | null;
		const phone = formData.get("phone") as string | null;
		const email = formData.get("email") as string | null;
		const subject = formData.get("subject") as string | null;
		const message = formData.get("message") as string | null;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		// Validate fields
		if (!firstName || firstName.length < 3 || firstName.length > 20) {
			errors.firstName = "First name must be between 3 and 20 characters";
		}
		if (!lastName || lastName.length < 3 || lastName.length > 20) {
			errors.lastName = "Last name must be between 3 and 20 characters";
		}
		if (!email || email.length <= 0 || !emailRegex.test(email)) {
			errors.email = "Invalid email";
		} else if (email.length > 50) {
			errors.email = "Email must be less than 50 characters";
		}
		if (phone && isNaN(Number(phone))) {
			errors.phone = "Invalid phone number";
		}
		if (!subject || subject.length < 3 || subject.length > 20) {
			errors.subject = "Subject must be between 3 and 20 characters";
		}
		if (!message || message.length < 10 || message.length > 500) {
			errors.message =
				"Please enter at least 10 characters describing yourself";
		}

		// Return validation errors if any
		if (Object.keys(errors).length) {
			return json(errors);
		}

		try {
			const response = await fetch(`/api/contact/`, {
				method: "POST",
				body: formData,
			});

			if (response.ok) {
				return redirect("/success");
			} else {
				const errorData = await response.json();
				console.log("Error from backend:", errorData);
				return json({
					backendError: errorData.message || "Something went wrong",
				});
			}
		} catch (error) {
			console.error("Contact submission error:", error);
			return json({ backendError: "Network error occurred" });
		}
	}

	return json({ backendError: "Invalid intent" });
};
