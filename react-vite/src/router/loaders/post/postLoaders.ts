import { redirect, LoaderFunctionArgs } from "react-router-dom";
import {
	FeedPost,
	PostLoaderResponse,
	PostApiResponse,
} from "../../../types/posts";
import { FeedUser } from "../../../types/users";

export const similarPostsLoader = async ({
	request,
}: {
	request?: Request;
} = {}): Promise<PostLoaderResponse> => {
	try {
		const authResponse = await fetch("/api/auth/");
		if (!authResponse.ok) return redirect("/login") as never;

		const authData = await authResponse.json();
		if (authData.errors) return redirect("/login") as never;

		const url = request ? new URL(request.url) : new URL(window.location.href);
		const page = parseInt(url.searchParams.get("page") || "1");
		const perPage = parseInt(url.searchParams.get("per_page") || "20");

		const response = await fetch(
			`/api/posts/similar-feed?page=${page}&per_page=${perPage}`,
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("API Error:", response.status, errorText);
			throw new Error(`HTTP ${response.status}`);
		}

		const data: PostApiResponse = await response.json();

		const postsByUser: Record<number, FeedPost[]> = {};
		const userInfo: Record<number, Omit<FeedUser, "posts">> = {};

		if (data.posts && Array.isArray(data.posts)) {
			data.posts.forEach((post: FeedPost) => {
				if (post.user) {
					const userId = post.user.id;

					if (!userInfo[userId]) {
						userInfo[userId] = {
							id: post.user.id,
							username: post.user.username,
							firstName: post.user.firstName || "",
							lastName: post.user.lastName || "",
							email: "",
							bio: "",
							profileImage: post.user.profileImage,
							usersTags: [],
							createdAt: "",
							updatedAt: "",
						};
					}

					if (!postsByUser[userId]) {
						postsByUser[userId] = [];
					}
					postsByUser[userId].push(post);
				}
			});
		}

		const users_profile: FeedUser[] = Object.keys(userInfo).map((userIdStr) => {
			const userId = parseInt(userIdStr);
			return {
				...userInfo[userId],
				posts: postsByUser[userId] || [],
			};
		});

		return {
			users_profile,
			pagination: data.pagination,
			totalPosts: data.posts?.length || 0,
			message: data.message,
		};
	} catch (error) {
		console.error("Error loading posts:", error);
		return {
			users_profile: [],
			pagination: {
				page: 1,
				pages: 0,
				per_page: 20,
				total: 0,
				has_next: false,
				has_prev: false,
			},
			totalPosts: 0,
			error: `Failed to load posts: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		};
	}
};

export const postDetailsLoader = async ({ params }: LoaderFunctionArgs) => {
	const { postId } = params;

	if (!postId) {
		throw new Error("Post ID is required");
	}

	try {
		const response = await fetch(`/api/posts/${postId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "max-age=120",
			},
		});

		if (!response.ok) {
			throw new Error("Failed to fetch post details");
		}

		const postDetails = await response.json();
		return postDetails;
	} catch (error) {
		console.error("Error loading post details:", error);
		return redirect("/similar-feed");
	}
};
