// Import existing types from your main types file
import { User } from "../users";
import { FeedPost } from ".";

// Extend existing User type for session user (no conflicts)
export interface SessionUser extends User {
	// Already has all needed properties from User interface
}

// Keep existing User type as PostUser for compatibility
export type PostUser = FeedPost["user"];

// Re-export RootState from main types (no duplication)
// export type { RootState } from "./index";

// Component prop interfaces (new)
export interface PostCardProps {
	post: FeedPost;
	viewMode: "grid" | "list";
	formatTimeAgo: (date: string) => string;
	handleLikePost: (postId: number, isLiked: boolean) => void;
	isLiked: boolean;
	sessionUser: SessionUser | null;
}

// Action form data interfaces (new)
export interface LikeActionData {
	intent: "like-post" | "unlike-post";
	postId: string;
}

export interface RefreshActionData {
	intent: "refresh-feed";
}

export type PostsFeedActionData = LikeActionData | RefreshActionData;

// API error interface (new)
export interface ApiError {
	message: string;
	errors?: Record<string, string>;
}

// Search and filter interfaces (new)
export interface SearchFilters {
	searchTerm: string;
	selectedTags: string[];
	sortBy?: "recent" | "popular" | "oldest";
}

// View mode types (new)
export type ViewMode = "grid" | "list";
export type FeedTab = "all" | "similar";

// URL search params interface (new)
export interface FeedSearchParams {
	tab?: FeedTab;
	page?: string;
	per_page?: string;
	search?: string;
}

// Component state interfaces (new)
export interface PostsFeedState {
	viewMode: ViewMode;
	searchTerm: string;
	showFilters: boolean;
	selectedTags: string[];
	likedPosts: Set<number>;
}
