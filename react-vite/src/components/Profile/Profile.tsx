// Optimized Profile Component with React.memo and performance improvements
import React, { useState, useMemo, useCallback, memo } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { User, Post, Group, Event, Tag, Comment } from "../../types";

// Memoized sub-components
const UserStats = memo(
	({
		userPosts,
		userGroups,
		userEvents,
	}: {
		userPosts: Post[];
		userGroups: Group[];
		userEvents: Event[];
	}) => {
		const totalLikes = useMemo(
			() => userPosts.reduce((total, post) => total + (post.likes || 0), 0),
			[userPosts],
		);

		return (
			<div className="flex items-center gap-8 mt-6">
				<div className="text-center">
					<div className="text-xl font-bold text-gray-800">
						{userPosts.length}
					</div>
					<div className="text-sm text-gray-500">Posts</div>
				</div>
				<div className="text-center">
					<div className="text-xl font-bold text-gray-800">{totalLikes}</div>
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
		);
	},
);

const PostCard = memo(
	({
		post,
		currentUser,
		userComments,
		formatTimeAgo,
	}: {
		post: Post;
		currentUser: User;
		userComments: Comment;
		formatTimeAgo: (date: string) => string;
		navigate: (path: string) => void;
	}) => {
		return (
			<article
				className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
				style={{ minHeight: "500px" }}
			>
				{/* Post Header */}
				<div className="p-4 border-b border-gray-50 flex-shrink-0">
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3 min-w-0 flex-1">
							<img
								src={currentUser?.profileImage}
								alt={currentUser?.username}
								className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
								loading="lazy"
							/>
							<div className="min-w-0 flex-1">
								<span className="font-semibold text-gray-800 block truncate">
									{currentUser?.username}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Post Title */}
				<div className="px-4 py-3 border-b border-gray-50 flex-shrink-0">
					<h3 className="font-semibold text-gray-800 text-sm tracking-wide leading-tight break-words">
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
							loading="lazy"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
					</div>
				)}

				{/* Post Content */}
				<div className="p-4 flex-1 flex flex-col">
					<div className="flex items-center gap-6 mb-3">
						<button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors duration-200">
							<span className="text-sm font-medium">{post.likes}</span>
						</button>
						<button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors duration-200">
							<span className="text-sm font-medium">{userComments.length}</span>
						</button>
					</div>

					{/* Caption */}
					<div className="text-sm text-gray-700 leading-relaxed flex-1">
						<div className="flex items-start gap-2 flex-wrap">
							<span className="font-semibold text-gray-800 flex-shrink-0">
								{currentUser?.username}
							</span>
							<span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0 self-center">
								{formatTimeAgo(post.updatedAt)}
							</span>
							<span className="break-words">{post.caption}</span>
						</div>
					</div>
				</div>
			</article>
		);
	},
);

const TagSection = memo(
	({
		userTags,
		handleAddTags,
	}: {
		userTags: Tag[];
		handleAddTags: () => void;
	}) => {
		return (
			<div className="space-y-6">
				{userTags.length > 0 ? (
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
				) : (
					<div className="text-center py-4">
						<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
							<span className="text-gray-400">No tags added yet.</span>
						</div>
					</div>
				)}
				<button
					onClick={handleAddTags}
					className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg"
				>
					Add Tags
				</button>
			</div>
		);
	},
);

// Main optimized Profile component
const Profile: React.FC = memo(() => {
	const loaderData = useLoaderData() as { user: User } | null;
	const navigate = useNavigate();
	const currentUser = loaderData?.user;

	// Memoized values
	const userTags = useMemo(() => currentUser?.usersTags ?? [], [currentUser]);
	const userPosts = useMemo(() => currentUser?.posts ?? [], [currentUser]);
	const userGroups = useMemo(() => currentUser?.group ?? [], [currentUser]);
	const userEvents = useMemo(() => currentUser?.events ?? [], [currentUser]);
	const userComments = useMemo(
		() => currentUser?.userComments ?? [],
		[currentUser],
	);

	const sortedUserPosts = useMemo(() => {
		return [...userPosts].sort(
			(a: Post, b: Post) =>
				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		);
	}, [userPosts]);

	// State hooks
	const [activeMainSection, setActiveMainSection] = useState<
		"posts" | "groups" | "events"
	>("posts");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchTerm, setSearchTerm] = useState("");

	// Memoized callbacks
	const formatTimeAgo = useCallback((dateString: string) => {
		const now = new Date();
		const postDate = new Date(dateString);
		const diffInDays = Math.floor(
			(now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		return `${diffInDays}d ago`;
	}, []);

	const handleAddTags = useCallback(() => {
		// Handle add tags functionality
	}, []);

	// Memoized filtered content
	const filteredContent = useMemo(() => {
		let content;
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
		return content.filter((item: any) => {
			if (activeMainSection === "posts") {
				return (
					item.title.toLowerCase().includes(term) ||
					item.caption.toLowerCase().includes(term)
				);
			} else if (activeMainSection === "groups") {
				return (
					item.name.toLowerCase().includes(term) ||
					item.about.toLowerCase().includes(term)
				);
			} else if (activeMainSection === "events") {
				return (
					item.name.toLowerCase().includes(term) ||
					item.description.toLowerCase().includes(term)
				);
			}
			return true;
		});
	}, [activeMainSection, searchTerm, sortedUserPosts, userGroups, userEvents]);

	if (!currentUser) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
				<div className="text-center p-8">
					<div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-slate-600">Loading profile...</p>
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
							← Posts Feed
						</Link>
						<Link
							to="/posts/create"
							className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg"
						>
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
											loading="eager"
										/>
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
										</div>

										{currentUser?.bio && (
											<p className="text-gray-700 mt-4 leading-relaxed">
												{currentUser.bio}
											</p>
										)}

										{/* Stats Component */}
										<UserStats
											userPosts={userPosts}
											userGroups={userGroups}
											userEvents={userEvents}
										/>
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
												Grid
											</button>
											<button
												onClick={() => setViewMode("list")}
												className={`p-2 rounded-md transition-all duration-200 ${
													viewMode === "list"
														? "bg-white shadow-sm text-orange-600"
														: "text-gray-500 hover:text-gray-700"
												}`}
											>
												List
											</button>
										</div>
									</div>
								</div>
							</div>

							{/* Content Area */}
							<div className="p-6">
								{activeMainSection === "posts" && (
									<div
										className={`${
											viewMode === "grid"
												? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6 w-full"
												: "space-y-6"
										}`}
									>
										{filteredContent.map((post) => (
											<PostCard
												key={post.id}
												post={post}
												currentUser={currentUser}
												userComments={userComments}
												formatTimeAgo={formatTimeAgo}
												navigate={navigate}
											/>
										))}
									</div>
								)}
							</div>
						</section>
					</main>

					{/* Sidebar */}
					<aside className="space-y-6">
						{/* Tags Section */}
						<section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
							<TagSection userTags={userTags} handleAddTags={handleAddTags} />
						</section>
					</aside>
				</div>
			</div>
		</div>
	);
});

export default Profile;
