import React, { useState, useMemo, useCallback } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import {
	Heart,
	MessageCircle,
	Share2,
	Bookmark,
	Users,
	Calendar,
	Plus,
	Grid,
	List,
	Search,
	TrendingUp,
	Award,
	Clock,
	Eye,
	UserIcon,
	ArrowLeft,
	LucideIcon,
} from "lucide-react";
import {
	User,
	Post,
	Group,
	Event,
	Tag as TagInterface,
	UserComment,
} from "../../../types";
import { useComments } from "../../../hooks/useComments";
import { useLikes, useLikesModal } from "../../../hooks/useLikes";
import LikeButton from "../../Likes/PostsLikesButton";
import LikesModal from "../../Likes/PostsLikesModal";
import CommentModal from "../../Comments/CommentModal";
import Mail from "../../Mail";

// Define the loader data structure
interface ProfileDetailsLoaderData {
	user: User;
	currentUser: User | null;
	isOwnProfile: boolean;
	isAuthenticated: boolean;
}

// Reusable empty state component with proper icon typing
interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	actionButton?: {
		to: string;
		text: string;
		icon: LucideIcon;
	};
}

const EmptyState: React.FC<EmptyStateProps> = ({
	icon: Icon,
	title,
	description,
	actionButton,
}) => (
	<div className="text-center py-16">
		<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
			<div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
				<Icon className="text-white" size={24} />
			</div>
			<h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
			<p className="text-gray-600 mb-4">{description}</p>
			{actionButton && (
				<Link
					to={actionButton.to}
					className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200"
				>
					<actionButton.icon size={16} />
					{actionButton.text}
				</Link>
			)}
		</div>
	</div>
);

interface PostCardProps {
	post: Post;
	userDetails: User;
	userComments: UserComment[];
	formatTimeAgo: (date: string) => string;
	// Interactive handlers
	onLikeToggle: (postId: number, isLiked: boolean, newCount: number) => void;
	onCommentsClick: (postId: number) => void;
	onPostClick: (postId: number) => void;
	onLikesClick: (postId: number) => void; // Add this missing prop
	// Like state
	currentLikeState: {
		isLiked: boolean;
		likeCount: number;
		isLoading: boolean;
	};
	// Auth state
	isAuthenticated: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
	post,
	userDetails,
	userComments,
	formatTimeAgo,
	onLikeToggle,
	onCommentsClick,
	onPostClick,
	currentLikeState,
	isAuthenticated,
	onLikesClick, // Add this prop
}) => (
	<article
		className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
		style={{ minHeight: "500px" }}
	>
		{/* Post Header */}
		<div className="p-4 border-b border-gray-50 flex-shrink-0">
			<div className="flex items-center gap-3">
				<img
					src={userDetails?.profileImage}
					alt={userDetails?.username}
					className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
				/>
				<span className="font-semibold text-gray-800 truncate">
					{userDetails?.username}
				</span>
			</div>
		</div>

		{/* Post Title - Clickable */}
		<div className="px-4 py-3 border-b border-gray-50 flex-shrink-0">
			<h3
				className="font-semibold text-gray-800 text-base leading-tight break-words h-10 cursor-pointer hover:text-orange-600 transition-colors"
				onClick={() => onPostClick(post.id)}
			>
				{post.title}
			</h3>
		</div>

		{/* Post Image - Also clickable */}
		{post.image && (
			<div
				className="relative flex-shrink-0 cursor-pointer"
				onClick={() => onPostClick(post.id)}
			>
				<img
					src={post.image}
					alt={post.title}
					className="w-full h-64 object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
			</div>
		)}

		{/* Post Content */}
		<div className="p-4 flex-1 flex flex-col">
			<div className="flex items-center gap-6 mb-3">
				{/* Like Button */}
				{isAuthenticated ? (
					<LikeButton
						postId={post.id}
						initialLikeCount={currentLikeState.likeCount}
						initialIsLiked={currentLikeState.isLiked}
						onLikeToggle={onLikeToggle}
						onLikesClick={() => onLikesClick(post.id)}
						size={18}
						disabled={currentLikeState.isLoading}
					/>
				) : (
					<div className="flex items-center gap-2 text-gray-600">
						<Heart size={18} />
						<span
							className="text-sm font-medium cursor-pointer hover:text-orange-600 transition-colors"
							onClick={() => onLikesClick(post.id)}
						>
							{currentLikeState.likeCount}
						</span>
					</div>
				)}

				{/* Comment Button */}
				<button
					onClick={() => onCommentsClick(post.id)}
					className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors duration-200"
				>
					<MessageCircle size={18} />
					<span className="text-sm font-medium">{userComments.length}</span>
				</button>

				<button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors duration-200 ml-auto">
					<Share2 size={16} />
				</button>
				<button className="flex items-center gap-2 text-gray-600 hover:text-yellow-500 transition-colors duration-200">
					<Bookmark size={16} />
				</button>
			</div>

			{/* Caption */}
			<div className="text-sm text-gray-700 leading-relaxed flex-1">
				<div className="flex items-start gap-2 flex-wrap">
					<span className="font-semibold text-gray-800 flex-shrink-0">
						{userDetails?.username}
					</span>
					<span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0 self-center">
						<Clock size={12} />
						{formatTimeAgo(post.updatedAt)}
					</span>
					<span className="break-words">{post.caption}</span>
				</div>
			</div>
		</div>
	</article>
);

// Group card component
const GroupCard: React.FC<{ group: Group }> = ({ group }) => (
	<Link to={`/groups/${group.id}`} className="group block">
		<article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
			<div className="relative">
				<img
					src={group.image}
					alt={group.name}
					className="w-full h-48 object-cover"
				/>
				<div className="absolute top-4 right-4">
					<span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full">
						{group.type}
					</span>
				</div>
			</div>
			<div className="p-6 flex-1 flex flex-col">
				<h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-200">
					{group.name}
				</h2>
				<p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
					{group.about}
				</p>
				<div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
					<div className="flex items-center gap-1">
						<Users size={14} />
						<span>{group.numMembers.toLocaleString()} members</span>
					</div>
					<div className="flex items-center gap-1">
						<Calendar size={14} />
						<span>{group.events?.length || 0} events</span>
					</div>
				</div>
			</div>
		</article>
	</Link>
);

