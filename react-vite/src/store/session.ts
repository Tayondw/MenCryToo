import { User, AppThunk, SessionAction } from "../types";

// Action Types
const SET_USER = "session/setUser";
const REMOVE_USER = "session/removeUser";

// Action Creators - Optimized
const setUser = (user: User): SessionAction => ({
	type: SET_USER,
	payload: user,
});

const removeUser = (): SessionAction => ({
	type: REMOVE_USER,
});

// OPTIMIZED: Login thunk with minimal data loading
export const thunkLogin =
	(credentials: { email: string; password: string }): AppThunk =>
	async (dispatch) => {
		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(credentials),
			});

			if (response.ok) {
				const data = await response.json();
				dispatch(setUser(data));
				return null;
			} else if (response.status < 500) {
				const errors = await response.json();
				return errors;
			} else {
				return { server: "Something went wrong. Please try again" };
			}
		} catch (error) {
			console.error("Login error:", error);
			return { server: "Network error occurred" };
		}
	};

// OPTIMIZED: Signup thunk - keeping JSON format since you're not using FormData
export const thunkSignup =
	(user: Partial<User>): AppThunk =>
	async (dispatch) => {
		try {
			const response = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(user),
			});

			if (response.ok) {
				const data = await response.json();
				dispatch(setUser(data));
				return null;
			} else if (response.status < 500) {
				const errors = await response.json();
				return errors;
			} else {
				return { server: "Something went wrong. Please try again" };
			}
		} catch (error) {
			console.error("Signup error:", error);
			return { server: "Network error occurred" };
		}
	};

// OPTIMIZED: Logout thunk
export const thunkLogout = (): AppThunk => async (dispatch) => {
	try {
		await fetch("/api/auth/logout");
		dispatch(removeUser());

		// Clear any cached data
		if (typeof window !== "undefined") {
			window.sessionStorage.clear();
			window.localStorage.removeItem("userPreferences");
		}
	} catch (error) {
		console.error("Logout error:", error);
		// Still remove user from state even if logout request fails
		dispatch(removeUser());
	}
};

// OPTIMIZED: Authenticate thunk with minimal data
export const thunkAuthenticate = (): AppThunk => async (dispatch) => {
	try {
		const response = await fetch("/api/auth/");

		if (response.ok) {
			const data = await response.json();
			if (data.errors) {
				dispatch(removeUser());
				return null;
			}
			dispatch(setUser(data));
			return data;
		} else {
			dispatch(removeUser());
			return null;
		}
	} catch (error) {
		console.error("Authentication error:", error);
		dispatch(removeUser());
		return null;
	}
};

// OPTIMIZED: Update profile thunk (if you need this functionality)
export const thunkUpdateProfile =
	(userId: number, userData: Partial<User>): AppThunk =>
	async (dispatch) => {
		try {
			const response = await fetch(`/api/users/${userId}/profile/update`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(userData),
			});

			if (response.ok) {
				const data = await response.json();
				dispatch(setUser(data.profile || data));
				return null;
			} else if (response.status < 500) {
				const errors = await response.json();
				return errors;
			} else {
				return { server: "Something went wrong. Please try again" };
			}
		} catch (error) {
			console.error("Profile update error:", error);
			return { server: "Network error occurred" };
		}
	};

// Initial state
interface SessionState {
	user: User | null;
}

const initialState: SessionState = {
	user: null,
};

// OPTIMIZED: Session reducer with immutable updates
function sessionReducer(
	state = initialState,
	action: SessionAction,
): SessionState {
	switch (action.type) {
		case SET_USER:
			return {
				...state,
				user: action.payload,
			};
		case REMOVE_USER:
			return {
				...state,
				user: null,
			};
		default:
			return state;
	}
}

export default sessionReducer;

// import { User, AppThunk, SessionAction } from "../types";

// const SET_USER = "session/setUser";
// const REMOVE_USER = "session/removeUser";

// export const setUser = (user: User): SessionAction => ({
// 	type: SET_USER,
// 	payload: user,
// });

// export const removeUser = (): SessionAction => ({
// 	type: REMOVE_USER,
// });

// export const thunkAuthenticate = (): AppThunk => async (dispatch) => {
// 	const response = await fetch("/api/auth/");
// 	if (response.ok) {
// 		const data = await response.json();
// 		if (data.errors) {
// 			return;
// 		}

// 		dispatch(setUser(data));
// 	}
// };

// export const thunkLogin =
// 	(credentials: { email: string; password: string }): AppThunk =>
// 	async (dispatch) => {
// 		const response = await fetch("/api/auth/login", {
// 			method: "POST",
// 			headers: { "Content-Type": "application/json" },
// 			body: JSON.stringify(credentials),
// 		});

// 		if (response.ok) {
// 			const data = await response.json();
// 			dispatch(setUser(data));
// 		} else if (response.status < 500) {
// 			const errorMessages = await response.json();
// 			return errorMessages;
// 		} else {
// 			return { server: "Something went wrong. Please try again" };
// 		}
// 	};

// export const thunkSignup =
// 	(user: Partial<User>): AppThunk =>
// 	async (dispatch) => {
// 		const response = await fetch("/api/auth/signup", {
// 			method: "POST",
// 			headers: { "Content-Type": "application/json" },
// 			body: JSON.stringify(user),
// 		});

// 		if (response.ok) {
// 			const data = await response.json();
// 			dispatch(setUser(data));
// 		} else if (response.status < 500) {
// 			const errorMessages = await response.json();
// 			return errorMessages;
// 		} else {
// 			return { server: "Something went wrong. Please try again" };
// 		}
// 	};

// export const thunkLogout = (): AppThunk => async (dispatch) => {
// 	await fetch("/api/auth/logout");
// 	dispatch(removeUser());
// };

// interface SessionState {
// 	user: User | null;
// }

// const initialState: SessionState = { user: null };

// function sessionReducer(
// 	state = initialState,
// 	action: SessionAction,
// ): SessionState {
// 	switch (action.type) {
// 		case SET_USER:
// 			return { ...state, user: action.payload };
// 		case REMOVE_USER:
// 			return { ...state, user: null };
// 		default:
// 			return state;
// 	}
// }

// export default sessionReducer;
