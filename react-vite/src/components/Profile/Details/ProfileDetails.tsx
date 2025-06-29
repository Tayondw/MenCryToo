import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
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
} from "lucide-react";
import {
	RootState,
	User,
	Post,
	Group,
	Event,
	Tag as TagInterface,
} from "../../../types";
import Mail from "../../Mail";

const ProfileDetails: React.FC = () => {
	// Get data from React Router loader
	const userDetails = useLoaderData() as User;
	const navigate = useNavigate();
	const sessionUser = useSelector((state: RootState) => state.session.user);

	// State hooks
	const [activeMainSection, setActiveMainSection] = useState<
		"posts" | "groups" | "events"
	>("posts");
	const [activeAsideSection, setActiveAsideSection] = useState<
		"tags" | "similar"
	>("tags");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchTerm, setSearchTerm] = useState("");

	// Redirect if not authenticated
	useEffect(() => {
		if (!sessionUser) {
			navigate("/", { replace: true });
		}
	}, [sessionUser, navigate]);

	// Memoized user-related values with proper null checks and default arrays
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

	// Filter content based on search term
	const filteredContent = useMemo(() => {
		if (!searchTerm) {
			switch (activeMainSection) {
				case "posts":
					return sortedUserPosts;
				case "groups":
					return userGroups;
				case "events":
					return userEvents;
				default:
					return [];
			}
		}

		const term = searchTerm.toLowerCase();
		switch (activeMainSection) {
			case "posts":
				return sortedUserPosts.filter(
					(post) =>
						post.title.toLowerCase().includes(term) ||
						post.caption.toLowerCase().includes(term),
				);
			case "groups":
				return userGroups.filter(
					(group) =>
						group.name.toLowerCase().includes(term) ||
						group.about.toLowerCase().includes(term),
				);
			case "events":
				return userEvents.filter(
					(event) =>
						event.name.toLowerCase().includes(term) ||
						event.description.toLowerCase().includes(term),
				);
			default:
				return [];
		}
	}, [activeMainSection, searchTerm, sortedUserPosts, userGroups, userEvents]);

	// Format time ago helper
	const formatTimeAgo = useCallback((dateString: string) => {
		const now = new Date();
		const postDate = new Date(dateString);
		const diffInDays = Math.floor(
			(now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		return `${diffInDays}d ago`;
	}, []);

	// Get total likes across all posts
	const getTotalLikes = () => {
		return userPosts.reduce((total, post) => total + (post.likes || 0), 0);
	};

	// Render content based on active section
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
						{(content as Post[]).map((post: Post) => (
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
												src={userDetails?.profileImage}
												alt={userDetails?.username}
												className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
											/>
											<div className="min-w-0 flex-1">
												<span className="font-semibold text-gray-800 block truncate">
													{userDetails?.username}
												</span>
											</div>
										</div>
									</div>
								</div>

								{/* Post Title */}
								<div className="px-4 py-3 border-b border-gray-50 flex-shrink-0">
									<h3 className="font-semibold text-gray-800 text-base tracking-normal leading-tight break-words">
										{post.title}
									</h3>
								</div>

								{/* Post Image */}
								{post.image && (
									<div className="relative flex-shrink-0">
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
										<button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors duration-200">
											<Heart size={18} />
											<span className="text-sm font-medium">{post.likes}</span>
										</button>
										<button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
											<MessageCircle size={18} />
											<span className="text-sm font-medium">
												{userComments.length}
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
												{userDetails?.username}
											</span>
											<span className="text-xs text-gray-500 flex self-center items-center gap-1 flex-shrink-0">
												<Clock size={12} />
												{formatTimeAgo(post.updatedAt)}
											</span>
											<span className="break-words">{post.caption}</span>
										</div>
									</div>
								</div>
							</article>
						))}
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
												<Calendar size={14} />
												<span>{group.events?.length || 0} events</span>
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
		userDetails,
		userComments,
		userPosts,
		userGroups,
		userEvents,
		formatTimeAgo,
	]);

	// Render tag content based on active section
	const renderTagContent = useCallback(() => {
		switch (activeAsideSection) {
			case "tags":
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
					<div className="space-y-6">
						<div className="text-center py-4">
							<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
								<UserIcon className="text-gray-400" size={20} />
							</div>
							<p className="text-gray-500 text-sm mb-4">No tags added yet.</p>
						</div>
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
	}, [activeAsideSection, userTags]);

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
							to="/posts-feed"
							className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
						>
							<ArrowLeft size={18} />
							Posts Feed
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
									<div className="relative self-center">
										<img
											src={userDetails.profileImage}
											alt={userDetails.username}
											className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
										/>
									</div>

									<div className="flex-1 mt-4 sm:mt-0">
										<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
											<div className="mt-20">
												<h1 className="text-2xl font-bold text-gray-800">
													{userDetails.username}
												</h1>
												<p className="text-gray-600 mt-1">
													{userDetails.firstName} {userDetails.lastName}
												</p>
												<p className="text-gray-500 text-sm">
													{userDetails.email}
												</p>
											</div>
										</div>

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
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
										<Mail />
									</div>
									<div>
										<p className="text-sm text-gray-500">Email</p>
										<p className="font-medium text-gray-800">
											{userDetails.email}
										</p>
									</div>
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
		</div>
	);
};

export default ProfileDetails;