// Event card component
const EventCard: React.FC<{ event: Event }> = ({ event }) => (
	<Link to={`/events/${event.id}`} className="group block">
		<article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
			<div className="relative">
				<img
					src={event.image}
					alt={event.name}
					className="w-full h-48 object-cover"
				/>
				<div className="absolute top-4 right-4">
					<span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full">
						{event.type}
					</span>
				</div>
			</div>
			<div className="p-6 flex-1 flex flex-col">
				<h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-200">
					{event.name}
				</h2>
				<p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
					{event.description}
				</p>
				<div className="space-y-2 text-sm text-gray-500 mt-auto">
					<div className="flex items-center gap-2">
						<Calendar size={14} />
						<span>{new Date(event.startDate).toLocaleDateString()}</span>
					</div>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1">
							<Users size={14} />
							<span>
								{event.numAttendees}/{event.capacity} attending
							</span>
						</div>
					</div>
				</div>
			</div>
		</article>
	</Link>
);

// Empty state configurations with proper typing
interface EmptyStateConfig {
	icon: LucideIcon;
	title: string;
	description: string;
	actionButton?: {
		to: string;
		text: string;
		icon: LucideIcon;
	};
}

const ProfileDetails: React.FC = () => {
	const navigate = useNavigate();

	// Get data from React Router loader
	const {
		user: userDetails,
		isOwnProfile,
		isAuthenticated,
	} = useLoaderData() as ProfileDetailsLoaderData;

	// Hook integrations for interactivity
	const { likeStates, setLikeState, fetchLikeStatus } = useLikes();
	const {
		isOpen: isLikesModalOpen,
		postId: likesModalPostId,
		openModal: openLikesModal,
		closeModal: closeLikesModal,
	} = useLikesModal();
	const {
		modal: commentModal,
		openModal: openCommentModal,
		closeModal: closeCommentModal,
	} = useComments();

	// State hooks - must be called unconditionally
	const [activeMainSection, setActiveMainSection] = useState<
		"posts" | "groups" | "events"
	>("posts");
	const [activeAsideSection, setActiveAsideSection] = useState<
		"tags" | "similar"
	>("tags");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchTerm, setSearchTerm] = useState("");

	// Memoized values - must be called unconditionally
	const userTags = useMemo(() => userDetails?.usersTags ?? [], [userDetails]);
	const userPosts = useMemo(() => userDetails?.posts ?? [], [userDetails]);
	const userGroups = useMemo(() => userDetails?.group ?? [], [userDetails]);
	const userEvents = useMemo(() => userDetails?.events ?? [], [userDetails]);
	const userComments = useMemo(
		() => userDetails?.userComments ?? [],
		[userDetails],
	);

	const sortedUserPosts = useMemo(() => {
		return [...userPosts].sort(
			(a: Post, b: Post) =>
				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		);
	}, [userPosts]);

	// Initialize like states for all posts
	React.useEffect(() => {
		userPosts.forEach((post) => {
			if (!likeStates.has(post.id)) {
				setLikeState(post.id, false, post.likes);
				fetchLikeStatus(post.id);
			}
		});
	}, [userPosts, likeStates, setLikeState, fetchLikeStatus]);

	// Interactive handlers
	const handleLikeToggle = useCallback(
		async (postId: number, isLiked: boolean, newCount: number) => {
			setLikeState(postId, isLiked, newCount);
		},
		[setLikeState],
	);

	const handleLikesClick = useCallback(
		(postId: number) => {
			openLikesModal(postId);
		},
		[openLikesModal],
	);

	const handleCommentsClick = useCallback(
		(postId: number) => {
			const post = userPosts.find((p) => p.id === postId);

			if (post) {
				openCommentModal(postId, []);
			} else {
				openCommentModal(postId, []);
			}
		},
		[userPosts, openCommentModal],
	);

	const handlePostClick = useCallback(
		(postId: number) => {
			navigate(`/posts/${postId}`);
		},
		[navigate],
	);

	// Filter content based on search term
	const filteredPosts = useMemo((): Post[] => {
		if (activeMainSection !== "posts") return [];

		if (!searchTerm) return sortedUserPosts;

		const term = searchTerm.toLowerCase();
		return sortedUserPosts.filter(
			(post: Post) =>
				post.title.toLowerCase().includes(term) ||
				post.caption.toLowerCase().includes(term),
		);
	}, [activeMainSection, searchTerm, sortedUserPosts]);

	const filteredGroups = useMemo((): Group[] => {
		if (activeMainSection !== "groups") return [];

		if (!searchTerm) return userGroups;

		const term = searchTerm.toLowerCase();
		return userGroups.filter(
			(group: Group) =>
				group.name.toLowerCase().includes(term) ||
				group.about.toLowerCase().includes(term),
		);
	}, [activeMainSection, searchTerm, userGroups]);

	const filteredEvents = useMemo((): Event[] => {
		if (activeMainSection !== "events") return [];

		if (!searchTerm) return userEvents;

		const term = searchTerm.toLowerCase();
		return userEvents.filter(
			(event: Event) =>
				event.name.toLowerCase().includes(term) ||
				event.description.toLowerCase().includes(term),
		);
	}, [activeMainSection, searchTerm, userEvents]);

	// Helper functions
	const formatTimeAgo = useCallback((dateString: string) => {
		const now = new Date();
		const postDate = new Date(dateString);
		const diffInDays = Math.floor(
			(now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		return `${diffInDays}d ago`;
	}, []);

	const getTotalLikes = useCallback(() => {
		return userPosts.reduce((total, post) => total + (post.likes || 0), 0);
	}, [userPosts]);

	// Get current filtered content count for display
	const getFilteredContentCount = useCallback(() => {
		switch (activeMainSection) {
			case "posts":
				return filteredPosts.length;
			case "groups":
				return filteredGroups.length;
			case "events":
				return filteredEvents.length;
			default:
				return 0;
		}
	}, [
		activeMainSection,
		filteredPosts.length,
		filteredGroups.length,
		filteredEvents.length,
	]);

	// Render content
	const renderContent = useCallback(() => {
		// Grid/List class helper
		const getGridClass = () => {
			if (activeMainSection === "posts") {
				return viewMode === "grid"
					? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6 w-full"
					: "space-y-6";
			}
			return viewMode === "grid"
				? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
				: "space-y-6";
		};

		// Empty state configurations with proper typing
		const emptyStates: Record<"posts" | "groups" | "events", EmptyStateConfig> =
			{
				posts: {
					icon: Grid,
					title: "No Posts Yet",
					description: "This user hasn't shared any posts yet.",
					actionButton: isAuthenticated
						? {
								to: "/posts/create",
								text: "Create Post",
								icon: Plus,
						  }
						: undefined,
				},
				groups: {
					icon: Users,
					title: "No Groups Yet",
					description: "This user hasn't joined any groups yet.",
					actionButton: {
						to: "/groups",
						text: "Explore Groups",
						icon: Users,
					},
				},
				events: {
					icon: Calendar,
					title: "No Events Yet",
					description: "This user isn't attending any events yet.",
					actionButton: {
						to: "/events",
						text: "Explore Events",
						icon: Calendar,
					},
				},
			};

		// Type-safe rendering based on active section
		switch (activeMainSection) {
			case "posts":
				if (filteredPosts.length === 0) {
					return <EmptyState {...emptyStates.posts} />;
				}
				return (
					<div className={getGridClass()}>
						{filteredPosts.map((post: Post) => {
							const currentLikeState = likeStates.get(post.id) || {
								isLiked: false,
								likeCount: post.likes,
								isLoading: false,
							};

							return (
								<PostCard
									key={post.id}
									post={post}
									userDetails={userDetails}
									userComments={userComments}
									formatTimeAgo={formatTimeAgo}
									onLikeToggle={handleLikeToggle}
									onCommentsClick={handleCommentsClick}
									onPostClick={handlePostClick}
									onLikesClick={handleLikesClick}
									currentLikeState={currentLikeState}
									isAuthenticated={isAuthenticated}
								/>
							);
						})}
					</div>
				);

			case "groups":
				if (filteredGroups.length === 0) {
					return <EmptyState {...emptyStates.groups} />;
				}
				return (
					<div className={getGridClass()}>
						{filteredGroups.map((group: Group) => (
							<GroupCard key={group.id} group={group} />
						))}
					</div>
				);

			case "events":
				if (filteredEvents.length === 0) {
					return <EmptyState {...emptyStates.events} />;
				}
				return (
					<div className={getGridClass()}>
						{filteredEvents.map((event: Event) => (
							<EventCard key={event.id} event={event} />
						))}
					</div>
				);

			default:
				return null;
		}
	}, [
		activeMainSection,
		viewMode,
		filteredPosts,
		filteredGroups,
		filteredEvents,
		userDetails,
		userComments,
		formatTimeAgo,
		handleLikeToggle,
		handleCommentsClick,
		handlePostClick,
		handleLikesClick,
		likeStates,
		isAuthenticated,
	]);

	// Render tag content
	const renderTagContent = useCallback(() => {
		if (activeAsideSection === "tags") {
			return userTags.length > 0 ? (
				<div className="space-y-6">
					<div className="flex flex-wrap gap-2">
						{userTags.map((tag: TagInterface) => (
							<span
								key={tag.id}
								className="px-3 py-1 bg-gradient-to-r from-orange-100 to-slate-100 text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:shadow-sm transition-all duration-200"
							>
								{tag.name}
							</span>
						))}
					</div>
				</div>
			) : (
				<div className="text-center py-4">
					<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
						<UserIcon className="text-gray-400" size={20} />
					</div>
					<p className="text-gray-500 text-sm">No tags added yet.</p>
				</div>
			);
		}

		return (
			<div className="space-y-6">
				<div className="text-center">
					<div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
						<TrendingUp className="text-white" size={20} />
					</div>
					<h3 className="font-semibold text-gray-800 mb-2">
						Discover Similar Users
					</h3>
					<p className="text-gray-600 text-sm mb-4">
						Find users with similar interests
					</p>
				</div>
				<Link to="/profile-feed">
					<button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg">
						<Eye size={16} />
						Find Similar Users
					</button>
				</Link>
			</div>
		);
	}, [activeAsideSection, userTags]);

	// Early returns after all hooks
	if (isOwnProfile) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-gray-800 mb-4">
						Redirecting to your profile...
					</h2>
					<Link to="/profile" className="text-orange-600 hover:text-orange-800">
						Click here if not redirected automatically
					</Link>
				</div>
			</div>
		);
	}

	if (!userDetails) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
				<div className="text-center p-8">
					<div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-slate-600">Loading user profile...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
			{/* Navigation */}
			<nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<Link
							to="/profile-feed"
							className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
						>
							<ArrowLeft size={18} />
							Back to Profiles
						</Link>
						<div className="flex items-center gap-3">
							{isAuthenticated ? (
								<>
									<Link
										to="/profile"
										className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
									>
										My Profile
									</Link>
									<Link
										to="/posts/create"
										className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg"
									>
										<Plus size={16} />
										Create Post
									</Link>
								</>
							) : (
								<Link
									to="/login"
									className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg"
								>
									Sign In
								</Link>
							)}
						</div>
					</div>
				</div>
			</nav>

			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					{/* Main Content */}
					<main className="lg:col-span-3 space-y-8">
						{/* Profile Header */}
						<section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
							<div className="relative h-32 bg-gradient-to-r from-orange-500 to-slate-600">
								<div className="absolute inset-0 bg-black/20"></div>
							</div>
							<div className="relative px-6 pb-6">
								<div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-16">
									<div className="relative self-center">
										<img
											src={userDetails.profileImage}
											alt={userDetails.username}
											className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
										/>
									</div>

									<div className="flex-1 mt-20 sm:mt-0">
										<h1 className="text-2xl font-bold text-gray-800">
											{userDetails.username}
										</h1>
										<p className="text-gray-600 mt-1">
											{userDetails.firstName} {userDetails.lastName}
										</p>
										<p className="text-gray-500 text-sm">
											Member since{" "}
											{new Date(
												userDetails.createdAt || "",
											).toLocaleDateString()}
										</p>

										{userDetails.bio && (
											<p className="text-gray-700 mt-4 leading-relaxed">
												{userDetails.bio}
											</p>
										)}

										{/* Stats */}
										<div className="flex items-center gap-8 mt-6">
											<div className="text-center">
												<div className="text-xl font-bold text-gray-800">
													{userPosts.length}
												</div>
												<div className="text-sm text-gray-500">Posts</div>
											</div>
											<div className="text-center">
												<div className="text-xl font-bold text-gray-800">
													{getTotalLikes()}
												</div>
												<div className="text-sm text-gray-500">Likes</div>
											</div>
											<div className="text-center">
												<div className="text-xl font-bold text-gray-800">
													{userGroups.length}
												</div>
												<div className="text-sm text-gray-500">Groups</div>
											</div>
											<div className="text-center">
												<div className="text-xl font-bold text-gray-800">
													{userEvents.length}
												</div>
												<div className="text-sm text-gray-500">Events</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</section>

						{/* Content Section */}
						<section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
							{/* Content Header */}
							<div className="p-6 border-b border-gray-100">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
									{/* Section Tabs */}
									<nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
										{(["posts", "groups", "events"] as const).map((section) => (
											<button
												key={section}
												onClick={() => setActiveMainSection(section)}
												className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
													activeMainSection === section
														? "bg-white text-orange-600 shadow-sm"
														: "text-gray-600 hover:text-gray-800"
												}`}
											>
												{section.charAt(0).toUpperCase() + section.slice(1)} (
												{section === "posts"
													? userPosts.length
													: section === "groups"
													? userGroups.length
													: userEvents.length}
												)
											</button>
										))}
									</nav>

									{/* Search and View Controls */}
									<div className="flex items-center gap-3">
										<div className="relative">
											<Search
												className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
												size={16}
											/>
											<input
												type="text"
												placeholder={`Search ${activeMainSection}...`}
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
											/>
										</div>

										<div className="flex bg-gray-100 rounded-lg p-1">
											<button
												onClick={() => setViewMode("grid")}
												className={`p-2 rounded-md transition-all duration-200 ${
													viewMode === "grid"
														? "bg-white shadow-sm text-orange-600"
														: "text-gray-500 hover:text-gray-700"
												}`}
											>
												<Grid size={16} />
											</button>
											<button
												onClick={() => setViewMode("list")}
												className={`p-2 rounded-md transition-all duration-200 ${
													viewMode === "list"
														? "bg-white shadow-sm text-orange-600"
														: "text-gray-500 hover:text-gray-700"
												}`}
											>
												<List size={16} />
											</button>
										</div>
									</div>
								</div>

								{searchTerm && (
									<div className="mt-4 text-sm text-gray-600">
										Showing {getFilteredContentCount()} results for "
										{searchTerm}"
									</div>
								)}
							</div>

							<div className="p-6">{renderContent()}</div>
						</section>
					</main>

					{/* Sidebar */}
					<aside className="space-y-6">
						{/* Tags Section */}
						<section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
							<nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-6">
								<button
									onClick={() => setActiveAsideSection("tags")}
									className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
										activeAsideSection === "tags"
											? "bg-white text-orange-600 shadow-sm"
											: "text-gray-600 hover:text-gray-800"
									}`}
								>
									User Tags
								</button>
								<button
									onClick={() => setActiveAsideSection("similar")}
									className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
										activeAsideSection === "similar"
											? "bg-white text-orange-600 shadow-sm"
											: "text-gray-600 hover:text-gray-800"
									}`}
								>
									Similar
								</button>
							</nav>
							{renderTagContent()}
						</section>

						{/* Quick Stats */}
						<section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
							<h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
								<Award size={16} className="text-orange-500" />
								User Stats
							</h3>
							<div className="space-y-3">
								{[
									{ label: "Total Posts", value: userPosts.length },
									{ label: "Total Likes", value: getTotalLikes() },
									{ label: "Groups Joined", value: userGroups.length },
									{ label: "Events Attending", value: userEvents.length },
									{ label: "Profile Tags", value: userTags.length },
								].map(({ label, value }) => (
									<div
										key={label}
										className="flex items-center justify-between"
									>
										<span className="text-sm text-gray-600">{label}</span>
										<span className="font-semibold text-gray-800">{value}</span>
									</div>
								))}
							</div>
						</section>

						{/* Contact Info */}
						<section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
							<h3 className="font-semibold text-gray-800 mb-4">
								Contact Information
							</h3>
							<div className="space-y-3">
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
										<UserIcon size={16} className="text-orange-600" />
									</div>
									<div>
										<p className="text-sm text-gray-500">Full Name</p>
										<p className="font-medium text-gray-800">
											{userDetails.firstName} {userDetails.lastName}
										</p>
									</div>
								</div>
								{(isAuthenticated || userDetails.email) && (
									<div className="flex items-start gap-3">
										<div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
											<Mail />
										</div>
										<div>
											<p className="text-sm text-gray-500">Email</p>
											<p className="font-medium text-gray-800">
												{userDetails.email || "Not public"}
											</p>
										</div>
									</div>
								)}
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
										<Calendar size={16} className="text-orange-600" />
									</div>
									<div>
										<p className="text-sm text-gray-500">Member Since</p>
										<p className="font-medium text-gray-800">
											{new Date(
												userDetails.createdAt || "",
											).toLocaleDateString()}
										</p>
									</div>
								</div>
							</div>
						</section>
					</aside>
				</div>
			</div>

			{/* Mobile Tags Section */}
			<section className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-7xl mx-auto mt-8">
				<div className="mb-4">
					<h2 className="text-xl font-semibold text-gray-800 mb-1">
						User Profile Tags
					</h2>
					<p className="text-gray-600 text-sm">
						View interests and find similar users
					</p>
				</div>

				<nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-6">
					<button
						onClick={() => setActiveAsideSection("tags")}
						className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
							activeAsideSection === "tags"
								? "bg-white text-orange-600 shadow-sm"
								: "text-gray-600 hover:text-gray-800"
						}`}
					>
						User Tags
					</button>
					<button
						onClick={() => setActiveAsideSection("similar")}
						className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
							activeAsideSection === "similar"
								? "bg-white text-orange-600 shadow-sm"
								: "text-gray-600 hover:text-gray-800"
						}`}
					>
						Similar
					</button>
				</nav>

				{renderTagContent()}
			</section>

			{/* Modals */}
			<CommentModal
				isOpen={commentModal.isOpen}
				onClose={closeCommentModal}
				postId={commentModal.postId || 0}
				initialComments={commentModal.comments}
			/>

			{isLikesModalOpen && likesModalPostId && (
				<LikesModal
					isOpen={isLikesModalOpen}
					onClose={closeLikesModal}
					postId={likesModalPostId}
					initialCount={0}
				/>
			)}
		</div>
	);
};

export default ProfileDetails;

// import React, { useState, useMemo, useCallback } from "react";
// import { Link, useLoaderData } from "react-router-dom";
// import {
// 	Heart,
// 	MessageCircle,
// 	Share2,
// 	Bookmark,
// 	Users,
// 	Calendar,
// 	Plus,
// 	Grid,
// 	List,
// 	Search,
// 	TrendingUp,
// 	Award,
// 	Clock,
// 	Eye,
// 	UserIcon,
// 	ArrowLeft,
// 	LucideIcon,
// } from "lucide-react";
// import {
// 	User,
// 	Post,
// 	Group,
// 	Event,
// 	Tag as TagInterface,
// 	UserComment,
// } from "../../../types";
// import Mail from "../../Mail";

// // Define the loader data structure
// interface ProfileDetailsLoaderData {
// 	user: User;
// 	currentUser: User | null;
// 	isOwnProfile: boolean;
// 	isAuthenticated: boolean;
// }

// // Reusable empty state component with proper icon typing
// interface EmptyStateProps {
// 	icon: LucideIcon;
// 	title: string;
// 	description: string;
// 	actionButton?: {
// 		to: string;
// 		text: string;
// 		icon: LucideIcon;
// 	};
// }

// const EmptyState: React.FC<EmptyStateProps> = ({
// 	icon: Icon,
// 	title,
// 	description,
// 	actionButton,
// }) => (
// 	<div className="text-center py-16">
// 		<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
// 			<div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
// 				<Icon className="text-white" size={24} />
// 			</div>
// 			<h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
// 			<p className="text-gray-600 mb-4">{description}</p>
// 			{actionButton && (
// 				<Link
// 					to={actionButton.to}
// 					className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200"
// 				>
// 					<actionButton.icon size={16} />
// 					{actionButton.text}
// 				</Link>
// 			)}
// 		</div>
// 	</div>
// );

// // Post card component with proper typing
// interface PostCardProps {
// 	post: Post;
// 	userDetails: User;
// 	userComments: UserComment[];
// 	formatTimeAgo: (date: string) => string;
// }

// const PostCard: React.FC<PostCardProps> = ({
// 	post,
// 	userDetails,
// 	userComments,
// 	formatTimeAgo,
// }) => (
// 	<article
// 		className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
// 		style={{ minHeight: "500px" }}
// 	>
// 		{/* Post Header */}
// 		<div className="p-4 border-b border-gray-50 flex-shrink-0">
// 			<div className="flex items-center gap-3">
// 				<img
// 					src={userDetails?.profileImage}
// 					alt={userDetails?.username}
// 					className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
// 				/>
// 				<span className="font-semibold text-gray-800 truncate">
// 					{userDetails?.username}
// 				</span>
// 			</div>
// 		</div>

// 		{/* Post Title */}
// 		<div className="px-4 py-3 border-b border-gray-50 flex-shrink-0">
// 			<h3 className="font-semibold text-gray-800 text-base leading-tight break-words h-10">
// 				{post.title}
// 			</h3>
// 		</div>

// 		{/* Post Image */}
// 		{post.image && (
// 			<div className="relative flex-shrink-0">
// 				<img
// 					src={post.image}
// 					alt={post.title}
// 					className="w-full h-64 object-cover"
// 				/>
// 				<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
// 			</div>
// 		)}

// 		{/* Post Content */}
// 		<div className="p-4 flex-1 flex flex-col">
// 			<div className="flex items-center gap-6 mb-3">
// 				<button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors duration-200">
// 					<Heart size={18} />
// 					<span className="text-sm font-medium">{post.likes}</span>
// 				</button>
// 				<button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
// 					<MessageCircle size={18} />
// 					<span className="text-sm font-medium">{userComments.length}</span>
// 				</button>
// 				<button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors duration-200 ml-auto">
// 					<Share2 size={16} />
// 				</button>
// 				<button className="flex items-center gap-2 text-gray-600 hover:text-yellow-500 transition-colors duration-200">
// 					<Bookmark size={16} />
// 				</button>
// 			</div>

// 			{/* Caption */}
// 			<div className="text-sm text-gray-700 leading-relaxed flex-1">
// 				<div className="flex items-start gap-2 flex-wrap">
// 					<span className="font-semibold text-gray-800 flex-shrink-0">
// 						{userDetails?.username}
// 					</span>
// 					<span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0 self-center">
// 						<Clock size={12} />
// 						{formatTimeAgo(post.updatedAt)}
// 					</span>
// 					<span className="break-words">{post.caption}</span>
// 				</div>
// 			</div>
// 		</div>
// 	</article>
// );

// // Group card component
// const GroupCard: React.FC<{ group: Group }> = ({ group }) => (
// 	<Link to={`/groups/${group.id}`} className="group block">
// 		<article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
// 			<div className="relative">
// 				<img
// 					src={group.image}
// 					alt={group.name}
// 					className="w-full h-48 object-cover"
// 				/>
// 				<div className="absolute top-4 right-4">
// 					<span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full">
// 						{group.type}
// 					</span>
// 				</div>
// 			</div>
// 			<div className="p-6 flex-1 flex flex-col">
// 				<h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-200">
// 					{group.name}
// 				</h2>
// 				<p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
// 					{group.about}
// 				</p>
// 				<div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
// 					<div className="flex items-center gap-1">
// 						<Users size={14} />
// 						<span>{group.numMembers.toLocaleString()} members</span>
// 					</div>
// 					<div className="flex items-center gap-1">
// 						<Calendar size={14} />
// 						<span>{group.events?.length || 0} events</span>
// 					</div>
// 				</div>
// 			</div>
// 		</article>
// 	</Link>
// );

// // Event card component
// const EventCard: React.FC<{ event: Event }> = ({ event }) => (
// 	<Link to={`/events/${event.id}`} className="group block">
// 		<article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
// 			<div className="relative">
// 				<img
// 					src={event.image}
// 					alt={event.name}
// 					className="w-full h-48 object-cover"
// 				/>
// 				<div className="absolute top-4 right-4">
// 					<span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full">
// 						{event.type}
// 					</span>
// 				</div>
// 			</div>
// 			<div className="p-6 flex-1 flex flex-col">
// 				<h2 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-200">
// 					{event.name}
// 				</h2>
// 				<p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
// 					{event.description}
// 				</p>
// 				<div className="space-y-2 text-sm text-gray-500 mt-auto">
// 					<div className="flex items-center gap-2">
// 						<Calendar size={14} />
// 						<span>{new Date(event.startDate).toLocaleDateString()}</span>
// 					</div>
// 					<div className="flex items-center justify-between">
// 						<div className="flex items-center gap-1">
// 							<Users size={14} />
// 							<span>
// 								{event.numAttendees}/{event.capacity} attending
// 							</span>
// 						</div>
// 					</div>
// 				</div>
// 			</div>
// 		</article>
// 	</Link>
// );

// // Empty state configurations with proper typing
// interface EmptyStateConfig {
// 	icon: LucideIcon;
// 	title: string;
// 	description: string;
// 	actionButton?: {
// 		to: string;
// 		text: string;
// 		icon: LucideIcon;
// 	};
// }

// const ProfileDetails: React.FC = () => {
// 	// Get data from React Router loader
// 	const {
// 		user: userDetails,
// 		isOwnProfile,
// 		isAuthenticated,
// 	} = useLoaderData() as ProfileDetailsLoaderData;

// 	// State hooks - must be called unconditionally
// 	const [activeMainSection, setActiveMainSection] = useState<
// 		"posts" | "groups" | "events"
// 	>("posts");
// 	const [activeAsideSection, setActiveAsideSection] = useState<
// 		"tags" | "similar"
// 	>("tags");
// 	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
// 	const [searchTerm, setSearchTerm] = useState("");

// 	// Memoized values - must be called unconditionally
// 	const userTags = useMemo(() => userDetails?.usersTags ?? [], [userDetails]);
// 	const userPosts = useMemo(() => userDetails?.posts ?? [], [userDetails]);
// 	const userGroups = useMemo(() => userDetails?.group ?? [], [userDetails]);
// 	const userEvents = useMemo(() => userDetails?.events ?? [], [userDetails]);
// 	const userComments = useMemo(
// 		() => userDetails?.userComments ?? [],
// 		[userDetails],
// 	);

// 	const sortedUserPosts = useMemo(() => {
// 		return [...userPosts].sort(
// 			(a: Post, b: Post) =>
// 				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
// 		);
// 	}, [userPosts]);

// 	// Filter content based on search term
// 	const filteredPosts = useMemo((): Post[] => {
// 		if (activeMainSection !== "posts") return [];

// 		if (!searchTerm) return sortedUserPosts;

// 		const term = searchTerm.toLowerCase();
// 		return sortedUserPosts.filter(
// 			(post: Post) =>
// 				post.title.toLowerCase().includes(term) ||
// 				post.caption.toLowerCase().includes(term),
// 		);
// 	}, [activeMainSection, searchTerm, sortedUserPosts]);

// 	const filteredGroups = useMemo((): Group[] => {
// 		if (activeMainSection !== "groups") return [];

// 		if (!searchTerm) return userGroups;

// 		const term = searchTerm.toLowerCase();
// 		return userGroups.filter(
// 			(group: Group) =>
// 				group.name.toLowerCase().includes(term) ||
// 				group.about.toLowerCase().includes(term),
// 		);
// 	}, [activeMainSection, searchTerm, userGroups]);

// 	const filteredEvents = useMemo((): Event[] => {
// 		if (activeMainSection !== "events") return [];

// 		if (!searchTerm) return userEvents;

// 		const term = searchTerm.toLowerCase();
// 		return userEvents.filter(
// 			(event: Event) =>
// 				event.name.toLowerCase().includes(term) ||
// 				event.description.toLowerCase().includes(term),
// 		);
// 	}, [activeMainSection, searchTerm, userEvents]);

// 	// Helper functions
// 	const formatTimeAgo = useCallback((dateString: string) => {
// 		const now = new Date();
// 		const postDate = new Date(dateString);
// 		const diffInDays = Math.floor(
// 			(now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24),
// 		);
// 		return `${diffInDays}d ago`;
// 	}, []);

// 	const getTotalLikes = useCallback(() => {
// 		return userPosts.reduce((total, post) => total + (post.likes || 0), 0);
// 	}, [userPosts]);

// 	// Get current filtered content count for display
// 	const getFilteredContentCount = useCallback(() => {
// 		switch (activeMainSection) {
// 			case "posts":
// 				return filteredPosts.length;
// 			case "groups":
// 				return filteredGroups.length;
// 			case "events":
// 				return filteredEvents.length;
// 			default:
// 				return 0;
// 		}
// 	}, [
// 		activeMainSection,
// 		filteredPosts.length,
// 		filteredGroups.length,
// 		filteredEvents.length,
// 	]);

// 	// Render content
// 	const renderContent = useCallback(() => {
// 		// Grid/List class helper
// 		const getGridClass = () => {
// 			if (activeMainSection === "posts") {
// 				return viewMode === "grid"
// 					? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6 w-full"
// 					: "space-y-6";
// 			}
// 			return viewMode === "grid"
// 				? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
// 				: "space-y-6";
// 		};

// 		// Empty state configurations with proper typing
// 		const emptyStates: Record<"posts" | "groups" | "events", EmptyStateConfig> =
// 			{
// 				posts: {
// 					icon: Grid,
// 					title: "No Posts Yet",
// 					description: "This user hasn't shared any posts yet.",
// 					actionButton: isAuthenticated
// 						? {
// 								to: "/posts/create",
// 								text: "Create Post",
// 								icon: Plus,
// 						  }
// 						: undefined,
// 				},
// 				groups: {
// 					icon: Users,
// 					title: "No Groups Yet",
// 					description: "This user hasn't joined any groups yet.",
// 					actionButton: {
// 						to: "/groups",
// 						text: "Explore Groups",
// 						icon: Users,
// 					},
// 				},
// 				events: {
// 					icon: Calendar,
// 					title: "No Events Yet",
// 					description: "This user isn't attending any events yet.",
// 					actionButton: {
// 						to: "/events",
// 						text: "Explore Events",
// 						icon: Calendar,
// 					},
// 				},
// 			};

// 		// Type-safe rendering based on active section
// 		switch (activeMainSection) {
// 			case "posts":
// 				if (filteredPosts.length === 0) {
// 					return <EmptyState {...emptyStates.posts} />;
// 				}
// 				return (
// 					<div className={getGridClass()}>
// 						{filteredPosts.map((post: Post) => (
// 							<PostCard
// 								key={post.id}
// 								post={post}
// 								userDetails={userDetails}
// 								userComments={userComments}
// 								formatTimeAgo={formatTimeAgo}
// 							/>
// 						))}
// 					</div>
// 				);

// 			case "groups":
// 				if (filteredGroups.length === 0) {
// 					return <EmptyState {...emptyStates.groups} />;
// 				}
// 				return (
// 					<div className={getGridClass()}>
// 						{filteredGroups.map((group: Group) => (
// 							<GroupCard key={group.id} group={group} />
// 						))}
// 					</div>
// 				);

// 			case "events":
// 				if (filteredEvents.length === 0) {
// 					return <EmptyState {...emptyStates.events} />;
// 				}
// 				return (
// 					<div className={getGridClass()}>
// 						{filteredEvents.map((event: Event) => (
// 							<EventCard key={event.id} event={event} />
// 						))}
// 					</div>
// 				);

// 			default:
// 				return null;
// 		}
// 	}, [
// 		activeMainSection,
// 		viewMode,
// 		filteredPosts,
// 		filteredGroups,
// 		filteredEvents,
// 		userDetails,
// 		userComments,
// 		formatTimeAgo,
// 		isAuthenticated,
// 	]);

// 	// Render tag content
// 	const renderTagContent = useCallback(() => {
// 		if (activeAsideSection === "tags") {
// 			return userTags.length > 0 ? (
// 				<div className="space-y-6">
// 					<div className="flex flex-wrap gap-2">
// 						{userTags.map((tag: TagInterface) => (
// 							<span
// 								key={tag.id}
// 								className="px-3 py-1 bg-gradient-to-r from-orange-100 to-slate-100 text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:shadow-sm transition-all duration-200"
// 							>
// 								{tag.name}
// 							</span>
// 						))}
// 					</div>
// 				</div>
// 			) : (
// 				<div className="text-center py-4">
// 					<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
// 						<UserIcon className="text-gray-400" size={20} />
// 					</div>
// 					<p className="text-gray-500 text-sm">No tags added yet.</p>
// 				</div>
// 			);
// 		}

// 		return (
// 			<div className="space-y-6">
// 				<div className="text-center">
// 					<div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
// 						<TrendingUp className="text-white" size={20} />
// 					</div>
// 					<h3 className="font-semibold text-gray-800 mb-2">
// 						Discover Similar Users
// 					</h3>
// 					<p className="text-gray-600 text-sm mb-4">
// 						Find users with similar interests
// 					</p>
// 				</div>
// 				<Link to="/profile-feed">
// 					<button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg">
// 						<Eye size={16} />
// 						Find Similar Users
// 					</button>
// 				</Link>
// 			</div>
// 		);
// 	}, [activeAsideSection, userTags]);

// 	// Early returns after all hooks
// 	if (isOwnProfile) {
// 		return (
// 			<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
// 				<div className="text-center">
// 					<h2 className="text-2xl font-bold text-gray-800 mb-4">
// 						Redirecting to your profile...
// 					</h2>
// 					<Link to="/profile" className="text-orange-600 hover:text-orange-800">
// 						Click here if not redirected automatically
// 					</Link>
// 				</div>
// 			</div>
// 		);
// 	}

// 	if (!userDetails) {
// 		return (
// 			<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
// 				<div className="text-center p-8">
// 					<div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
// 					<p className="text-slate-600">Loading user profile...</p>
// 				</div>
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
// 			{/* Navigation */}
// 			<nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
// 				<div className="max-w-7xl mx-auto px-4 py-4">
// 					<div className="flex items-center justify-between">
// 						<Link
// 							to="/profile-feed"
// 							className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
// 						>
// 							<ArrowLeft size={18} />
// 							Back to Profiles
// 						</Link>
// 						<div className="flex items-center gap-3">
// 							{isAuthenticated ? (
// 								<>
// 									<Link
// 										to="/profile"
// 										className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
// 									>
// 										My Profile
// 									</Link>
// 									<Link
// 										to="/posts/create"
// 										className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg"
// 									>
// 										<Plus size={16} />
// 										Create Post
// 									</Link>
// 								</>
// 							) : (
// 								<Link
// 									to="/login"
// 									className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg"
// 								>
// 									Sign In
// 								</Link>
// 							)}
// 						</div>
// 					</div>
// 				</div>
// 			</nav>

// 			<div className="max-w-7xl mx-auto px-4 py-8">
// 				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
// 					{/* Main Content */}
// 					<main className="lg:col-span-3 space-y-8">
// 						{/* Profile Header */}
// 						<section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
// 							<div className="relative h-32 bg-gradient-to-r from-orange-500 to-slate-600">
// 								<div className="absolute inset-0 bg-black/20"></div>
// 							</div>
// 							<div className="relative px-6 pb-6">
// 								<div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-16">
// 									<div className="relative self-center">
// 										<img
// 											src={userDetails.profileImage}
// 											alt={userDetails.username}
// 											className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
// 										/>
// 									</div>

// 									<div className="flex-1 mt-20 sm:mt-0">
// 										<h1 className="text-2xl font-bold text-gray-800">
// 											{userDetails.username}
// 										</h1>
// 										<p className="text-gray-600 mt-1">
// 											{userDetails.firstName} {userDetails.lastName}
// 										</p>
// 										<p className="text-gray-500 text-sm">
// 											Member since{" "}
// 											{new Date(
// 												userDetails.createdAt || "",
// 											).toLocaleDateString()}
// 										</p>

// 										{userDetails.bio && (
// 											<p className="text-gray-700 mt-4 leading-relaxed">
// 												{userDetails.bio}
// 											</p>
// 										)}

// 										{/* Stats */}
// 										<div className="flex items-center gap-8 mt-6">
// 											<div className="text-center">
// 												<div className="text-xl font-bold text-gray-800">
// 													{userPosts.length}
// 												</div>
// 												<div className="text-sm text-gray-500">Posts</div>
// 											</div>
// 											<div className="text-center">
// 												<div className="text-xl font-bold text-gray-800">
// 													{getTotalLikes()}
// 												</div>
// 												<div className="text-sm text-gray-500">Likes</div>
// 											</div>
// 											<div className="text-center">
// 												<div className="text-xl font-bold text-gray-800">
// 													{userGroups.length}
// 												</div>
// 												<div className="text-sm text-gray-500">Groups</div>
// 											</div>
// 											<div className="text-center">
// 												<div className="text-xl font-bold text-gray-800">
// 													{userEvents.length}
// 												</div>
// 												<div className="text-sm text-gray-500">Events</div>
// 											</div>
// 										</div>
// 									</div>
// 								</div>
// 							</div>
// 						</section>

// 						{/* Content Section */}
// 						<section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
// 							{/* Content Header */}
// 							<div className="p-6 border-b border-gray-100">
// 								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
// 									{/* Section Tabs */}
// 									<nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
// 										{(["posts", "groups", "events"] as const).map((section) => (
// 											<button
// 												key={section}
// 												onClick={() => setActiveMainSection(section)}
// 												className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
// 													activeMainSection === section
// 														? "bg-white text-orange-600 shadow-sm"
// 														: "text-gray-600 hover:text-gray-800"
// 												}`}
// 											>
// 												{section.charAt(0).toUpperCase() + section.slice(1)} (
// 												{section === "posts"
// 													? userPosts.length
// 													: section === "groups"
// 													? userGroups.length
// 													: userEvents.length}
// 												)
// 											</button>
// 										))}
// 									</nav>

