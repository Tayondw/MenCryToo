import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import {
	MessageCircle,
	Users,
	Calendar,
	MapPin,
	Edit3,
	Settings,
	Plus,
	Grid,
	List,
	Search,
	Trash2,
	Share2,
	Bookmark,
	TrendingUp,
	Award,
	Clock,
	Eye,
	UserIcon,
} from "lucide-react";
import { User, Post, Group, Event, Tag } from "../../types";
import PostMenu from "../Posts/PostMenu";
import DeleteProfile from "./CRUD/Delete";
import AddTags from "../Tags/AddTags";
import LikeButton from "../Likes/PostsLikesButton";
import LikesModal from "../Likes/PostsLikesModal";
import CommentModal from "../Comments/CommentModal";
import { useComments } from "../../hooks/useComments";
import { useLikes, useLikesModal } from "../../hooks/useLikes";

// Mock data for demonstration when no backend data is available
const mockUser: User = {
	id: 1,
	username: "johndoe",
	firstName: "John",
	lastName: "Doe",
	email: "john.doe@example.com",
	hashedPassword: "mock_hashed_password_123",
	bio: "Passionate developer and community builder focused on mental health advocacy and creating supportive environments for men to express their emotions.",
	profileImage:
		"https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
	createdAt: "2024-01-01T08:00:00Z",
	updatedAt: "2024-01-20T15:30:00Z",
	usersTags: [
		{ id: 1, name: "ANXIETY" },
		{ id: 2, name: "DEPRESSION" },
		{ id: 3, name: "STRESS" },
		{ id: 4, name: "RELATIONSHIPS" },
	],
	posts: [
		{
			id: 1,
			title: "My Journey with Mental Health",
			caption:
				"Just finished working on an amazing React project with some incredible features! It has been a transformative experience that helped me cope with my anxiety.",
			image:
				"https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800",
			likes: 42,
			creator: 1,
			createdAt: "2024-01-15T10:30:00Z",
			updatedAt: "2024-01-15T10:30:00Z",
			user: {} as User,
			comments: 3,
		},
		{
			id: 2,
			title: "Finding Support in Community",
			caption:
				"Exploring the world of design systems and component libraries while dealing with depression. The creative process has been therapeutic.",
			image:
				"https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
			likes: 28,
			creator: 1,
			createdAt: "2024-01-10T14:20:00Z",
			updatedAt: "2024-01-10T14:20:00Z",
			user: {} as User,
			comments: 1,
		},
		{
			id: 3,
			title: "Breaking the Silence",
			caption:
				"Learning to express my emotions and break free from toxic masculinity. It is okay for men to cry and seek help.",
			image:
				"https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",
			likes: 67,
			creator: 1,
			createdAt: "2024-01-05T16:45:00Z",
			updatedAt: "2024-01-05T16:45:00Z",
			user: {} as User,
			comments: 5,
		},
	],
	group: [
		{
			id: 1,
			name: "Men's Mental Health Support",
			about:
				"A safe space for men to discuss mental health challenges and support each other",
			image:
				"https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400",
			city: "San Francisco",
			state: "CA",
			numMembers: 1250,
			type: "Support Group",
			organizerId: 1,
			events: [],
		},
		{
			id: 2,
			name: "Anxiety Support Circle",
			about: "Supporting each other through anxiety and panic disorders",
			image:
				"https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400",
			city: "Oakland",
			state: "CA",
			numMembers: 850,
			type: "Support Group",
			organizerId: 1,
			events: [],
		},
	],
	events: [
		{
			id: 1,
			name: "Mental Health Awareness Conference 2024",
			description:
				"Annual conference focused on men's mental health awareness and breaking stigma",
			image:
				"https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=400",
			numAttendees: 150,
			capacity: 200,
			type: "Conference",
			startDate: "2024-03-15T09:00:00Z",
			endDate: "2024-03-15T18:00:00Z",
			venueInfo: {
				id: 4,
				groupId: 1,
				address: "1000 Conference Center Dr",
				city: "San Francisco",
				state: "CA",
				latitude: 37.7849,
				longitude: -122.4194,
			},
			groupInfo: {} as Group,
		},
		{
			id: 2,
			name: "Stress Management Workshop",
			description:
				"Interactive workshop on managing stress in daily life and work environments",
			image:
				"https://images.pexels.com/photos/3184340/pexels-photo-3184340.jpeg?auto=compress&cs=tinysrgb&w=400",
			numAttendees: 45,
			capacity: 50,
			type: "Workshop",
			startDate: "2024-02-28T14:00:00Z",
			endDate: "2024-02-28T17:00:00Z",
			venueInfo: {
				id: 5,
				groupId: 2,
				address: "555 Workshop Way",
				city: "Oakland",
				state: "CA",
				latitude: 37.8144,
				longitude: -122.2811,
			},
			groupInfo: {} as Group,
		},
	],
	userComments: [
		{
			id: 1,
			comment: "Thank you for sharing your story, it really helped me!",
			userId: 2,
			postId: 1,
			createdAt: "2024-01-16T09:15:00Z",
			updatedAt: "2024-01-16T09:15:00Z",
		},
		{
			id: 2,
			comment: "Your post about anxiety management was incredibly helpful.",
			userId: 3,
			postId: 1,
			createdAt: "2024-01-16T14:30:00Z",
			updatedAt: "2024-01-16T14:30:00Z",
		},
		{
			id: 3,
			comment:
				"I appreciate your vulnerability and openness about mental health.",
			userId: 4,
			postId: 3,
			createdAt: "2024-01-06T10:20:00Z",
			updatedAt: "2024-01-06T10:20:00Z",
		},
		{
			id: 4,
			comment: "Looking forward to the next group session!",
			userId: 5,
			createdAt: "2024-01-18T16:45:00Z",
			updatedAt: "2024-01-18T16:45:00Z",
		},
	],
};

