// Delete a group by its id
fetch("api/groups/11/delete", {
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