// 									{/* Search and View Controls */}
// 									<div className="flex items-center gap-3">
// 										<div className="relative">
// 											<Search
// 												className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
// 												size={16}
// 											/>
// 											<input
// 												type="text"
// 												placeholder={`Search ${activeMainSection}...`}
// 												value={searchTerm}
// 												onChange={(e) => setSearchTerm(e.target.value)}
// 												className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
// 											/>
// 										</div>

// 										<div className="flex bg-gray-100 rounded-lg p-1">
// 											<button
// 												onClick={() => setViewMode("grid")}
// 												className={`p-2 rounded-md transition-all duration-200 ${
// 													viewMode === "grid"
// 														? "bg-white shadow-sm text-orange-600"
// 														: "text-gray-500 hover:text-gray-700"
// 												}`}
// 											>
// 												<Grid size={16} />
// 											</button>
// 											<button
// 												onClick={() => setViewMode("list")}
// 												className={`p-2 rounded-md transition-all duration-200 ${
// 													viewMode === "list"
// 														? "bg-white shadow-sm text-orange-600"
// 														: "text-gray-500 hover:text-gray-700"
// 												}`}
// 											>
// 												<List size={16} />
// 											</button>
// 										</div>
// 									</div>
// 								</div>

// 								{searchTerm && (
// 									<div className="mt-4 text-sm text-gray-600">
// 										Showing {getFilteredContentCount()} results for "
// 										{searchTerm}"
// 									</div>
// 								)}
// 							</div>

