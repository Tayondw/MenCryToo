import { User, AppThunk, SessionAction } from "../types";

const SET_USER = "session/setUser";
const REMOVE_USER = "session/removeUser";

export const setUser = (user: User): SessionAction => ({
	type: SET_USER,
	payload: user,
});

export const removeUser = (): SessionAction => ({
	type: REMOVE_USER,
});

export const thunkAuthenticate = (): AppThunk => async (dispatch) => {
	const response = await fetch("/api/auth/");
	if (response.ok) {
		const data = await response.json();
		if (data.errors) {
			return;
		}

		dispatch(setUser(data));
	}
};

export const thunkLogin =
	(credentials: { email: string; password: string }): AppThunk =>
	async (dispatch) => {
		const response = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(credentials),
		});

		if (response.ok) {
			const data = await response.json();
			dispatch(setUser(data));
		} else if (response.status < 500) {
			const errorMessages = await response.json();
			return errorMessages;
		} else {
			return { server: "Something went wrong. Please try again" };
		}
	};

export const thunkSignup =
	(user: Partial<User>): AppThunk =>
	async (dispatch) => {
		const response = await fetch("/api/auth/signup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(user),
		});

		if (response.ok) {
			const data = await response.json();
			dispatch(setUser(data));
		} else if (response.status < 500) {
			const errorMessages = await response.json();
			return errorMessages;
		} else {
			return { server: "Something went wrong. Please try again" };
		}
	};

export const thunkLogout = (): AppThunk => async (dispatch) => {
	await fetch("/api/auth/logout");
	dispatch(removeUser());
};

interface SessionState {
	user: User | null;
}

const initialState: SessionState = { user: null };

function sessionReducer(
	state = initialState,
	action: SessionAction,
): SessionState {
	switch (action.type) {
		case SET_USER:
			return { ...state, user: action.payload };
		case REMOVE_USER:
			return { ...state, user: null };
		default:
			return state;
	}
}

export default sessionReducer;
