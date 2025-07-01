import { redirect, json } from "react-router-dom";

// Optimized loader for posts feed with pagination and caching
export const postsLoader = async ({
	request,
}: {
	request?: Request;
} = {}) => {
	try {
		// Quick auth check with caching
		const authResponse = await fetch("/api/auth/", {
			headers: {
				"Cache-Control": "max-age=30",
			},
		});

		if (!authResponse.ok) {
			return redirect("/login");
		}

		const authData = await authResponse.json();
		if (authData.errors) {
			return redirect("/login");
		}

		// Get pagination parameters
		const url = request ? new URL(request.url) : new URL(window.location.href);
		const page = parseInt(url.searchParams.get("page") || "1");
		const perPage = Math.min(
			parseInt(url.searchParams.get("per_page") || "20"),
			50,
		);

		// Fetch posts with pagination
		const response = await fetch(
			`/api/posts/feed?page=${page}&per_page=${perPage}`,
			{
				headers: {
					"Cache-Control": "max-age=60", // Cache posts for 1 minute
				},
			},
		);

		if (!response.ok) {
			throw new Error("Failed to fetch posts");
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error loading posts:", error);
		return { posts: [], pagination: {} };
	}
};

// Optimized loader for similar posts/users
export const similarPostsLoader = async ({
	request,
}: {
	request?: Request;
} = {}) => {
	try {
		// Get current user for similarity matching
		const authResponse = await fetch("/api/auth/", {
			headers: {
				"Cache-Control": "max-age=30",
			},
		});

		if (!authResponse.ok) {
			return redirect("/login");
		}

		const currentUser = await authResponse.json();
		if (currentUser.errors) {
			return redirect("/login");
		}

		// Get pagination params
		const url = request ? new URL(request.url) : new URL(window.location.href);
		const page = parseInt(url.searchParams.get("page") || "1");
		const perPage = Math.min(
			parseInt(url.searchParams.get("per_page") || "20"),
			50,
		);

		// Fetch users with similar interests
		const response = await fetch(
			`/api/users/profile-feed?page=${page}&per_page=${perPage}`,
			{
				headers: {
					"Cache-Control": "max-age=120", // Cache for 2 minutes
				},
			},
		);

		if (!response.ok) {
			throw new Error("Failed to fetch similar users");
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error loading similar posts:", error);
		return { users_profile: [] };
	}
};

// Action for post operations (create, edit, delete, like)
export const postAction = async ({
	request,
	params,
}: {
	request: Request;
	params: { postId?: string };
}) => {
	const formData = await request.formData();
	const intent = formData.get("intent") as string;

	try {
		switch (intent) {
			case "create-post": {
				// Validate post data
				const errors: Record<string, string> = {};
				const title = formData.get("title") as string;
				const caption = formData.get("caption") as string;
				const image = formData.get("image") as File;
				const userId = formData.get("userId") as string;

				if (!title || title.length < 5 || title.length > 25) {
					errors.title = "Title must be between 5 and 25 characters";
				}
				if (!caption || caption.length < 5 || caption.length > 250) {
					errors.caption = "Caption must be between 5 and 250 characters";
				}
				if (!image) {
					errors.image = "Image is required";
				}
				if (!userId) {
					errors.server = "User ID is required";
				}

				if (Object.keys(errors).length > 0) {
					return json({ errors }, { status: 400 });
				}

				const response = await fetch(`/api/users/${userId}/posts/create`, {
					method: "POST",
					body: formData,
				});

				if (response.ok) {
					return redirect("/posts-feed");
				} else {
					const errorData = await response.json();
					return json({ errors: errorData }, { status: 400 });
				}
			}

			case "edit-post": {
				const postId = formData.get("postId") as string;
				const userId = formData.get("userId") as string;

				if (!postId || !userId) {
					return json(
						{ error: "Post ID and User ID are required" },
						{ status: 400 },
					);
				}

				// Validate edited data
				const errors: Record<string, string> = {};
				const title = formData.get("title") as string;
				const caption = formData.get("caption") as string;

				if (!title || title.length < 5 || title.length > 25) {
					errors.title = "Title must be between 5 and 25 characters";
				}
				if (!caption || caption.length < 5 || caption.length > 250) {
					errors.caption = "Caption must be between 5 and 250 characters";
				}

				if (Object.keys(errors).length > 0) {
					return json({ errors }, { status: 400 });
				}

				const response = await fetch(`/api/users/${userId}/posts/${postId}`, {
					method: "POST",
					body: formData,
				});

				if (response.ok) {
					return redirect("/profile");
				} else {
					const errorData = await response.json();
					return json({ errors: errorData }, { status: 400 });
				}
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
					return redirect("/profile");
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
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (response.ok) {
					// Return success without redirect for like actions
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
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (response.ok) {
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

// Loader for single post details
export const postDetailsLoader = async ({
	params,
}: {
	params: { postId: string };
}) => {
	try {
		const response = await fetch(`/api/posts/${params.postId}`, {
			headers: {
				"Cache-Control": "max-age=120", // Cache post details for 2 minutes
			},
		});

		if (!response.ok) {
			throw new Error("Failed to fetch post details");
		}

		const postDetails = await response.json();
		return postDetails;
	} catch (error) {
		console.error("Error loading post details:", error);
		return redirect("/posts-feed");
	}
};