// 							<div className="p-6">{renderContent()}</div>
// 						</section>
// 					</main>

// 					{/* Sidebar */}
// 					<aside className="space-y-6">
// 						{/* Tags Section */}
// 						<section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
// 							<nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-6">
// 								<button
// 									onClick={() => setActiveAsideSection("tags")}
// 									className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
// 										activeAsideSection === "tags"
// 											? "bg-white text-orange-600 shadow-sm"
// 											: "text-gray-600 hover:text-gray-800"
// 									}`}
// 								>
// 									User Tags
// 								</button>
// 								<button
// 									onClick={() => setActiveAsideSection("similar")}
// 									className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
// 										activeAsideSection === "similar"
// 											? "bg-white text-orange-600 shadow-sm"
// 											: "text-gray-600 hover:text-gray-800"
// 									}`}
// 								>
// 									Similar
// 								</button>
// 							</nav>
// 							{renderTagContent()}
// 						</section>

// 						{/* Quick Stats */}
// 						<section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
// 							<h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
// 								<Award size={16} className="text-orange-500" />
// 								User Stats
// 							</h3>
// 							<div className="space-y-3">
// 								{[
// 									{ label: "Total Posts", value: userPosts.length },
// 									{ label: "Total Likes", value: getTotalLikes() },
// 									{ label: "Groups Joined", value: userGroups.length },
// 									{ label: "Events Attending", value: userEvents.length },
// 									{ label: "Profile Tags", value: userTags.length },
// 								].map(({ label, value }) => (
// 									<div
// 										key={label}
// 										className="flex items-center justify-between"
// 									>
// 										<span className="text-sm text-gray-600">{label}</span>
// 										<span className="font-semibold text-gray-800">{value}</span>
// 									</div>
// 								))}
// 							</div>
// 						</section>

