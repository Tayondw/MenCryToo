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

export interface UseCommentsOptions {
	postId?: number;
	initialComments?: Comment[];
	autoLoad?: boolean;
	forceRefreshOnClose?: boolean;
	redirectOnClose?: string;
	refreshDelay?: number;
}

export interface UseCommentsReturn {
	// State
	modal: CommentModalState;
	comments: Comment[];
	isLoading: boolean;
	error: string | null;

	// Actions
	openModal: (
		postId: number,
		initialComments?: Comment[],
		onCommentsChange?: (postId: number, newCount: number) => void,
	) => void;
	closeModal: () => void;
	addComment: (formData: CommentFormData) => Promise<Comment>;
	editComment: (commentId: number, newText: string) => Promise<void>;
	deleteComment: (commentId: number) => Promise<void>;
	loadComments: (postId: number, page?: number) => Promise<Comment[]>;
	refreshComments: () => Promise<void>;

	// Utilities
	getCommentCount: () => number;
	getCommentById: (id: number) => Comment | undefined;
	clearError: () => void;

	// Refresh capabilities
	forceRefresh: () => void;
	hasChanges: boolean;
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

// Create a type that represents a post with optional comments array
export interface OldComment {
	id: number;
	userId: number;
	postId: number;
	comment: string;
	username: string;
	parentId: number | null;
	created_at: string;
	updated_at: string;
	commenter?: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	};
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

export interface EnhancedCommentThreadProps {
      comment: Comment;
      depth?: number;
      maxDepth?: number;

      // Session user data
      sessionUser?: {
            id: number;
            username: string;
            firstName?: string;
            lastName?: string;
            profileImage: string;
      } | null;

      // Post user data for mention linking
      postUser?: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
            profileImage: string;
      };

      // All comments for mention linking
      allComments?: Comment[];

      // Reply state management
      replyToComment?: number | null;
      setReplyToComment?: (id: number | null) => void;
      replyText?: string;
      setReplyText?: (text: string) => void;
      isSubmitting?: boolean;

      // Show/hide replies state
      showAllReplies?: { [key: number]: boolean };
      toggleShowAllReplies?: (commentId: number) => void;

      // Action handlers - unified interface
      onReply?: (
            parentId: number,
            replyToUsername?: string,
      ) => void | Promise<void>;
      onEdit?: (commentId: number, newText: string) => Promise<void>;
      onDelete?: (commentId: number) => Promise<void>;
      handleAddReply?: (parentId: number) => void | Promise<void>;

      // Like handlers
      onLikeToggle?: (
            commentId: number,
            isLiked: boolean,
            newCount: number,
      ) => void;
      onShowLikes?: (commentId: number) => void;

      // Utility functions
      formatTimeAgo?: (date: string) => string;

      // Legacy props for backwards compatibility
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
	// callback for when comments change
	onCommentsChange?: (postId: number, newCommentCount: number) => void;
}

// Enhanced CommentModalProps with better callback handling
export interface EnhancedCommentModalProps extends CommentModalProps {
      // Callback to notify parent of comment changes
      onCommentChange?: (changeType: "add" | "delete", newCount: number) => void;
      // Optional: Force page refresh on close
      forceRefreshOnClose?: boolean;
      // Optional: Custom close redirect
      redirectOnClose?: string;
}


// Comment like button props
export interface CommentLikeButtonProps {
	commentId: number;
	initialLikeCount: number;
	initialIsLiked?: boolean;
	onLikeToggle?: (
		commentId: number,
		isLiked: boolean,
		newCount: number,
	) => void;
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

export interface CommentRefreshOptions {
      // Force refresh on any comment change
      forceRefresh?: boolean;
      // Custom redirect path on close
      redirectPath?: string;
      // Delay before refresh (ms)
      refreshDelay?: number;
      // Callback for when refresh happens
      onRefresh?: () => void;
}

export interface CommentRefreshReturn {
      // Function to call when comments change
      onCommentChange: (changeType: "add" | "delete", newCount: number) => void;
      // Function to call when modal closes (handles refresh logic)
      onModalClose: () => void;
      // Whether comments have changed
      hasChanged: boolean;
      // Current comment count
      currentCount: number;
}