export * from "./comments";
import { Group } from "./groups";
import { Event } from "./events";

// User types
export interface User {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	hashedPassword?: string; // Optional since it shouldn't be sent to frontend (this is for mock user)
	bio: string;
	profileImage: string;
	usersTags: Tag[];
	posts: Post[];
	group: Group[];
	events: Event[];
	userComments: UserComment[]; // Renamed to avoid conflict with Comment interface
	createdAt?: string;
	updatedAt?: string;
}
export interface Tag {
	id: number;
	name: string;
}

export interface Post {
	id: number;
	title: string;
	caption: string;
	image: string;
	likes: number;
	creator: number;
	comments: number; // Changed from string to number for count
	createdAt: string;
	updatedAt: string;
	user: User;
}

export interface Venue {
	id: number;
	groupId: number;
	address: string;
	city: string;
	state: string;
	latitude: number;
	longitude: number;
}

// Basic comment interface (for backwards compatibility) - renamed to avoid conflict
export interface UserComment {
	id: number;
	comment: string;
	userId?: number;
	postId?: number;
	createdAt?: string;
	updatedAt?: string;
	parentId?: number | null;
	username?: string;
}
export interface ProfilesData {
	users_profile: User[];
}

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
