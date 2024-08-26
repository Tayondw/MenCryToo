import { json } from "react-router-dom";

export const getLoader = async () => {
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

export const groupDetailsLoader = async ({ params }) => {
      console.log("params:", params);
      
	const response = await fetch(`/api/groups/${params.groupId}`);
	if (response.ok) {
		const groupDetails = await response.json();
		return groupDetails;
	}
};

export const eventDetailsLoader = async ({ params }) => {
	const response = await fetch(`/api/events/${params.eventId}`);
	if (response.ok) {
		const eventDetails = await response.json();
		return eventDetails;
	}
};

export const venueDetailsLoader = async ({ params }) => {
	const response = await fetch(`/api/venues/${params.venueId}`);
	if (response.ok) {
		const venueDetails = await response.json();
		return venueDetails;
	}
};

export const userDetailsLoader = async ({ params }) => {
	const response = await fetch(`/api/users/${params.userId}`);
	if (response.ok) {
		const userDetails = await response.json();
		return userDetails;
	}
};

export const postDetailsLoader = async ({ params }) => {
	const response = await fetch(`/api/posts/${params.postId}`);
	if (response.ok) {
		const postDetails = await response.json();
		return postDetails;
	}
};

// export const detailsLoader = async ({ params }) => {
//       console.log("params:", params);
      
// 	const urls = [
// 		`/api/groups/${params.groupId}`,
// 		`/api/events/${params.eventId}`,
// 		`/api/venues/${params.venueId}`,
// 		`/api/users/${params.userId}`,
// 		`/api/posts/${params.postId}`,
// 	];

// 	const fetchPromises = urls.map((url) =>
// 		fetch(url).then((response) => response.json()),
// 	);

// 	const [groupDetails, eventDetails, venueDetails, userDetails, postDetails] =
// 		await Promise.all(fetchPromises);

// 	return json({
// 		groupDetails,
// 		eventDetails,
// 		venueDetails,
// 		userDetails,
// 		postDetails,
// 	});
// };
