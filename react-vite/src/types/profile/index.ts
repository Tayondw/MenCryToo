import { User } from "../users";
import { LucideIcon } from "lucide-react";

// Define the loader data structure
export interface ProfileDetailsLoaderData {
	user: User;
	currentUser: User | null;
	isOwnProfile: boolean;
	isAuthenticated: boolean;
}

// Reusable empty state component with proper icon typing
export interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	actionButton?: {
		to: string;
		text: string;
		icon: LucideIcon;
	};
}

export interface ProfileFeedData {
	users_profile: User[];
}

export interface ProfileFeedResponse {
	users_profile: User[];
	pagination?: {
		page: number;
		pages: number;
		per_page: number;
		total: number;
		has_next: boolean;
		has_prev: boolean;
	};
}

export interface ProfileFilterOptions {
	searchTerm: string;
	selectedTags: string[];
	sortBy: "name" | "similarity" | "recent";
}

// Post interface for the post data
export interface ProfilePost {
	id: number;
	title: string;
	caption: string;
	image?: string;
	likes: number;
	comments: number;
	updatedAt: string;
	creator?: number;
	createdAt?: string;
}

// User interface for the current user
export interface ProfileUser {
	id?: number;
	username: string;
	profileImage: string;
	firstName?: string;
	lastName?: string;
	email?: string;
}

// Like state interface
export interface LikeState {
	isLiked: boolean;
	likeCount: number;
	isLoading: boolean;
}

// Main post card props interface
export interface ProfilePostCardProps {
	post: ProfilePost;
	currentUser: ProfileUser;
	currentLikeState: LikeState;
	currentCommentCount: number;
	formatTimeAgo: (date: string) => string;
	onLikeToggle: (postId: number, isLiked: boolean, newCount: number) => void;
	onCommentsClick: (postId: number) => void;
	onPostClick: (postId: number) => void;
	onLikesClick: (postId: number) => void;
	navigate: (path: string) => void;
	PostMenu: React.ComponentType<{ post: any; navigate: any }>; // eslint-disable-line @typescript-eslint/no-explicit-any
}
// Group interface
export interface ProfileGroup {
	id: number;
	name: string;
	about: string;
	image: string;
	type: string;
	numMembers: number;
	numEvents?: number;
	city: string;
	state: string;
}

// Event venue info interface
export interface EventVenueInfo {
	id?: number;
	groupId?: number;
	address?: string;
	city: string;
	state: string;
	latitude?: number;
	longitude?: number;
}

// Event interface
export interface ProfileEvent {
	id: number;
	name: string;
	description: string;
	image: string;
	type: string;
	numAttendees: number;
	capacity: number;
	startDate: string;
	endDate?: string;
	venueInfo?: EventVenueInfo | null;
	groupInfo?: ProfileGroup;
}

// Group card props
export interface ProfileGroupCardProps {
	group: ProfileGroup;
}

// Event card props
export interface ProfileEventCardProps {
	event: ProfileEvent;
}

export interface DeleteProfileProps {
	user: User;
	onClose: () => void;
	onConfirm: () => void;
}
