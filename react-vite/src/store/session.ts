import { User, AppThunk, SessionAction } from "../types";

// Action Types
const SET_USER = "session/setUser";
const REMOVE_USER = "session/removeUser";

// Action Creators
const setUser = (user: User): SessionAction => ({
	type: SET_USER,
	payload: user,
});

const removeUser = (): SessionAction => ({
	type: REMOVE_USER,
});

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
				const loginData = await response.json();

				// After successful login, fetch complete user data
				try {
					const authResponse = await fetch("/api/auth/");
					if (authResponse.ok) {
						const completeUserData = await authResponse.json();
						console.log("Login - Complete auth data:", completeUserData);

						// Extract user data from the response structure
						if (completeUserData.authenticated && completeUserData.user) {
							dispatch(setUser(completeUserData.user)); // Extract ONLY the user object
							return null;
						} else if (!completeUserData.errors) {
							// Handle case where response is already the user object
							dispatch(setUser(completeUserData));
							return null;
						}
					}
				} catch (authError) {
					console.error("Error fetching complete user data:", authError);
				}

				// Fallback to login data if auth fetch fails
				dispatch(setUser(loginData));
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
				const signupData = await response.json();

				// After successful signup, fetch complete user data
				try {
					const authResponse = await fetch("/api/auth/");
					if (authResponse.ok) {
						const completeUserData = await authResponse.json();
						console.log("Signup - Complete auth data:", completeUserData);

						// Extract user data from the response structure
						if (completeUserData.authenticated && completeUserData.user) {
							dispatch(setUser(completeUserData.user)); // Extract ONLY the user object
							return null;
						} else if (!completeUserData.errors) {
							// Handle case where response is already the user object
							dispatch(setUser(completeUserData));
							return null;
						}
					}
				} catch (authError) {
					console.error("Error fetching complete user data:", authError);
				}

				// Fallback to signup data if auth fetch fails
				dispatch(setUser(signupData));
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

// Logout thunk
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

// Authenticate thunk with proper data extraction
export const thunkAuthenticate = (): AppThunk => async (dispatch) => {
	try {
		const response = await fetch("/api/auth/");

		if (response.ok) {
			const data = await response.json();
			console.log("thunkAuthenticate - Raw response:", data);

			if (data.errors) {
				dispatch(removeUser());
				return null;
			}

			// Handle the new response structure {user: userData, authenticated: true}
			if (data.authenticated && data.user) {
				console.log(
					"thunkAuthenticate - Extracting user from wrapped response:",
					data.user,
				);
				dispatch(setUser(data.user)); // Extract ONLY the user object
				return data.user;
			}
			// Handle legacy case where response might already be the user object
			else if (data.id && data.username) {
				console.log(
					"thunkAuthenticate - Response is already user object:",
					data,
				);
				dispatch(setUser(data));
				return data;
			}
			// Handle case where user is null/undefined but no errors
			else {
				console.log(
					"thunkAuthenticate - No user data in response, removing user",
				);
				dispatch(removeUser());
				return null;
			}
		} else {
			console.log(
				"thunkAuthenticate - Response not ok, status:",
				response.status,
			);
			dispatch(removeUser());
			return null;
		}
	} catch (error) {
		console.error("Authentication error:", error);
		dispatch(removeUser());
		return null;
	}
};

// Initial state
interface SessionState {
	user: User | null;
}

const initialState: SessionState = {
	user: null,
};

// Session reducer with immutable updates and debugging
function sessionReducer(
	state = initialState,
	action: SessionAction,
): SessionState {
	switch (action.type) {
		case SET_USER:
			console.log("sessionReducer - Setting user:", action.payload);
			console.log(
				"sessionReducer - User profileImage:",
				action.payload?.profileImage,
			);
			return {
				...state,
				user: action.payload,
			};
		case REMOVE_USER:
			console.log("sessionReducer - Removing user");
			return {
				...state,
				user: null,
			};
		default:
			return state;
	}
}

export default sessionReducer;