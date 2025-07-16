import { json } from "react-router-dom";
import { LoaderData } from "../../types/home";

export const getLoader = async (): Promise<Response> => {
	const urls = [`/api/groups`, `/api/events`, `/api/tags`];

	try {
		const fetchPromises = urls.map((url) =>
			fetch(url).then((response) => {
				if (!response.ok) {
					throw new Error(`Failed to fetch ${url}: ${response.status}`);
				}
				return response.json();
			}),
		);

		const [allGroups, allEvents, allTags] = await Promise.all(fetchPromises);

		const data: LoaderData = {
			allGroups,
			allEvents,
			allTags,
		};

		return json(data);
	} catch (error) {
		console.error("Error in getLoader:", error);
		// Return partial data or empty arrays if some requests fail
		const errorData: LoaderData = {
			allGroups: [],
			allEvents: [],
			allTags: [],
			error: "Failed to load some data",
		};

		return json(errorData);
	}
};
