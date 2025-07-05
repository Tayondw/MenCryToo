// Import existing types from your main types file
import type { User, Post } from "./index";

// Extend existing User type for session user (no conflicts)
export interface SessionUser extends User {
	// Already has all needed properties from User interface
}

// Extend existing Post type for feed posts with additional computed properties
export interface FeedPost extends Omit<Post, "user" | "comments"> {
	// Override user to be lighter for feed performance
	user: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	};
	// Override comments to be a number count instead of string
	comments: number;
}

// Keep existing User type as PostUser for compatibility
export type PostUser = FeedPost["user"];

// Pagination interface (new, doesn't conflict)
export interface Pagination {
	page: number;
	pages: number;
	per_page: number;
	total: number;
	has_next: boolean;
	has_prev: boolean;
}

// API response interfaces (new)
export interface FeedResponse {
	posts: FeedPost[];
	pagination: Pagination;
	message?: string;
}

export interface FeedStats {
	totalPosts: number;
	similarUsers: number;
	similarPosts: number;
	userTags: number;
}

// Loader data interface (new)
export interface PostsFeedLoaderData {
	allPosts: FeedPost[];
	similarPosts: FeedPost[];
	allPostsPagination: Pagination;
	similarPostsPagination: Pagination;
	stats: FeedStats;
	activeTab: "all" | "similar";
	message?: string;
	error?: string;
}

// Re-export RootState from main types (no duplication)
export type { RootState } from "./index";

// Component prop interfaces (new)
export interface PostCardProps {
	post: FeedPost;
	viewMode: "grid" | "list";
	formatTimeAgo: (date: string) => string;
	handleLikePost: (postId: number, isLiked: boolean) => void;
	isLiked: boolean;
	sessionUser: SessionUser | null;
}

// Cache item interface (new)
export interface CacheItem<T> {
	data: T;
	timestamp: number;
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