const Profile: React.FC = () => {
	// Get data from React Router loader
	const loaderData = useLoaderData() as { user: User } | null;
	const navigate = useNavigate();

	// Use loader data or fallback to mock data for development
	const currentUser = loaderData?.user || mockUser;

	// State hooks
	const [activeMainSection, setActiveMainSection] = useState<
		"posts" | "groups" | "events"
	>("posts");
	const [activeAsideSection, setActiveAsideSection] = useState<
		"tags" | "similar"
	>("tags");
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showAddTagsModal, setShowAddTagsModal] = useState(false);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchTerm, setSearchTerm] = useState("");

	// Add state to track comment counts for posts
	const [postCommentCounts, setPostCommentCounts] = useState<
		Map<number, number>
	>(new Map());

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
	} = useComments({
		forceRefreshOnClose: true, // Force refresh to update post comment counts
		refreshDelay: 100,
	});

	// Memoized user-related values with proper null checks and default arrays
	// These MUST be called unconditionally, even if currentUser is null
	const userTags = useMemo(() => currentUser?.usersTags ?? [], [currentUser]);
	const userPosts = useMemo(() => currentUser?.posts ?? [], [currentUser]);
	const userGroups = useMemo(() => currentUser?.group ?? [], [currentUser]);
	const userEvents = useMemo(() => currentUser?.events ?? [], [currentUser]);

	const sortedUserPosts = useMemo(() => {
		return [...userPosts].sort(
			(a: Post, b: Post) =>
				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		);
	}, [userPosts]);

	// Initialize like states for all posts
	useEffect(() => {
		userPosts.forEach((post) => {
			if (!likeStates.has(post.id)) {
				setLikeState(post.id, false, post.likes);
				fetchLikeStatus(post.id);
			}
		});
	}, [userPosts, likeStates, setLikeState, fetchLikeStatus]);

	// Initialize comment counts when posts load
	useEffect(() => {
		const counts = new Map<number, number>();
		userPosts.forEach((post) => {
			counts.set(post.id, post.comments);
		});
		setPostCommentCounts(counts);
	}, [userPosts]);

	// Filter content based on search term with proper typing
	const filteredContent = useMemo(() => {
		let content: Post[] | Group[] | Event[];

		switch (activeMainSection) {
			case "posts":
				content = sortedUserPosts;
				break;
			case "groups":
				content = userGroups;
				break;
			case "events":
				content = userEvents;
				break;
			default:
				content = [];
		}

		if (!searchTerm) return content;

		const term = searchTerm.toLowerCase();

		if (activeMainSection === "posts") {
			return (content as Post[]).filter(
				(post) =>
					post.title.toLowerCase().includes(term) ||
					post.caption.toLowerCase().includes(term),
			);
		} else if (activeMainSection === "groups") {
			return (content as Group[]).filter(
				(group) =>
					group.name.toLowerCase().includes(term) ||
					group.about.toLowerCase().includes(term),
			);
		} else if (activeMainSection === "events") {
			return (content as Event[]).filter(
				(event) =>
					event.name.toLowerCase().includes(term) ||
					event.description.toLowerCase().includes(term),
			);
		}

		return content;
	}, [activeMainSection, searchTerm, sortedUserPosts, userGroups, userEvents]);

	const formatTimeAgo = useCallback((dateString: string) => {
		const now = new Date();
		const postDate = new Date(dateString);
		const diffInDays = Math.floor(
			(now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		return `${diffInDays}d ago`;
	}, []);

	// Interactive handlers
	const handleLikeToggle = useCallback(
		async (postId: number, isLiked: boolean, newCount: number) => {
			setLikeState(postId, isLiked, newCount);
		},
		[setLikeState],
	);

	const handleCommentsClick = useCallback(
		(postId: number) => {
			const post = userPosts.find((p) => p.id === postId);

			// Callback with automatic refresh
			const handleCommentsChange = (postId: number, newCount: number) => {
				setPostCommentCounts((prev) => {
					const newMap = new Map(prev);
					newMap.set(postId, newCount);
					return newMap;
				});
				// Page will automatically refresh when modal closes
			};

			// Open modal (will trigger refresh on close if comments changed)
			if (post) {
				openCommentModal(postId, [], handleCommentsChange);
			} else {
				openCommentModal(postId, [], handleCommentsChange);
			}
		},
		[userPosts, openCommentModal],
	);

	const handleLikesClick = useCallback(
		(postId: number) => {
			openLikesModal(postId);
		},
		[openLikesModal],
	);

	const handlePostClick = useCallback(
		(postId: number) => {
			navigate(`/posts/${postId}`);
		},
		[navigate],
	);

	// Callback hooks
	const handleDeleteProfile = useCallback(() => {
		setShowDeleteModal(true);
	}, []);

	const closeDeleteModal = useCallback(() => {
		setShowDeleteModal(false);
	}, []);

	const confirmDeleteProfile = useCallback(() => {
		setShowDeleteModal(false);
		// The DeleteProfile component handles the actual deletion
	}, []);

	const handleAddTags = useCallback(() => {
		setShowAddTagsModal(true);
	}, []);

	const closeAddTagsModal = useCallback(() => {
		setShowAddTagsModal(false);
	}, []);

	// Get total likes across all posts
	const getTotalLikes = () => {
		return userPosts.reduce((total, post) => total + (post.likes || 0), 0);
	};

	// Render functions with proper typing
	const renderContent = useCallback(() => {
		const content = filteredContent;

		switch (activeMainSection) {
			case "posts":
				return userPosts.length > 0 ? (
					<div
						className={`${
							viewMode === "grid"
								? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6 w-full"
								: "space-y-6"
						}`}
					>
						{(content as Post[]).map((post: Post) => {
							const currentLikeState = likeStates.get(post.id) || {
								isLiked: false,
								likeCount: post.likes,
								isLoading: false,
							};

							// Get current comment count from state, fallback to post.comments
							const currentCommentCount =
								postCommentCounts.get(post.id) ?? post.comments;

							return (
								<article
									key={post.id}
									className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
									style={{ minHeight: "500px" }}
								>
									{/* Post Header with User Info */}
									<div className="p-4 border-b border-gray-50 flex-shrink-0">
										<div className="flex items-center justify-between gap-3">
											<div className="flex items-center gap-3 min-w-0 flex-1">
												<img
													src={currentUser?.profileImage}
													alt={currentUser?.username}
													className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
												/>
												<div className="min-w-0 flex-1">
													<span className="font-semibold text-gray-800 block truncate">
														{currentUser?.username}
													</span>
												</div>
											</div>
											<div className="flex-shrink-0">
												<PostMenu post={post} navigate={navigate} />
											</div>
										</div>
									</div>

									{/* Post Title - Make it clickable */}
									<div className="px-4 py-3 border-b border-gray-50 flex-shrink-0">
										<h3
											className="font-semibold text-gray-800 text-sm tracking-wide leading-tight break-words cursor-pointer hover:text-orange-600 transition-colors"
											onClick={() => handlePostClick(post.id)}
										>
											{post.title}
										</h3>
									</div>

									{/* Post Image - Make it clickable */}
									{post.image && (
										<div
											className="relative flex-shrink-0 cursor-pointer"
											onClick={() => handlePostClick(post.id)}
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
											{/* Like Button with proper handlers */}
											<LikeButton
												postId={post.id}
												initialLikeCount={currentLikeState.likeCount}
												initialIsLiked={currentLikeState.isLiked}
												onLikeToggle={handleLikeToggle}
												onLikesClick={() => handleLikesClick(post.id)}
												size={18}
												disabled={currentLikeState.isLoading}
											/>

											{/* Comment Button with proper handler */}
											<button
												onClick={() => handleCommentsClick(post.id)}
												className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors duration-200"
											>
												<MessageCircle size={18} />
												<span className="text-sm font-medium">
													{currentCommentCount}
												</span>
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
													{currentUser?.username}
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
						})}
					</div>
				) : (
					<div className="text-center py-16">
						<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
							<div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<Grid className="text-white" size={24} />
							</div>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								No Posts Yet
							</h3>
							<p className="text-gray-600 mb-4">
								Share your first post to get started!
							</p>
							<Link
								to="/posts/create"
								className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200"
							>
								<Plus size={16} />
								Create Post
							</Link>
						</div>
					</div>
				);

			case "groups":
				return userGroups.length > 0 ? (
					<div
						className={`${
							viewMode === "grid"
								? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
								: "space-y-6"
						}`}
					>
						{(content as Group[]).map((group: Group) => (
							<Link
								to={`/groups/${group.id}`}
								key={group.id}
								className="group block"
							>
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
												<MapPin size={14} />
												<span>
													{group.city}, {group.state}
												</span>
											</div>
										</div>
									</div>
								</article>
							</Link>
						))}
					</div>
				) : (
					<div className="text-center py-16">
						<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
							<div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<Users className="text-white" size={24} />
							</div>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								No Groups Yet
							</h3>
							<p className="text-gray-600 mb-4">
								Join groups to connect with like-minded people!
							</p>
							<Link
								to="/groups"
								className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200"
							>
								<Users size={16} />
								Explore Groups
							</Link>
						</div>
					</div>
				);

			case "events":
				return userEvents.length > 0 ? (
					<div
						className={`${
							viewMode === "grid"
								? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
								: "space-y-6"
						}`}
					>
						{(content as Event[]).map((event: Event) => (
							<Link
								key={event.id}
								to={`/events/${event.id}`}
								className="group block"
							>
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
												<span>
													{new Date(event.startDate).toLocaleDateString()}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-1">
													<Users size={14} />
													<span>
														{event.numAttendees}/{event.capacity} attending
													</span>
												</div>
												{event.venueInfo && (
													<div className="flex items-center gap-1">
														<MapPin size={14} />
														<span>
															{event.venueInfo.city}, {event.venueInfo.state}
														</span>
													</div>
												)}
											</div>
										</div>
									</div>
								</article>
							</Link>
						))}
					</div>
				) : (
					<div className="text-center py-16">
						<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
							<div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<Calendar className="text-white" size={24} />
							</div>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								No Events Yet
							</h3>
							<p className="text-gray-600 mb-4">
								Create or join events to get started!
							</p>
							<Link
								to="/events"
								className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200"
							>
								<Calendar size={16} />
								Explore Events
							</Link>
						</div>
					</div>
				);

			default:
				return null;
		}
	}, [
		activeMainSection,
		filteredContent,
		viewMode,
		currentUser,
		userPosts,
		userGroups,
		userEvents,
		formatTimeAgo,
		navigate,
		likeStates,
		handleLikeToggle,
		handleCommentsClick,
		handleLikesClick,
		handlePostClick,
		postCommentCounts,
	]);

	const renderTagContent = useCallback(() => {
		switch (activeAsideSection) {
			case "tags":
				return userTags.length > 0 ? (
					<div className="space-y-6">
						<div className="flex flex-wrap gap-2">
							{userTags.map((tag: Tag) => (
								<span
									key={tag.id}
									className="px-3 py-1 bg-gradient-to-r from-orange-100 to-slate-100 text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:shadow-sm transition-all duration-200"
								>
									{tag.name}
								</span>
							))}
						</div>
						<button
							onClick={handleAddTags}
							className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg"
						>
							<Plus size={16} />
							Add Tags
						</button>
					</div>
				) : (
					<div className="space-y-6">
						<div className="text-center py-4">
							<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
								<UserIcon className="text-gray-400" size={20} />
							</div>
							<p className="text-gray-500 text-sm mb-4">No tags added yet.</p>
						</div>
						<button
							onClick={handleAddTags}
							className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg"
						>
							<Plus size={16} />
							Add Tags
						</button>
					</div>
				);

			case "similar":
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
								Find users with similar interests based on your tags
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

			default:
				return null;
		}
	}, [activeAsideSection, userTags, handleAddTags]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
			{/* Navigation */}
			<nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<Link
							to="/similar-feed"
							className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
						>
							← Posts Feed
						</Link>
						<Link
							to="/posts/create"
							className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg"
						>
							<Plus size={16} />
							Create Post
						</Link>
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
									<div className="relative justify-center self-center">
										<img
											src={currentUser?.profileImage}
											alt={currentUser?.username}
											className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
										/>
										<Link
											to={`/users/${currentUser?.id}/profile/update`}
											className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 group"
										>
											<Edit3
												size={16}
												className="text-gray-600 group-hover:text-orange-600 transition-colors"
											/>
										</Link>
									</div>

									<div className="flex-1 mt-4 sm:mt-0">
										<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
											<div className="mt-16">
												<h1 className="text-2xl font-bold text-gray-800">
													{currentUser?.username}
												</h1>
												<p className="text-gray-600 mt-1">
													{currentUser?.firstName} {currentUser?.lastName}
												</p>
												<p className="text-gray-500 text-sm">
													{currentUser?.email}
												</p>
											</div>
											<div className="flex items-center gap-3 mt-4 sm:-mt-8">
												<Link
													to={`/users/${currentUser?.id}/profile/update`}
													className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200"
												>
													<Settings size={16} />
													Edit Profile
												</Link>
												<button
													onClick={handleDeleteProfile}
													className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-all duration-200"
												>
													<Trash2 size={16} />
													Delete
												</button>
											</div>
										</div>

										{currentUser?.bio && (
											<p className="text-gray-700 mt-4 leading-relaxed">
												{currentUser.bio}
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

									<div className="flex items-center gap-3">
										{/* Search */}
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

										{/* View Mode Toggle */}
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

								{/* Search Results Info */}
								{searchTerm && (
									<div className="mt-4 text-sm text-gray-600">
										Showing {filteredContent.length} results for "{searchTerm}"
									</div>
								)}
							</div>

							{/* Content Area */}
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
									Your Tags
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
								Quick Stats
							</h3>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">Total Posts</span>
									<span className="font-semibold text-gray-800">
										{userPosts.length}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">Total Likes</span>
									<span className="font-semibold text-gray-800">
										{getTotalLikes()}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">Groups Joined</span>
									<span className="font-semibold text-gray-800">
										{userGroups.length}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">
										Events Attending
									</span>
									<span className="font-semibold text-gray-800">
										{userEvents.length}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">Profile Tags</span>
									<span className="font-semibold text-gray-800">
										{userTags.length}
									</span>
								</div>
							</div>
						</section>
					</aside>
				</div>
			</div>

			{/* Mobile Tags Section - Only visible on mobile */}
			<section className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-7xl mx-auto mt-8">
				<div className="mb-4">
					<h2 className="text-xl font-semibold text-gray-800 mb-1">
						Your Profile Tags
					</h2>
					<p className="text-gray-600 text-sm">
						Manage your interests and find similar users
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
						Your Tags
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

			{/* Modals - Positioned to be visible in viewport */}
			{showDeleteModal && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="w-full max-w-md">
						<DeleteProfile
							user={currentUser!}
							onClose={closeDeleteModal}
							onConfirm={confirmDeleteProfile}
						/>
					</div>
				</div>
			)}

			{showAddTagsModal && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
						<AddTags user={currentUser!} onClose={closeAddTagsModal} />
					</div>
				</div>
			)}

			{/* Comment Modal */}
			<CommentModal
				isOpen={commentModal.isOpen}
				onClose={closeCommentModal}
				postId={commentModal.postId || 0}
				initialComments={commentModal.comments}
				forceRefreshOnClose={true}
				onCommentsChange={(postId, newCount) => {
					setPostCommentCounts((prev) => {
						const newMap = new Map(prev);
						newMap.set(postId, newCount);
						return newMap;
					});
				}}
			/>

			{/* Likes Modal */}
			{isLikesModalOpen && likesModalPostId && (
				<LikesModal
					isOpen={isLikesModalOpen}
					onClose={closeLikesModal}
					postId={likesModalPostId}
					initialCount={likeStates.get(likesModalPostId)?.likeCount || 0}
				/>
			)}
		</div>
	);
};

export default Profile;
