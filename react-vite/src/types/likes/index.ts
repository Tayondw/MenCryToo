export interface LikeState {
      isLiked: boolean;
      likeCount: number;
      isLoading: boolean;
}

export interface UseLikesReturn {
      likeStates: Map<number, LikeState>;
      toggleLike: (
            postId: number,
            currentIsLiked: boolean,
            currentCount: number,
      ) => Promise<void>;
      setLikeState: (postId: number, isLiked: boolean, count: number) => void;
      getLikeState: (postId: number) => LikeState | null;
      fetchLikeStatus: (postId: number) => Promise<void>;
}

// Hook for managing the likes modal
export interface UseLikesModalReturn {
      isOpen: boolean;
      postId: number | null;
      openModal: (postId: number) => void;
      closeModal: () => void;
}

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

export interface LikeResponse {
	success: boolean;
	isLiked: boolean;
	likeCount: number;
	commentId: number;
	message?: string;
}

export interface LikedUser {
      id: number;
      username: string;
      firstName: string;
      lastName: string;
      profileImage: string;
}

export interface CommentLikesModalProps {
      isOpen: boolean;
      onClose: () => void;
      commentId: number;
      initialCount?: number;
}

export interface PostsLikeButtonProps {
      postId: number;
      initialLikeCount: number;
      initialIsLiked?: boolean;
      onLikeToggle?: (postId: number, isLiked: boolean, newCount: number) => void;
      onLikesClick?: (postId: number) => void;
      className?: string;
      showCount?: boolean;
      size?: number;
      disabled?: boolean;
}

export interface PostsLikedUser {
      id: number;
      username: string;
      firstName: string;
      lastName: string;
      profileImage: string;
}

export interface PostsLikesModalProps {
      isOpen: boolean;
      onClose: () => void;
      postId: number;
      initialCount?: number;
}