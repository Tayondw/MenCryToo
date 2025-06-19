// User types
export interface User {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	bio: string;
	profileImage: string;
	usersTags: Tag[];
	posts: Post[];
	group: Group[];
	events: Event[];
	userComments: Comment[];
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
	updatedAt: string;
}

export interface Group {
	id: number;
	name: string;
	about: string;
      image: string;
      city: string;
      state: string;
	numMembers: number;
	events: Event[];
	type: string;
}

export interface Event {
	id: number;
	name: string;
	description: string;
	image: string;
	numAttendees: number;
	capacity: number;
	type: string;
	startDate: string;
      endDate: string;
      venueInfo: Venue;
      groupInfo: Group;
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

export interface Comment {
	id: number;
	content: string;
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
