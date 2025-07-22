import { redirect, json } from "react-router-dom";
import { clearCache } from "../../../utils/cache";

// MAIN ACTION HANDLER - reads FormData only once
export const postAction = async ({
	request,
	params,
}: {
	request: Request;
	params: { postId?: string };
}) => {
	// READ FORMDATA ONLY ONCE at the very beginning
	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	try {
		switch (intent) {
			case "create-post": {
				const userId = formData.get("userId") as string;
				const title = formData.get("title") as string;
				const caption = formData.get("caption") as string;
				const image = formData.get("image") as File;

				// Validate data
				const errors: Record<string, string> = {};

				if (!title || title.length < 5 || title.length > 25) {
					errors.title = "Title must be between 5 and 25 characters";
				}
				if (!caption || caption.length < 50 || caption.length > 500) {
					errors.caption = "Caption must be between 50 and 500 characters";
				}
				if (!image || image.size === 0) {
					errors.image = "Image is required";
				}
				if (!userId) {
					errors.server = "User ID is required";
				}

				if (Object.keys(errors).length > 0) {
					return json({ errors }, { status: 400 });
				}

				// Create new FormData for API call
				const apiFormData = new FormData();
				apiFormData.append("title", title);
				apiFormData.append("caption", caption);
				apiFormData.append("image", image);

				const response = await fetch(`/api/users/${userId}/posts/create`, {
					method: "POST",
					body: apiFormData,
				});

				if (!response.ok) {
					const errorData = await response.json();
					return json({ errors: errorData }, { status: 400 });
				}

				clearCache("posts");
				clearCache("profile");
				return redirect("/profile");
			}

			case "edit-post": {
				const postId = (formData.get("postId") as string) || params.postId;
				const userId = formData.get("userId") as string;
				const title = formData.get("title") as string;
				const caption = formData.get("caption") as string;
				const image = formData.get("image") as File;

				// Validate data
				const errors: Record<string, string> = {};

				if (!title || title.length < 5 || title.length > 25) {
					errors.title = "Title must be between 5 and 25 characters";
				}
				if (!caption || caption.length < 50 || caption.length > 500) {
					errors.caption = "Caption must be between 50 and 500 characters";
				}

				if (Object.keys(errors).length > 0) {
					return json({ errors }, { status: 400 });
				}

				// Create new FormData for API call
				const apiFormData = new FormData();
				apiFormData.append("title", title);
				apiFormData.append("caption", caption);
				if (image && image.size > 0) {
					apiFormData.append("image", image);
				}

				const response = await fetch(`/api/users/${userId}/posts/${postId}`, {
					method: "POST",
					body: apiFormData,
				});

				if (!response.ok) {
					const errorData = await response.json();
					return json({ errors: errorData }, { status: 400 });
				}

				clearCache(`post-${postId}`);
				clearCache("posts");
				clearCache("profile");
				return (window.location.href = "/profile");
			}

			case "delete-post": {
				const postId = (formData.get("postId") as string) || params.postId;

				if (!postId) {
					return json({ error: "Post ID is required" }, { status: 400 });
				}

				const response = await fetch(`/api/posts/${postId}/delete`, {
					method: "DELETE",
				});

				if (response.ok) {
					clearCache(`post-${postId}`);
					clearCache("posts");
					clearCache("profile");
					return (window.location.href = "/profile");
				} else {
					return json({ error: "Failed to delete post" }, { status: 500 });
				}
			}

			case "like-post": {
				const postId = (formData.get("postId") as string) || params.postId;

				if (!postId) {
					return json({ error: "Post ID is required" }, { status: 400 });
				}

				const response = await fetch(`/api/posts/${postId}/like`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				});

				if (response.ok) {
					clearCache(`post-${postId}`);
					clearCache("posts");
					return json({ success: true });
				} else {
					return json({ error: "Failed to like post" }, { status: 500 });
				}
			}

			case "unlike-post": {
				const postId = (formData.get("postId") as string) || params.postId;

				if (!postId) {
					return json({ error: "Post ID is required" }, { status: 400 });
				}

				const response = await fetch(`/api/posts/${postId}/unlike`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				});

				if (response.ok) {
					clearCache(`post-${postId}`);
					clearCache("posts");
					return json({ success: true });
				} else {
					return json({ error: "Failed to unlike post" }, { status: 500 });
				}
			}

			default:
				return json({ error: "Invalid action" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error performing post action:", error);
		return json({ error: "Network error. Please try again" }, { status: 500 });
	}
};
