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

export interface DeleteProfileProps {
      user: User;
      onClose: () => void;
      onConfirm: () => void;
}
