export interface Comment {
	id: number;
	userId: number;
	postId: number;
	comment: string;
	parentId: number | null;
	createdAt: string;
	updatedAt: string;
	commenter: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	};

	// For threading
	replies?: Comment[];
	replyCount?: number;

	// Like functionality
	likes?: number; // Number of likes
	isLiked?: boolean; // Whether current user liked this comment
	likedUsers?: CommentLikedUser[]; // Users who liked this comment

	// UI state
	isEditing?: boolean;
	showReplies?: boolean;
	isReplying?: boolean;
}

// Interface for users who liked a comment
export interface CommentLikedUser {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	profileImage: string;
	likedAt: string; // When they liked the comment
}

// Comment like response from API
export interface CommentLikeResponse {
	success: boolean;
	isLiked: boolean;
	likeCount: number;
	commentId: number;
	message?: string;
}

// Comment likes list response
export interface CommentLikesResponse {
	commentId: number;
	likes: CommentLikedUser[];
	comment: string; // Comment text for context
	total: number;
}

// Helper type for legacy comment data transformation
export interface LegacyCommentData {
	id: number;
	userId?: number;
	user_id?: number;
	postId?: number;
	post_id?: number;
	comment: string;
	parentId?: number | null;
	parent_id?: number | null;
	createdAt?: string;
	created_at?: string;
	updatedAt?: string;
	updated_at?: string;
	username?: string;
	firstName?: string;
	first_name?: string;
	lastName?: string;
	last_name?: string;
	profileImage?: string;
	profile_image_url?: string;
	// API response
	commenter?: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	};
	// Like data from legacy API
	likes?: number;
	isLiked?: boolean;
	is_liked?: boolean;
}

export interface CommentFormData {
	comment: string;
	postId: number;
	parentId?: number | null;
	replyToUsername?: string;
}

export interface CommentModalState {
	isOpen: boolean;
	postId: number | null;
	comments: Comment[];
	isLoading: boolean;
	error: string | null;
	page: number;
	hasMore: boolean;
}

export interface CommentActions {
	openModal: (postId: number, initialComments?: Comment[]) => void;
	closeModal: () => void;
	addComment: (commentData: CommentFormData) => Promise<void>;
	editComment: (commentId: number, newText: string) => Promise<void>;
	deleteComment: (commentId: number) => Promise<void>;
	toggleReplies: (commentId: number) => void;
	loadMoreComments: () => Promise<void>;
	loadReplies: (commentId: number) => Promise<void>;
	// Like actions
	toggleCommentLike: (commentId: number) => Promise<void>;
	getCommentLikes: (commentId: number) => Promise<CommentLikedUser[]>;
}

export interface CommentThreadProps {
	comment: Comment;
	depth: number;
	maxDepth?: number;
	onReply: (parentId: number, replyToUsername: string) => void;
	onEdit: (commentId: number, newText: string) => Promise<void>;
	onDelete: (commentId: number) => Promise<void>;
	currentUserId?: number;
	// Like props
	onLikeToggle?: (
		commentId: number,
		isLiked: boolean,
		newCount: number,
	) => void;
	onShowLikes?: (commentId: number) => void;
}

export interface CommentFormProps {
	postId: number;
	parentId?: number | null;
	replyToUsername?: string;
	onSubmit: (commentData: CommentFormData) => Promise<void>;
	onCancel?: () => void;
	placeholder?: string;
	autoFocus?: boolean;
	isSubmitting?: boolean;
}

export interface CommentModalProps {
	isOpen: boolean;
	onClose: () => void;
	postId: number;
	initialComments?: Comment[];
	// callback for when comments change
	onCommentsChange?: (postId: number, newCommentCount: number) => void;
}

// Comment like button props
export interface CommentLikeButtonProps {
	commentId: number;
	initialLikeCount: number;
	initialIsLiked?: boolean;
	onLikeToggle?: (commentId: number, isLiked: boolean, newCount: number) => void;
	onLikesClick?: (commentId: number) => void;
	className?: string;
	showCount?: boolean;
	size?: number;
	disabled?: boolean;
}

// Comment likes modal props
export interface CommentLikesModalProps {
	isOpen: boolean;
	onClose: () => void;
	commentId: number;
	initialCount?: number;
}

// Utility types for API responses
export interface CommentResponse {
	comments: Comment[];
	pagination: {
		page: number;
		pages: number;
		total: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

export interface SingleCommentResponse {
	comment: Comment;
	success: boolean;
	message?: string;
}

export interface CommentError {
	message: string;
	field?: string;
	code?: string;
}

// Transformation utility type
export interface CommentTransformOptions {
	sessionUser?: {
		id: number;
		username: string;
		firstName?: string;
		lastName?: string;
		profileImage: string;
	};
	postCreator?: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	};
	fallbackProfileImage?: string;
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
