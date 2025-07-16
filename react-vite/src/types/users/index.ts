import { Group } from "../groups";
import { Event } from "../events";
import { Post, FeedPost } from "../posts";
import { Tag } from "../tags";

// User types
export interface User {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	hashedPassword?: string; // Optional since it shouldn't be sent to frontend (this is for mock user)
	bio: string;
	profileImage: string;
	usersTags: Tag[];
	posts: Post[];
	group: Group[];
	events: Event[];
	userComments: UserComment[]; // Renamed to avoid conflict with Comment interface
	createdAt?: string;
	updatedAt?: string;
}

export interface FeedUser {
      id: number;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      bio: string;
      profileImage: string;
      usersTags: Array<{ id: number; name: string }>;
      createdAt: string;
      updatedAt: string;
      posts: FeedPost[];
}

// Basic comment interface (for backwards compatibility) - renamed to avoid conflict
export interface UserComment {
	id: number;
	comment: string;
	userId?: number;
	postId?: number;
	createdAt?: string;
	updatedAt?: string;
	parentId?: number | null;
	username?: string;
}

export interface SessionUser {
	id: number;
	username: string;
	firstName?: string;
	lastName?: string;
	profileImage: string;
	usersTags: Array<{ id: number; name: string }>;
}
