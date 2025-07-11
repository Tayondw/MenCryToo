import { json } from "react-router-dom";
import { Group, Event, Tag, User } from "../types";

interface HomeLoaderData {
	allGroups: Group[];
	allEvents: Event[];
	allTags: Tag[];
	user: User | null;
	error?: string;
}

export const homeLoader = async (): Promise<Response> => {
	try {
		// First check if user is authenticated - handle 401 properly
		let user = null;
		try {
			const authResponse = await fetch("/api/auth/", {
				headers: {
					"Cache-Control": "max-age=30", // Cache for 30 seconds
				},
			});

			// Only process successful responses
			if (authResponse.ok) {
				const contentType = authResponse.headers.get("content-type");
				if (contentType && contentType.includes("application/json")) {
					const userData = await authResponse.json();
					if (!userData.errors) {
						user = userData;
					}
				}
			} else if (authResponse.status === 401) {
				// Expected for unauthenticated users - not an error
				console.log("User not authenticated, loading public data only");
			} else {
				console.warn(`Auth check returned status: ${authResponse.status}`);
			}
		} catch (error) {
			console.log("Auth check failed, loading public data only:", error);
		}

		// Load public data (groups, events, tags) regardless of auth status
		const publicDataUrls = [`/api/groups`, `/api/events`, `/api/tags`];

		const fetchPromises = publicDataUrls.map(async (url) => {
			try {
				const response = await fetch(url);
				if (!response.ok) {
					console.warn(`Failed to fetch ${url}: ${response.status}`);
					return null;
				}
				return await response.json();
			} catch (error) {
				console.warn(`Error fetching ${url}:`, error);
				return null;
			}
		});

		const [groupsData, eventsData, allTags] = await Promise.all(fetchPromises);

		// Handle both paginated and non-paginated responses with null checks
		const allGroups = groupsData?.groups || groupsData || [];
		const allEvents = eventsData?.events || eventsData || [];
		const tags = allTags || [];

		const data: HomeLoaderData = {
			allGroups,
			allEvents,
			allTags: tags,
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
