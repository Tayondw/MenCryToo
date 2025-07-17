import { json } from "react-router-dom";
import { HomeLoaderData } from "../../types/home";

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

			if (authResponse.ok) {
				const contentType = authResponse.headers.get("content-type");
				if (contentType && contentType.includes("application/json")) {
					const authData = await authResponse.json();
					// Check the new response structure
					if (
						authData.authenticated &&
						authData.user &&
						!authData.user.errors
					) {
						user = authData.user;
					}
				}
			}
		} catch (error) {
			console.error("Auth check failed, loading public data only:", error);
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
