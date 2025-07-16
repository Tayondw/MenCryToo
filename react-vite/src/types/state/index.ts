import { User } from "../users";

// Redux types
export interface RootState {
	session: SessionState;
}

export interface SessionState {
	user: User | null;
}

// Action types
export interface SetUserAction {
	type: "session/setUser";
	payload: User;
}

export interface RemoveUserAction {
	type: "session/removeUser";
}

export type SessionAction = SetUserAction | RemoveUserAction;

// Thunk types - Simplified to work properly with redux-thunk
export type AppThunk<ReturnType = void> = (
	dispatch: AppDispatch,
	getState: () => RootState,
) => Promise<ReturnType> | ReturnType;

// Simplified AppDispatch that works with useDispatch
export interface AppDispatch {
	<T extends SessionAction>(action: T): T;
	<R>(asyncAction: AppThunk<R>): Promise<R>;
}
