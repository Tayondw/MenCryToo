// Create a group
fetch("api/groups/new", {
	method: "POST",
	headers: {
		"content-type": "application/json",
	},
	body: JSON.stringify({
		name: "New Group",
		about: "This is to test and to verify if the new group is added via fetch",
		type: "online",
            city: "city",
            state: "state",
		organizer_id: 1,
	}),
});

// Read all groups
fetch("api/groups/", {
	method: "GET",
	headers: {
		"content-type": "application/json",
	},
});

// Read all groups by group_id
fetch("api/groups/1", {
	method: "GET",
	headers: {
		"content-type": "application/json",
	},
});

// Update a portfolio's name by its id
fetch("api/portfolios/1", {
	method: "PUT",
	headers: {
		"content-type": "application/json",
	},
	body: JSON.stringify({
		portfolio_name: "New Portfolio Name",
	}),
});

// Update a portfolio's cash balance by its id
fetch("api/portfolios/1/cash", {
	method: "PUT",
	headers: {
		"content-type": "application/json",
	},
	body: JSON.stringify({
		cash: 100,
	}),
});

// Delete a portfolio by its id
fetch("api/portfolios/2", {
	method: "DELETE",
	headers: {
		"content-type": "application/json",
	},
});

// Create a watch_list
fetch("api/watch_lists/", {
	method: "POST",
	headers: {
		"content-type": "application/json",
	},
	body: JSON.stringify({
		name: "New Watch List",
	}),
});

// Read all watch_lists
fetch("api/watch_lists/", {
	method: "GET",
	headers: {
		"content-type": "application/json",
	},
});

// Read all watch_lists by user_id
fetch("api/watch_lists/1", {
	method: "GET",
	headers: {
		"content-type": "application/json",
	},
});

// Update a watch list's name by its id
fetch("api/watch_lists/1", {
	method: "PUT",
	headers: {
		"content-type": "application/json",
	},
	body: JSON.stringify({
		name: "New Watch List Name",
	}),
});

// Add stock to watch list by its id
fetch("api/watch_lists/1/add", {
	method: "PUT",
	headers: {
		"content-type": "application/json",
	},
	body: JSON.stringify({
		stock_id: 515,
	}),
});

// Remove stock from watch list by its id
fetch("api/watch_lists/1/remove", {
	method: "PUT",
	headers: {
		"content-type": "application/json",
	},
	body: JSON.stringify({
		stock_id: 515,
	}),
});

// Delete a watch list by its id
fetch("api/watch_lists/3", {
	method: "DELETE",
	headers: {
		"content-type": "application/json",
	},
});

// Create a transaction
fetch("/api/transactions/", {
	method: "POST",
	headers: {
		"content-type": "application/json",
	},
	body: JSON.stringify({
		portfolio_id: 1,
		type: "BUY",
		ticker: "GOOG",
		quantity: 10,
		transaction_price: 1653.9,
	}),
});

// Read all transactions
fetch("/api/transactions/", {
	method: "GET",
	headers: {
		"content-type": "application/json",
	},
});

// Read all transactions by portfolio_id
fetch("/api/transactions/1", {
	method: "GET",
	headers: {
		"content-type": "application/json",
	},
});

// Read all stocks
fetch("api/stocks/", {
	method: "GET",
	headers: {
		"content-type": "application/json",
	},
});

// Read stock by its id
fetch("api/stocks/1", {
	method: "GET",
	headers: {
		"content-type": "application/json",
	},
});

// Search for a stock
fetch("api/stocks/search", {
	method: "POST",
	headers: {
		"content-type": "application/json",
	},
	body: JSON.stringify({
		name: "aaci",
	}),
});
