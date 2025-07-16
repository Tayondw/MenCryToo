import { User, FeedUser } from "../users";
import { OldComment } from "../comments";

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

export interface PostMenuProps {
      navigate: (path: string) => void;
      post: Post;
}

export interface PostUser {
      id: number;
      username: string;
      firstName: string;
      lastName: string;
      profileImage: string;
}

export interface SimilarPost {
	id: number;
	title: string;
	caption: string;
	creator: number;
	image: string;
	likes: number;
	comments: number;
	createdAt: string;
	updatedAt: string;
	user: PostUser;
}

// Extend existing Post type for feed posts with additional computed properties
export interface FeedPostData extends Omit<Post, "user" | "comments"> {
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

// Pagination interface
export interface Pagination {
	page: number;
	pages: number;
	per_page: number;
	total: number;
	has_next: boolean;
	has_prev: boolean;
}

// API response interfaces
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

// Loader data interface
export interface PostsFeedLoaderData {
	allPosts: FeedPostData[];
	similarPosts: FeedPostData[];
	allPostsPagination: Pagination;
	similarPostsPagination: Pagination;
	stats: FeedStats;
	activeTab: "all" | "similar";
	message?: string;
	error?: string;
}


export interface FeedPost {
	id: number;
	title: string;
	caption: string;
	creator: number;
	image: string;
	likes: number;
	comments: number;
	createdAt: string;
	updatedAt: string;
	user: PostUser;
}

// FeedPost to include postComments
export interface FeedPostWithComments {
	id: number;
	title: string;
	caption: string;
	image: string;
	likes: number;
	creator: number;
	comments: number; // Count of comments
	postComments?: Comment[]; // Optional array of actual comment objects with proper typing
	createdAt: string;
	updatedAt: string;
	user: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	};
}

export interface PostComment {
	id: number;
	userId: number;
	postId: number;
	comment: string;
	username: string;
	parentId: number | null;
	created_at: string;
	updated_at: string;
	likes?: number;
	isLiked?: boolean;
	commenter?: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	};
}

export interface PostDetails {
      id: number;
      title: string;
      caption: string;
      creator: number;
      image: string;
      likes: number;
      user: PostUser;
      postComments: PostComment[];
      createdAt: string;
      updatedAt: string;
}

export interface PostWithComments {
      id: number;
      title: string;
      caption: string;
      image: string;
      likes: number;
      creator: number;
      comments: number; // Count of comments
      createdAt: string;
      updatedAt: string;
      user: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
            profileImage: string;
      };
      // Optional array of comment objects in old format
      postComments?: OldComment[];
}

export interface PostCardProps {
      post: Post;
      userDetails: User;
      formatTimeAgo: (date: string) => string;
      onLikeToggle: (postId: number, isLiked: boolean, newCount: number) => void;
      onCommentsClick: (postId: number) => void;
      onPostClick: (postId: number) => void;
      onLikesClick: (postId: number) => void;
      currentLikeState: {
            isLiked: boolean;
            likeCount: number;
            isLoading: boolean;
      };
      isAuthenticated: boolean;
      currentCommentCount: number;
}

// Define proper interface for PostFeedCard props
export interface PostFeedCardProps {
      post: PostWithComments;
      viewMode: "grid" | "list";
      formatTimeAgo: (dateString: string) => string;
      handleCommentClick: (postId: number, post: PostWithComments) => void;
      handleLikesClick: (postId: number) => void;
      likeState?: { isLiked: boolean; likeCount: number; isLoading: boolean };
      setLikeState: (postId: number, isLiked: boolean, count: number) => void;
      sessionUser: User | null;
      currentCommentCount: number;
}

export interface PostLoaderResponse {
      users_profile: FeedUser[];
      pagination: {
            page: number;
            pages: number;
            per_page: number;
            total: number;
            has_next: boolean;
            has_prev: boolean;
      };
      totalPosts: number;
      message?: string;
      error?: string;
}

export interface PostApiResponse {
      posts: FeedPost[];
      pagination: {
            page: number;
            pages: number;
            per_page: number;
            total: number;
            has_next: boolean;
            has_prev: boolean;
      };
      message?: string;
}

export interface DeletePostProps {
      post: Post;
      navigate: (path: string) => void;
      onClose: () => void;
}