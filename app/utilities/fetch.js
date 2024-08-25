// Delete a group by its id
fetch("api/groups/11/delete", {
	method: "DELETE",
	headers: {
		"content-type": "application/json",
	},
});

// Delete a group image by its id
fetch("api/group-images/14", {
	method: "DELETE",
	headers: {
		"content-type": "application/json",
	},
});

// Delete an event by its id
fetch("api/events/11", {
	method: "DELETE",
	headers: {
		"content-type": "application/json",
	},
});

// Delete an event image by its id
fetch("api/event-images/11", {
	method: "DELETE",
	headers: {
		"content-type": "application/json",
	},
});

// Delete profile by its id
fetch("api/users/12/profile/delete", {
	method: "DELETE",
	headers: {
		"content-type": "application/json",
	},
});

