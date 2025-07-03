import React, { useState, useMemo, useCallback } from "react";
import { useLoaderData, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	Heart,
	MessageCircle,
	User,
	Search,
	ArrowLeft,
      Plus,
      Clock
} from "lucide-react";
import type { LoaderResponse } from "../../loaders/postLoaders";

// Define component types
interface SessionUser {
	id: number;
	username: string;
	usersTags: Array<{ id: number; name: string }>;
}

interface RootState {
	session: {
		user: SessionUser | null;
	};
}

interface PostUser {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	profileImage: string;
}

interface Post {
	id: number;
	title: string;
	caption: string;
	creator: number;
	image: string;
	likes: number;
	comments: number;
	createdAt: string;
	updatedAt: string;
	user: PostUser;
}

const Posts: React.FC = () => {
	const loaderData = useLoaderData() as LoaderResponse;
	const sessionUser = useSelector((state: RootState) => state.session.user);

	const [searchTerm, setSearchTerm] = useState<string>("");

	// Handle data structure
	const allProfiles = useMemo(() => {
		if (loaderData && loaderData.users_profile) {
			return loaderData;
		}
		return { users_profile: [] };
	}, [loaderData]);

	// Get posts from users
	const { posts } = useMemo(() => {
		if (!sessionUser) {
			return { posts: [] };
		}

		const allPosts: Post[] = [];

		if (allProfiles.users_profile) {
			allProfiles.users_profile.forEach((user) => {
				if (user.posts && Array.isArray(user.posts)) {
					allPosts.push(...user.posts);
				}
			});
		}

		// Filter by search
		let filteredPosts = allPosts;
		if (searchTerm) {
			const searchLower = searchTerm.toLowerCase();
			filteredPosts = allPosts.filter(
				(post) =>
					post.title?.toLowerCase().includes(searchLower) ||
					post.caption?.toLowerCase().includes(searchLower) ||
					post.user?.username?.toLowerCase().includes(searchLower),
			);
		}

		// Sort by recent
		const sortedPosts = filteredPosts.sort(
			(a, b) =>
				new Date(b.updatedAt || 0).getTime() -
				new Date(a.updatedAt || 0).getTime(),
		);

		return { posts: sortedPosts };
	}, [allProfiles, sessionUser, searchTerm]);

	const formatTimeAgo = useCallback((dateString: string) => {
		if (!dateString) return "Unknown";
		const now = new Date();
		const postDate = new Date(dateString);
		const diffInDays = Math.floor(
			(now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		return `${Math.max(1, diffInDays)}d ago`;
	}, []);

	if (!sessionUser) {
		window.location.href = "/";
		return null;
	}

	// Handle error state
	if (loaderData?.error) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 flex items-center justify-center">
				<div className="bg-white rounded-2xl p-8 shadow-sm border border-red-200 max-w-md mx-auto text-center">
					<h3 className="text-xl font-semibold text-red-800 mb-2">
						Error Loading Posts
					</h3>
					<p className="text-red-600 mb-4">{loaderData.error}</p>
					<Link
						to="/profile"
						className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
					>
						<ArrowLeft size={18} />
						Back to Profile
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100">
			{/* Header */}
			<div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<Link
							to="/profile"
							className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
						>
							<ArrowLeft size={20} />
							Profile
						</Link>
						<Link
							to="/posts/create"
							className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
						>
							<Plus size={18} />
							Create Post
						</Link>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Title */}
				<div className="text-center mb-8">
					<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-slate-800 bg-clip-text text-transparent mb-4">
						Discover Similar Minds
					</h1>
					<p className="text-lg text-slate-600 max-w-2xl mx-auto">
						Connect with posts from users who share your interests and passions.
					</p>
				</div>

				{/* Search */}
				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
					<div className="relative">
						<Search
							size={20}
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
						/>
						<input
							type="text"
							placeholder="Search posts, users, or content..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
						/>
					</div>
					<div className="mt-4 pt-4 border-t border-slate-200">
						<p className="text-sm text-slate-600">
							Showing <span className="font-semibold">{posts.length}</span>{" "}
							posts from users with similar interests
						</p>
					</div>
				</div>

				{/* Content */}
				{posts.length === 0 ? (
					<div className="text-center py-16">
						<div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
							<User size={32} className="text-slate-400" />
						</div>
						<h3 className="text-xl font-semibold text-slate-900 mb-2">
							{loaderData?.message || "No Posts Found"}
						</h3>
						<p className="text-slate-600 mb-6 max-w-md mx-auto">
							{loaderData?.message?.includes("Add tags")
								? "Add some tags to your profile to discover users with similar interests!"
								: "Users with similar interests haven't posted anything yet, or no posts match your search."}
						</p>
						<Link
							to={`/users/${sessionUser.id}/profile/update`}
							className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
						>
							<User size={20} />
							Update Profile
						</Link>
					</div>
				) : (
					<div className="flex flex-col justify-center items-center space-y-8">
						{posts.map((post) => (
							<div
								key={post.id}
								className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 max-w-4xl w-full"
							>
								{/* Header - Simple layout with just profile link and title */}
								<div className="p-4 border-b border-gray-50">
									<div className="flex items-center justify-between">
										<Link
											to={`/users/${post.creator}`}
											className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200 no-underline"
										>
											<img
												src={post.user?.profileImage}
												alt={post.user?.username}
												className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
												loading="lazy"
											/>
											<p className="font-semibold text-gray-800">
												{post.user?.username}
											</p>
										</Link>
										<div className="text-right">
											<p className="font-semibold text-gray-800 text-sm">
												{post.title}
											</p>
										</div>
									</div>
								</div>

								{/* Image */}
								{post.image && (
									<div className="relative">
										<img
											src={post.image}
											alt={post.title}
											className="w-full h-96 object-cover"
											loading="lazy"
										/>
									</div>
								)}

								{/* Footer - Like buttons and caption with username/time on same line */}
								<div className="p-4">
									<div className="flex items-center gap-6 mb-3">
										<div className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors duration-200 cursor-pointer">
											<Heart size={18} />
											<span className="text-sm font-medium">
												{post.likes || 0}
											</span>
										</div>
										<div className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors duration-200 cursor-pointer">
											<MessageCircle size={18} />
											<span className="text-sm font-medium">
												{post.comments || 0}
											</span>
										</div>
									</div>

									<div className="flex items-center gap-2 text-sm text-gray-700 leading-relaxed">
										<Link
											to={`/users/${post.creator}`}
											className="font-semibold text-gray-800 hover:text-gray-600 transition-colors"
										>
											{post.user?.username}
										</Link>
										<span className="text-gray-400">•</span>
										<span className="text-gray-500 flex-shrink-0 flex items-center gap-1">
											<Clock size={12}/>{formatTimeAgo(post.updatedAt)}
										</span>
										<span className="text-gray-400">•</span>
										<p className="text-gray-700 flex-1">{post.caption}</p>
									</div>
								</div>
							</div>
						))}

						{/* Pagination Info */}
						{loaderData.pagination && loaderData.pagination.pages > 1 && (
							<div className="mt-8 text-center">
								<p className="text-slate-600">
									Page {loaderData.pagination.page} of{" "}
									{loaderData.pagination.pages} ({loaderData.pagination.total}{" "}
									total posts)
								</p>
								<div className="flex justify-center gap-2 mt-4">
									{loaderData.pagination.has_prev && (
										<Link
											to={`?page=${loaderData.pagination.page - 1}`}
											className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
										>
											Previous
										</Link>
									)}
									{loaderData.pagination.has_next && (
										<Link
											to={`?page=${loaderData.pagination.page + 1}`}
											className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
										>
											Next
										</Link>
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default Posts;

// import React, { useState, useMemo, memo, useCallback } from "react";
// import { useLoaderData, Link } from "react-router-dom";
// import { useSelector } from "react-redux";
// import {
// 	Heart,
// 	MessageCircle,
// 	User,
// 	Search,
// 	Filter,
// 	Grid,
// 	List,
// 	ArrowLeft,
// 	Plus,
// } from "lucide-react";
// import type { ProfilesData, RootState, User as UserType, Post } from "../../types";

// interface FilterOptions {
// 	searchTerm: string;
// 	sortBy: "recent" | "popular" | "oldest";
// 	userFilter: string;
// }

// // Memoized PostCard component
// const PostCard = memo(
// 	({
// 		post,
// 		formatTimeAgo,
// 	}: {
// 		post: Post;
// 		sessionUser: UserType;
// 		formatTimeAgo: (date: string) => string;
//             }) => {
//             console.log("-----------", post)
// 		return (
// 			<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 max-w-4xl w-full mb-8">
// 				<div className="p-4 border-b border-gray-50">
// 					<div className="flex items-center justify-between">
// 						<Link
// 							to={`/users/${post.creator}`}
// 							className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200 no-underline"
// 						>
// 							<img
// 								src={post?.user?.profileImage}
// 								alt={post?.user?.username}
// 								className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
// 								loading="lazy"
// 							/>
// 							<p className="font-semibold text-gray-800">
// 								{post?.user?.username}
// 							</p>
// 						</Link>
// 						<div className="text-right">
// 							<p className="font-semibold text-gray-800 text-sm">
// 								{post?.title}
// 							</p>
// 						</div>
// 					</div>
// 				</div>

// 				{post?.image && (
// 					<div className="relative">
// 						<img
// 							src={post?.image}
// 							alt={post?.title}
// 							className="w-full h-96 object-cover"
// 							loading="lazy"
// 						/>
// 						<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
// 					</div>
// 				)}

// 				<div className="p-4">
// 					<div className="flex items-center gap-6 mb-3">
// 						<div className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors duration-200 cursor-pointer">
// 							<Heart size={18} />
// 							<span className="text-sm font-medium">{post?.likes}</span>
// 						</div>
// 						<div className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors duration-200 cursor-pointer">
// 							<MessageCircle size={18} />
// 							<span className="text-sm font-medium">0</span>
// 						</div>
// 					</div>

// 					<div className="flex items-center gap-2 text-sm text-gray-700 leading-relaxed">
// 						<p className="font-semibold text-gray-800">
// 							{post?.user?.username}
// 						</p>
// 						<p className="text-gray-400">•</p>
// 						<p className="text-gray-500">{formatTimeAgo(post?.updatedAt)}</p>
// 						<p className="text-gray-400">•</p>
// 						<p className="text-gray-700">{post?.caption}</p>
// 					</div>
// 				</div>
// 			</div>
// 		);
// 	},
// );

// // Memoized FilterControls component
// const FilterControls = memo(
// 	({
// 		filters,
// 		setFilters,
// 		viewMode,
// 		setViewMode,
// 		showFilters,
// 		setShowFilters,
// 		clearFilters,
// 	}: {
// 		filters: FilterOptions;
// 		setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
// 		viewMode: "grid" | "list";
// 		setViewMode: React.Dispatch<React.SetStateAction<"grid" | "list">>;
// 		showFilters: boolean;
// 		setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
// 		clearFilters: () => void;
// 	}) => {
// 		return (
// 			<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
// 				<div className="flex flex-col lg:flex-row lg:items-center gap-4">
// 					{/* Search */}
// 					<div className="flex-1">
// 						<div className="relative">
// 							<Search
// 								size={20}
// 								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
// 							/>
// 							<input
// 								type="text"
// 								placeholder="Search posts, users, or content..."
// 								value={filters.searchTerm}
// 								onChange={(e) =>
// 									setFilters((prev) => ({
// 										...prev,
// 										searchTerm: e.target.value,
// 									}))
// 								}
// 								className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
// 							/>
// 						</div>
// 					</div>

// 					{/* Sort */}
// 					<div className="flex items-center gap-2">
// 						<label className="text-sm font-medium text-slate-700">
// 							Sort by:
// 						</label>
// 						<select
// 							value={filters.sortBy}
// 							onChange={(e) =>
// 								setFilters((prev) => ({
// 									...prev,
// 									sortBy: e.target.value as FilterOptions["sortBy"],
// 								}))
// 							}
// 							className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
// 						>
// 							<option value="recent">Most Recent</option>
// 							<option value="popular">Most Popular</option>
// 							<option value="oldest">Oldest First</option>
// 						</select>
// 					</div>

// 					{/* View Toggle */}
// 					<div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
// 						<button
// 							onClick={() => setViewMode("grid")}
// 							className={`p-2 rounded-md transition-colors ${
// 								viewMode === "grid"
// 									? "bg-white shadow-sm text-orange-600"
// 									: "text-slate-600 hover:text-slate-900"
// 							}`}
// 						>
// 							<Grid size={18} />
// 						</button>
// 						<button
// 							onClick={() => setViewMode("list")}
// 							className={`p-2 rounded-md transition-colors ${
// 								viewMode === "list"
// 									? "bg-white shadow-sm text-orange-600"
// 									: "text-slate-600 hover:text-slate-900"
// 							}`}
// 						>
// 							<List size={18} />
// 						</button>
// 					</div>

// 					{/* Filter Toggle */}
// 					<button
// 						onClick={() => setShowFilters(!showFilters)}
// 						className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
// 							showFilters || filters.userFilter
// 								? "bg-orange-100 text-orange-700 border border-orange-200"
// 								: "bg-slate-100 text-slate-700 hover:bg-slate-200"
// 						}`}
// 					>
// 						<Filter size={18} />
// 						Filters
// 						{filters.userFilter && (
// 							<span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
// 								1
// 							</span>
// 						)}
// 					</button>
// 				</div>

// 				{/* Advanced Filters */}
// 				{showFilters && (
// 					<div className="mt-6 pt-6 border-t border-slate-200">
// 						<div className="grid md:grid-cols-3 gap-4">
// 							<div>
// 								<label className="block text-sm font-medium text-slate-700 mb-2">
// 									Filter by User
// 								</label>
// 								<input
// 									type="text"
// 									placeholder="Username"
// 									value={filters.userFilter}
// 									onChange={(e) =>
// 										setFilters((prev) => ({
// 											...prev,
// 											userFilter: e.target.value,
// 										}))
// 									}
// 									className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
// 								/>
// 							</div>
// 							<div className="md:col-span-2 flex items-end">
// 								<button
// 									onClick={clearFilters}
// 									className="w-full px-4 py-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
// 								>
// 									Clear Filters
// 								</button>
// 							</div>
// 						</div>
// 					</div>
// 				)}
// 			</div>
// 		);
// 	},
// );

// // Main Posts component
// const Posts: React.FC = () => {
// 	const allProfiles = useLoaderData() as ProfilesData;
// 	const sessionUser = useSelector((state: RootState) => state.session.user);

// 	const [filters, setFilters] = useState<FilterOptions>({
// 		searchTerm: "",
// 		sortBy: "recent",
// 		userFilter: "",
// 	});
// 	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
// 	const [showFilters, setShowFilters] = useState(false);

// 	// Memoized calculations
// 	const { similarUsers, filteredAndSortedPosts } = useMemo(() => {
// 		if (!sessionUser) {
// 			return {
// 				similarUsers: [],
// 				filteredAndSortedPosts: [],
// 			};
// 		}

// 		const sessionUserTags = sessionUser.usersTags.map((tag) => tag.id);

// 		const findSimilarUsers = (
// 			users: UserType[],
// 			sessionTags: number[],
// 		): UserType[] => {
// 			return users.filter((user) => {
// 				const userTags = user.usersTags.map((tag) => tag.id);
// 				return userTags.some((tagId) => sessionTags.includes(tagId));
// 			});
// 		};

// 		const similarUsers = findSimilarUsers(
// 			allProfiles.users_profile,
// 			sessionUserTags,
// 		);
// 		const posts = similarUsers.flatMap((user) => user.posts);

// 		// Filter and sort posts
// 		let filteredPosts = [...posts];

// 		// Apply search filter
// 		if (filters.searchTerm) {
// 			const searchLower = filters.searchTerm.toLowerCase();
// 			filteredPosts = filteredPosts.filter(
// 				(post) =>
// 					post.title.toLowerCase().includes(searchLower) ||
// 					post.caption.toLowerCase().includes(searchLower) ||
// 					post.user.username.toLowerCase().includes(searchLower),
// 			);
// 		}

// 		// Apply user filter
// 		if (filters.userFilter) {
// 			const userLower = filters.userFilter.toLowerCase();
// 			filteredPosts = filteredPosts.filter((post) =>
// 				post.user.username.toLowerCase().includes(userLower),
// 			);
// 		}

// 		// Sort posts
// 		let sortedPosts;
// 		switch (filters.sortBy) {
// 			case "recent":
// 				sortedPosts = filteredPosts.sort(
// 					(a, b) =>
// 						new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
// 				);
// 				break;
// 			case "popular":
// 				sortedPosts = filteredPosts.sort((a, b) => b.likes - a.likes);
// 				break;
// 			case "oldest":
// 				sortedPosts = filteredPosts.sort(
// 					(a, b) =>
// 						new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
// 				);
// 				break;
// 			default:
// 				sortedPosts = filteredPosts;
// 		}

// 		return {
// 			similarUsers,
// 			filteredAndSortedPosts: sortedPosts,
// 		};
// 	}, [allProfiles, sessionUser, filters]);

// 	// Memoized callback functions
// 	const formatTimeAgo = useCallback((dateString: string) => {
// 		const now = new Date();
// 		const postDate = new Date(dateString);
// 		const diffInDays = Math.floor(
// 			(now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24),
// 		);
// 		return `${Math.max(1, diffInDays)}d ago`;
// 	}, []);

// 	const clearFilters = useCallback(() => {
// 		setFilters({
// 			searchTerm: "",
// 			sortBy: "recent",
// 			userFilter: "",
// 		});
// 	}, []);

// 	if (!sessionUser) {
// 		window.location.href = "/";
// 		return null;
// 	}

// 	return (
// 		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100">
// 			{/* Header */}
// 			<div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
// 				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// 					<div className="flex items-center justify-between h-16">
// 						<div className="flex items-center gap-4">
// 							<Link
// 								to="/profile"
// 								className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
// 							>
// 								<ArrowLeft size={20} />
// 								Profile
// 							</Link>
// 						</div>

// 						<div className="flex items-center gap-3">
// 							<Link
// 								to="/posts/create"
// 								className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
// 							>
// 								<Plus size={18} />
// 								Create Post
// 							</Link>
// 						</div>
// 					</div>
// 				</div>
// 			</div>

// 			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// 				{/* Page Title */}
// 				<div className="text-center mb-8">
// 					<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-slate-800 bg-clip-text text-transparent mb-4">
// 						Discover Similar Minds
// 					</h1>
// 					<p className="text-lg text-slate-600 max-w-2xl mx-auto">
// 						Connect with posts from users who share your interests and passions.
// 					</p>
// 				</div>

// 				{!similarUsers.length ? (
// 					<div className="text-center py-16">
// 						<div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
// 							<User size={32} className="text-slate-400" />
// 						</div>
// 						<h3 className="text-xl font-semibold text-slate-900 mb-2">
// 							No Similar Users Found
// 						</h3>
// 						<p className="text-slate-600 mb-6 max-w-md mx-auto">
// 							Add some tags to your profile to discover users with similar
// 							interests!
// 						</p>
// 						<Link
// 							to={`/users/${sessionUser.id}/profile/update`}
// 							className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
// 						>
// 							<User size={20} />
// 							Update Profile
// 						</Link>
// 					</div>
// 				) : (
// 					<>
// 						{/* Filter Controls */}
// 						<FilterControls
// 							filters={filters}
// 							setFilters={setFilters}
// 							viewMode={viewMode}
// 							setViewMode={setViewMode}
// 							showFilters={showFilters}
// 							setShowFilters={setShowFilters}
// 							clearFilters={clearFilters}
// 						/>

// 						{/* Results */}
// 						<div className="mb-6">
// 							<div className="flex items-center justify-between">
// 								<p className="text-slate-600">
// 									Found{" "}
// 									<span className="font-semibold text-slate-900">
// 										{filteredAndSortedPosts.length}
// 									</span>{" "}
// 									post{filteredAndSortedPosts.length !== 1 ? "s" : ""} from{" "}
// 									<span className="font-semibold text-slate-900">
// 										{similarUsers.length}
// 									</span>{" "}
// 									similar user{similarUsers.length !== 1 ? "s" : ""}
// 								</p>
// 								{filters.searchTerm && (
// 									<p className="text-slate-600 text-sm">
// 										Showing results for "{filters.searchTerm}"
// 									</p>
// 								)}
// 							</div>
// 						</div>

// 						{/* Posts Display */}
// 						{filteredAndSortedPosts.length === 0 && filters.searchTerm ? (
// 							<div className="text-center py-16">
// 								<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
// 									<Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
// 									<h3 className="text-xl font-semibold text-gray-800 mb-2">
// 										No Results Found
// 									</h3>
// 									<p className="text-gray-600">
// 										Try adjusting your search terms or filters.
// 									</p>
// 								</div>
// 							</div>
// 						) : (
// 							<div className="flex flex-col justify-center items-center">
// 								{filteredAndSortedPosts.map((post) => (
// 									<PostCard
// 										key={post.id}
// 										post={post}
// 										sessionUser={sessionUser}
// 										formatTimeAgo={formatTimeAgo}
// 									/>
// 								))}
// 							</div>
// 						)}
// 					</>
// 				)}
// 			</div>
// 		</div>
// 	);
// };

// export default Posts;
