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

	// UI state
	isEditing?: boolean;
	showReplies?: boolean;
	isReplying?: boolean;
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
}

export interface CommentThreadProps {
	comment: Comment;
	depth: number;
	maxDepth?: number;
	onReply: (parentId: number, replyToUsername: string) => void;
	onEdit: (commentId: number, newText: string) => Promise<void>;
	onDelete: (commentId: number) => Promise<void>;
	currentUserId?: number;
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
