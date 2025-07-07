import type { Post, Comment as BaseComment } from "./index";
import type { Comment } from "./comments";

// Extend your existing Comment interface with the new comment system
export interface ExtendedComment extends BaseComment {
	commenter?: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	};
	replies?: ExtendedComment[];
	replyCount?: number;
	isEditing?: boolean;
	showReplies?: boolean;
	isReplying?: boolean;
}

// Extend your existing Post interface to include proper comment data
export interface ExtendedPost extends Post {
	postComments?: ExtendedComment[];
}

// Create a bridge type that works with both old and new comment systems
export interface PostWithComments extends Omit<Post, "comments"> {
	comments: number; // Keep as number for count
	postComments?: Comment[]; // Add optional array of comment objects
}

// Re-export everything from your main types
export * from "./index";
export * from "./comments";
export * from "./postsFeed";
