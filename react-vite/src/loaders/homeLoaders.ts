// src/loaders/homeLoaders.ts
import { json } from "react-router-dom";
import { Group, Event, Tag, User } from "../types";

interface HomeLoaderData {
	allGroups: Group[];
	allEvents: Event[];
	allTags: Tag[];
	user: User | null;
	error?: string;
}

// Update your router index.tsx to use this loader instead of getLoader
export const homeLoader = async (): Promise<Response> => {
	try {
		// First check if user is authenticated
		let user = null;
		try {
			const authResponse = await fetch("/api/auth/", {
				headers: {
					"Cache-Control": "max-age=30", // Cache for 30 seconds
				},
			});

			if (authResponse.ok) {
				const contentType = authResponse.headers.get("content-type");
				if (contentType && contentType.includes("application/json")) {
					const userData = await authResponse.json();
					if (!userData.errors) {
						user = userData;
					}
				}
			}
		} catch (error) {
			console.log("User not authenticated, loading public data only", error);
		}

		// Load public data (groups, events, tags)
		const publicDataUrls = [`/api/groups`, `/api/events`, `/api/tags`];

		const fetchPromises = publicDataUrls.map((url) =>
			fetch(url).then((response) => {
				if (!response.ok) {
					throw new Error(`Failed to fetch ${url}: ${response.status}`);
				}
				return response.json();
			}),
		);

		const [groupsData, eventsData, allTags] = await Promise.all(fetchPromises);

		// Handle both paginated and non-paginated responses
		const allGroups = groupsData.groups || groupsData || [];
		const allEvents = eventsData.events || eventsData || [];

		const data: HomeLoaderData = {
			allGroups,
			allEvents,
			allTags,
			user,
		};

		return json(data);
	} catch (error) {
		console.error("Error in homeLoader:", error);
		// Return partial data or empty arrays if some requests fail
		const errorData: HomeLoaderData = {
			allGroups: [],
			allEvents: [],
			allTags: [],
			user: null,
			error: "Failed to load some data",
		};

		return json(errorData);
	}
};