// 						{/* Contact Info */}
// 						<section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
// 							<h3 className="font-semibold text-gray-800 mb-4">
// 								Contact Information
// 							</h3>
// 							<div className="space-y-3">
// 								<div className="flex items-start gap-3">
// 									<div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
// 										<UserIcon size={16} className="text-orange-600" />
// 									</div>
// 									<div>
// 										<p className="text-sm text-gray-500">Full Name</p>
// 										<p className="font-medium text-gray-800">
// 											{userDetails.firstName} {userDetails.lastName}
// 										</p>
// 									</div>
// 								</div>
// 								{(isAuthenticated || userDetails.email) && (
// 									<div className="flex items-start gap-3">
// 										<div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
// 											<Mail />
// 										</div>
// 										<div>
// 											<p className="text-sm text-gray-500">Email</p>
// 											<p className="font-medium text-gray-800">
// 												{userDetails.email || "Not public"}
// 											</p>
// 										</div>
// 									</div>
// 								)}
// 								<div className="flex items-start gap-3">
// 									<div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
// 										<Calendar size={16} className="text-orange-600" />
// 									</div>
// 									<div>
// 										<p className="text-sm text-gray-500">Member Since</p>
// 										<p className="font-medium text-gray-800">
// 											{new Date(
// 												userDetails.createdAt || "",
// 											).toLocaleDateString()}
// 										</p>
// 									</div>
// 								</div>
// 							</div>
// 						</section>
// 					</aside>
// 				</div>
// 			</div>

// 			{/* Mobile Tags Section */}
// 			<section className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-7xl mx-auto mt-8">
// 				<div className="mb-4">
// 					<h2 className="text-xl font-semibold text-gray-800 mb-1">
// 						User Profile Tags
// 					</h2>
// 					<p className="text-gray-600 text-sm">
// 						View interests and find similar users
// 					</p>
// 				</div>

// 				<nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-6">
// 					<button
// 						onClick={() => setActiveAsideSection("tags")}
// 						className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
// 							activeAsideSection === "tags"
// 								? "bg-white text-orange-600 shadow-sm"
// 								: "text-gray-600 hover:text-gray-800"
// 						}`}
// 					>
// 						User Tags
// 					</button>
// 					<button
// 						onClick={() => setActiveAsideSection("similar")}
// 						className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
// 							activeAsideSection === "similar"
// 								? "bg-white text-orange-600 shadow-sm"
// 								: "text-gray-600 hover:text-gray-800"
// 						}`}
// 					>
// 						Similar
// 					</button>
// 				</nav>

// 				{renderTagContent()}
// 			</section>
// 		</div>
// 	);
// };

// export default ProfileDetails;
