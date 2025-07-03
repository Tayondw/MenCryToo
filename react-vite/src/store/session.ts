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
						if (!completeUserData.errors) {
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
						if (!completeUserData.errors) {
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

// Authenticate thunk with minimal data
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

// Initial state
interface SessionState {
	user: User | null;
}

const initialState: SessionState = {
	user: null,
};

// Session reducer with immutable updates
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