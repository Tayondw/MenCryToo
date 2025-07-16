export const tagsLoader = async () => {
	try {
		const response = await fetch("/api/tags");

		if (!response.ok) {
			throw new Error(`Failed to fetch tags: ${response.status}`);
		}

		const tags = await response.json();
		return { tags };
	} catch (error) {
		console.error("Error loading tags:", error);
		// Return empty array on error instead of throwing
		return { tags: [] };
	}
};
