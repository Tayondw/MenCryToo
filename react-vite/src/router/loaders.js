import { json } from "react-router-dom";

export const getLoader = async () => {
	// const response = await fetch(`/api/groups/`);

	// if (response.ok) {
	// 	const allGroups = await response.json();

	// 	return allGroups.groups;
	// }

	const urls = [
		`/api/groups/`,
		`/api/events/`,
		`/api/users/`,
		`/api/venues/`,
		`/api/posts/feed`,
		`/api/users/profile-feed`,
	];

	const fetchPromises = urls.map((url) =>
		fetch(url).then((response) => response.json()),
	);

	const [allGroups, allEvents, allUsers, allVenues, allPosts, allProfiles] =
		await Promise.all(fetchPromises);

	return json({
		allGroups,
		allEvents,
		allUsers,
		allVenues,
		allPosts,
		allProfiles,
	});
};

export const detailsLoader = async ({ params }) => {
	const urls = [
		`/api/groups/${params.groupId}`,
		`/api/events/${params.eventId}`,
		`/api/venues/${params.venueId}`,
		`/api/users/${params.userId}`,
		`/api/users/${params.userId}`,
	];
};
