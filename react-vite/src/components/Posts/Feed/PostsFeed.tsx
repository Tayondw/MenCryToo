import React, { useState, useMemo, useCallback } from "react";
import {
	useLoaderData,
	Link,
	useNavigate,
	useSearchParams,
	useFetcher,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
	Heart,
	MessageCircle,
	Share2,
	Search,
	Grid,
	List,
	Plus,
	User,
	Clock,
	Tag,
	Bookmark,
	ChevronLeft,
	ChevronRight,
	RefreshCw,
	TrendingUp,
	Users,
} from "lucide-react";
import HeartFilled from "./HeartFilled";
import {
	PostsFeedLoaderData,
} from "../../../loaders/postsFeedLoaders";
import { PostCardProps, SessionUser } from "../../../types/postsFeed";


// Type definitions
// interface SessionUser {
// 	id: number;
// 	username: string;
// 	email: string;
// 	firstName: string;
// 	lastName: string;
// 	profileImage: string;
// 	usersTags?: Array<{ id: number; name: string }>;
// }

interface RootState {
	session: {
		user: SessionUser | null;
	};
}

const PostsFeed: React.FC = () => {
	const loaderData = useLoaderData() as PostsFeedLoaderData;
	const sessionUser = useSelector((state: RootState) => state.session.user);
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const fetcher = useFetcher();

	// State for UI controls
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

	// Get current tab from URL or default to "all"
	const activeTab =
		(searchParams.get("tab") as "all" | "similar") ||
		loaderData.activeTab ||
		"all";
	const currentPage = parseInt(searchParams.get("page") || "1");

	// Get the active posts and pagination based on the selected tab
	const { activePosts, activePagination } = useMemo(() => {
		if (activeTab === "similar") {
			return {
				activePosts: loaderData.similarPosts,
				activePagination: loaderData.similarPostsPagination,
			};
		}
		return {
			activePosts: loaderData.allPosts,
			activePagination: loaderData.allPostsPagination,
		};
	}, [activeTab, loaderData]);

	// Filter posts based on search term and selected tags
	const filteredPosts = useMemo(() => {
		if (!searchTerm && selectedTags.length === 0) {
			return activePosts;
		}

		return activePosts.filter((post) => {
			// Filter by search term
			const matchesSearch = searchTerm
				? post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				  post.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
				  post.user.username.toLowerCase().includes(searchTerm.toLowerCase())
				: true;

			// For now, we'll skip tag filtering since we don't have post tags
			// This could be enhanced by adding tags to posts or user tag matching
			return matchesSearch;
		});
	}, [activePosts, searchTerm, selectedTags]);

	// Format time ago
	const formatTimeAgo = useCallback((dateString: string) => {
		const now = new Date();
		const date = new Date(dateString);
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (seconds < 60) return "just now";

		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;

		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;

		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;

		const weeks = Math.floor(days / 7);
		if (weeks < 4) return `${weeks}w ago`;

		const months = Math.floor(days / 30);
		if (months < 12) return `${months}mo ago`;

		const years = Math.floor(days / 365);
		return `${years}y ago`;
	}, []);

	// Handle tab change
	const handleTabChange = useCallback(
		(tab: "all" | "similar") => {
			const newParams = new URLSearchParams(searchParams);
			newParams.set("tab", tab);
			newParams.delete("page"); // Reset to page 1 when changing tabs
			setSearchParams(newParams);
		},
		[searchParams, setSearchParams],
	);

	// Handle page change
	const handlePageChange = useCallback(
		(page: number) => {
			const newParams = new URLSearchParams(searchParams);
			newParams.set("page", page.toString());
			setSearchParams(newParams);
			window.scrollTo({ top: 0, behavior: "smooth" });
		},
		[searchParams, setSearchParams],
	);

	// Handle refresh
	const handleRefresh = useCallback(() => {
		fetcher.submit({ intent: "refresh-feed" }, { method: "post" });
	}, [fetcher]);

	// Handle like/unlike
	const handleLikePost = useCallback(
		async (postId: number, isLiked: boolean) => {
			if (!sessionUser) {
				navigate("/login");
				return;
			}

			// Optimistic update
			setLikedPosts((prev) => {
				const newSet = new Set(prev);
				if (isLiked) {
					newSet.delete(postId);
				} else {
					newSet.add(postId);
				}
				return newSet;
			});

			// Submit to server
			fetcher.submit(
				{
					intent: isLiked ? "unlike-post" : "like-post",
					postId: postId.toString(),
				},
				{ method: "post" },
			);
		},
		[sessionUser, navigate, fetcher],
	);

	// Clear filters
	const clearFilters = useCallback(() => {
		setSearchTerm("");
		setSelectedTags([]);
	}, []);

	// Handle error state
	if (loaderData.error) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 flex items-center justify-center">
				<div className="bg-white rounded-2xl p-8 shadow-sm border border-red-200 max-w-md mx-auto text-center">
					<h3 className="text-xl font-semibold text-red-800 mb-2">
						Error Loading Posts
					</h3>
					<p className="text-red-600 mb-4">{loaderData.error}</p>
					<button
						onClick={handleRefresh}
						className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
					>
						<RefreshCw size={18} />
						Try Again
					</button>
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
						<div className="flex items-center gap-4">
							<h1 className="text-xl font-bold text-slate-800">Posts Feed</h1>
						</div>

						<div className="flex items-center gap-3">
							{sessionUser && (
								<Link
									to="/posts/create"
									className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-slate-600 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg"
								>
									<Plus size={18} />
									Create Post
								</Link>
							)}

							<button
								onClick={handleRefresh}
								className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
									fetcher.state === "submitting" ? "animate-spin" : ""
								}`}
								disabled={fetcher.state === "submitting"}
							>
								<RefreshCw size={20} />
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Page Title */}
				<div className="text-center mb-8">
					<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-slate-800 bg-clip-text text-transparent mb-4">
						Community Posts
					</h1>
					<p className="text-lg text-slate-600 max-w-2xl mx-auto">
						Discover posts from the community and connect with users who share
						your interests.
					</p>
				</div>

				{/* Feed Tabs */}
				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-8 flex">
					<button
						onClick={() => handleTabChange("all")}
						className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
							activeTab === "all"
								? "bg-orange-100 text-orange-700"
								: "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
						}`}
					>
						All Posts ({loaderData.stats.totalPosts})
					</button>
					<button
						onClick={() => handleTabChange("similar")}
						className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
							activeTab === "similar"
								? "bg-orange-100 text-orange-700"
								: "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
						}`}
					>
						Similar Users ({loaderData.stats.similarPosts})
					</button>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
						<div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
							<User size={24} className="text-orange-600" />
						</div>
						<h3 className="text-2xl font-bold text-slate-900">
							{activeTab === "all"
								? loaderData.stats.totalPosts
								: loaderData.stats.similarUsers}
						</h3>
						<p className="text-slate-600">
							{activeTab === "all" ? "Total Posts" : "Similar Users"}
						</p>
					</div>
					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
						<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
							<Users size={24} className="text-blue-600" />
						</div>
						<h3 className="text-2xl font-bold text-slate-900">
							{activeTab === "all" ? "All" : loaderData.stats.similarPosts}
						</h3>
						<p className="text-slate-600">
							{activeTab === "all" ? "Community" : "Similar Posts"}
						</p>
					</div>
					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
						<div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
							<Tag size={24} className="text-purple-600" />
						</div>
						<h3 className="text-2xl font-bold text-slate-900">
							{loaderData.stats.userTags}
						</h3>
						<p className="text-slate-600">Your Tags</p>
					</div>
				</div>

				{/* Filters and Controls */}
				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
					<div className="flex flex-col lg:flex-row lg:items-center gap-4">
						{/* Search */}
						<div className="flex-1">
							<div className="relative">
								<Search
									size={20}
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
								/>
								<input
									type="text"
									placeholder="Search posts by title, content, or username..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
								/>
							</div>
						</div>

						{/* View Mode Toggle */}
						<div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
							<button
								onClick={() => setViewMode("grid")}
								className={`p-2 rounded-md transition-colors ${
									viewMode === "grid"
										? "bg-white shadow-sm text-orange-600"
										: "text-slate-600 hover:text-slate-900"
								}`}
							>
								<Grid size={18} />
							</button>
							<button
								onClick={() => setViewMode("list")}
								className={`p-2 rounded-md transition-colors ${
									viewMode === "list"
										? "bg-white shadow-sm text-orange-600"
										: "text-slate-600 hover:text-slate-900"
								}`}
							>
								<List size={18} />
							</button>
						</div>

						{/* Clear Filters */}
						{(searchTerm || selectedTags.length > 0) && (
							<button
								onClick={clearFilters}
								className="px-4 py-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
							>
								Clear Filters
							</button>
						)}
					</div>

					{/* Results Count */}
					<div className="mt-4 pt-4 border-t border-slate-200">
						<p className="text-sm text-slate-600">
							Showing{" "}
							<span className="font-semibold">{filteredPosts.length}</span>{" "}
							posts
							{searchTerm && ` matching "${searchTerm}"`}
						</p>
					</div>
				</div>

				{/* Posts Display */}
				{filteredPosts.length === 0 ? (
					<div className="text-center py-16">
						<div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
							<MessageCircle size={32} className="text-slate-400" />
						</div>
						<h3 className="text-xl font-semibold text-slate-900 mb-2">
							No posts found
						</h3>
						<p className="text-slate-600 mb-6 max-w-md mx-auto">
							{searchTerm
								? "Try adjusting your search terms to find more posts."
								: activeTab === "similar" && loaderData.message
								? loaderData.message
								: "No posts are currently available. Check back later!"}
						</p>
						{sessionUser && (
							<Link
								to="/posts/create"
								className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-slate-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-slate-700 transition-all duration-200"
							>
								<Plus size={20} />
								Create First Post
							</Link>
						)}
					</div>
				) : (
					<>
						<div
							className={
								viewMode === "grid"
									? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
									: "space-y-6"
							}
						>
							{filteredPosts.map((post) => (
								<PostCard
									key={post.id}
									post={post}
									viewMode={viewMode}
									formatTimeAgo={formatTimeAgo}
									handleLikePost={handleLikePost}
									isLiked={likedPosts.has(post.id)}
									sessionUser={sessionUser}
								/>
							))}
						</div>

						{/* Pagination */}
						{activePagination.pages > 1 && (
							<div className="flex justify-center mt-8">
								<div className="flex items-center gap-2">
									<button
										onClick={() => handlePageChange(1)}
										disabled={currentPage === 1}
										className="px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										First
									</button>

									<button
										onClick={() => handlePageChange(currentPage - 1)}
										disabled={currentPage === 1}
										className="p-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<ChevronLeft size={18} />
									</button>

									{/* Page Numbers */}
									<div className="flex items-center gap-1">
										{Array.from(
											{ length: Math.min(5, activePagination.pages) },
											(_, i) => {
												let pageNum;
												if (activePagination.pages <= 5) {
													pageNum = i + 1;
												} else if (currentPage <= 3) {
													pageNum = i + 1;
												} else if (currentPage >= activePagination.pages - 2) {
													pageNum = activePagination.pages - 4 + i;
												} else {
													pageNum = currentPage - 2 + i;
												}

												return (
													<button
														key={pageNum}
														onClick={() => handlePageChange(pageNum)}
														className={`w-8 h-8 flex items-center justify-center rounded-md ${
															currentPage === pageNum
																? "bg-orange-500 text-white"
																: "border border-slate-300 text-slate-700 hover:bg-slate-50"
														}`}
													>
														{pageNum}
													</button>
												);
											},
										)}
									</div>

									<button
										onClick={() => handlePageChange(currentPage + 1)}
										disabled={currentPage === activePagination.pages}
										className="p-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<ChevronRight size={18} />
									</button>

									<button
										onClick={() => handlePageChange(activePagination.pages)}
										disabled={currentPage === activePagination.pages}
										className="px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Last
									</button>
								</div>
							</div>
						)}
					</>
				)}

				{/* Message for similar feed */}
				{activeTab === "similar" &&
					loaderData.message &&
					filteredPosts.length === 0 && (
						<div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-8 text-center">
							<div className="flex items-center justify-center gap-2 text-orange-600 mb-2">
								<TrendingUp size={20} />
								<h3 className="font-semibold">Personalized Feed</h3>
							</div>
							<p className="text-orange-700">{loaderData.message}</p>
							<Link
								to={`/users/${sessionUser?.id}/profile/update`}
								className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors mt-4"
							>
								<User size={18} />
								Add Tags to Profile
							</Link>
						</div>
					)}
			</div>
		</div>
	);
};

// PostCard Component - Remove interface since it's imported from types
const PostCard: React.FC<PostCardProps> = ({
	post,
	viewMode,
	formatTimeAgo,
	handleLikePost,
	isLiked,
}) => {
	return (
		<div
			className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${
				viewMode === "list" ? "p-6" : ""
			}`}
		>
			{viewMode === "grid" ? (
				// Grid View
				<div>
					{/* Post Image */}
					<div className="relative">
						<img
							src={post.image}
							alt={post.title}
							className="w-full h-64 object-cover"
						/>
					</div>

					{/* Post Content */}
					<div className="p-6">
						{/* User Info */}
						<div className="flex items-center gap-3 mb-4">
							<Link to={`/users/${post.user.id}`} className="flex-shrink-0">
								<img
									src={post.user.profileImage}
									alt={post.user.username}
									className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
								/>
							</Link>
							<div className="min-w-0">
								<Link
									to={`/users/${post.user.id}`}
									className="font-semibold text-slate-900 hover:text-orange-600 transition-colors block truncate"
								>
									{post.user.username}
								</Link>
								<div className="flex items-center text-xs text-slate-500">
									<Clock size={12} className="mr-1" />
									<span>{formatTimeAgo(post.createdAt)}</span>
								</div>
							</div>
						</div>

						{/* Post Title & Caption */}
						<Link to={`/posts/${post.id}`} className="block group">
							<h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-600 transition-colors mb-2 line-clamp-2">
								{post.title}
							</h3>
							<p className="text-slate-600 text-sm line-clamp-3 mb-4">
								{post.caption}
							</p>
						</Link>

						{/* Post Actions */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<button
									onClick={() => handleLikePost(post.id, isLiked)}
									className={`flex items-center gap-1 transition-colors ${
										isLiked
											? "text-red-500"
											: "text-slate-500 hover:text-red-500"
									}`}
								>
									{isLiked ? <HeartFilled size={18} /> : <Heart size={18} />}
									<span className="text-sm font-medium">
										{post.likes + (isLiked ? 1 : 0)}
									</span>
								</button>
								<Link
									to={`/posts/${post.id}`}
									className="flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors"
								>
									<MessageCircle size={18} />
									<span className="text-sm font-medium">{post.comments}</span>
								</Link>
							</div>
							<div className="flex items-center gap-2">
								<button className="text-slate-400 hover:text-orange-500 transition-colors">
									<Bookmark size={18} />
								</button>
								<button className="text-slate-400 hover:text-green-500 transition-colors">
									<Share2 size={18} />
								</button>
							</div>
						</div>
					</div>
				</div>
			) : (
				// List View
				<div className="flex gap-6">
					{/* Post Image */}
					<Link
						to={`/posts/${post.id}`}
						className="flex-shrink-0 w-32 h-32 sm:w-48 sm:h-48 overflow-hidden rounded-lg"
					>
						<img
							src={post.image}
							alt={post.title}
							className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
						/>
					</Link>

					{/* Post Content */}
					<div className="flex-1 min-w-0 flex flex-col">
						{/* User Info */}
						<div className="flex items-center gap-3 mb-3">
							<Link to={`/users/${post.user.id}`} className="flex-shrink-0">
								<img
									src={post.user.profileImage}
									alt={post.user.username}
									className="w-8 h-8 rounded-full object-cover border-2 border-slate-200"
								/>
							</Link>
							<div className="min-w-0">
								<Link
									to={`/users/${post.user.id}`}
									className="font-semibold text-slate-900 hover:text-orange-600 transition-colors block truncate"
								>
									{post.user.username}
								</Link>
								<div className="flex items-center text-xs text-slate-500">
									<Clock size={12} className="mr-1" />
									<span>{formatTimeAgo(post.createdAt)}</span>
								</div>
							</div>
						</div>

						{/* Post Title & Caption */}
						<Link to={`/posts/${post.id}`} className="block group flex-1">
							<h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-600 transition-colors mb-2">
								{post.title}
							</h3>
							<p className="text-slate-600 text-sm line-clamp-2 mb-4">
								{post.caption}
							</p>
						</Link>

						{/* Post Actions */}
						<div className="flex items-center justify-between mt-auto">
							<div className="flex items-center gap-4">
								<button
									onClick={() => handleLikePost(post.id, isLiked)}
									className={`flex items-center gap-1 transition-colors ${
										isLiked
											? "text-red-500"
											: "text-slate-500 hover:text-red-500"
									}`}
								>
									{isLiked ? <HeartFilled size={16} /> : <Heart size={16} />}
									<span className="text-sm font-medium">
										{post.likes + (isLiked ? 1 : 0)}
									</span>
								</button>
								<Link
									to={`/posts/${post.id}`}
									className="flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors"
								>
									<MessageCircle size={16} />
									<span className="text-sm font-medium">{post.comments}</span>
								</Link>
							</div>
							<div className="flex items-center gap-2">
								<button className="text-slate-400 hover:text-orange-500 transition-colors">
									<Bookmark size={16} />
								</button>
								<button className="text-slate-400 hover:text-green-500 transition-colors">
									<Share2 size={16} />
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PostsFeed;

// import React, { useState, useEffect, useMemo } from "react";
// import { useLoaderData, Link, useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import {
// 	Heart,
// 	MessageCircle,
// 	Share2,
// 	Search,
// 	Filter,
// 	Grid,
// 	List,
// 	Plus,
// 	User,
// 	Clock,
// 	Tag,
// 	Bookmark,
// 	ChevronLeft,
// 	ChevronRight,
// 	RefreshCw,
// 	TrendingUp,
// 	Users,
// } from "lucide-react";
// import { RootState } from "../../../types";
// import { FeedPost, LoaderResponse } from "../../../loaders/postLoaders";

// const PostsFeed: React.FC = () => {
// 	const loaderData = useLoaderData() as LoaderResponse;
// 	const sessionUser = useSelector((state: RootState) => state.session.user);
// 	const navigate = useNavigate();

// 	// State for UI controls
// 	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
// 	const [searchTerm, setSearchTerm] = useState("");
// 	const [showFilters, setShowFilters] = useState(false);
// 	const [selectedTags, setSelectedTags] = useState<string[]>([]);
// 	const [isRefreshing, setIsRefreshing] = useState(false);
// 	const [currentPage, setCurrentPage] = useState(1);
// 	const [activeTab, setActiveTab] = useState<"all" | "similar">("all");
// 	const [allPosts, setAllPosts] = useState<FeedPost[]>([]);

// 	// Get all unique tags from users
// 	const allTags = useMemo(() => {
// 		const tagSet = new Set<string>();
// 		loaderData.users_profile.forEach((user) => {
// 			user.usersTags?.forEach((tag) => tagSet.add(tag.name));
// 		});
// 		return Array.from(tagSet).sort();
// 	}, [loaderData.users_profile]);

// 	// Fetch all posts on component mount
// 	useEffect(() => {
// 		const fetchAllPosts = async () => {
// 			try {
// 				const response = await fetch("/api/posts/feed");
// 				if (response.ok) {
// 					const data = await response.json();
// 					if (data.posts) {
// 						setAllPosts(data.posts);
// 					}
// 				}
// 			} catch (error) {
// 				console.error("Error fetching all posts:", error);
// 			}
// 		};

// 		fetchAllPosts();
// 	}, []);

// 	// Filter posts based on search term and selected tags
// 	const filteredSimilarUsers = useMemo(() => {
// 		if (!searchTerm && selectedTags.length === 0) {
// 			return loaderData.users_profile;
// 		}

// 		return loaderData.users_profile.filter((user) => {
// 			// Filter by search term
// 			const matchesSearch = searchTerm
// 				? user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 				  user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 				  user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 				  user.posts.some(
// 						(post) =>
// 							post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 							post.caption.toLowerCase().includes(searchTerm.toLowerCase()),
// 				  )
// 				: true;

// 			// Filter by selected tags
// 			const matchesTags =
// 				selectedTags.length > 0
// 					? user.usersTags?.some((tag) => selectedTags.includes(tag.name))
// 					: true;

// 			return matchesSearch && matchesTags;
// 		});
// 	}, [loaderData.users_profile, searchTerm, selectedTags]);

// 	// Get all posts from filtered similar users
// 	const similarPosts = useMemo(() => {
// 		const posts: FeedPost[] = [];
// 		filteredSimilarUsers.forEach((user) => {
// 			user.posts.forEach((post) => {
// 				posts.push({
// 					...post,
// 					user: {
// 						id: user.id,
// 						username: user.username,
// 						firstName: user.firstName,
// 						lastName: user.lastName,
// 						profileImage: user.profileImage,
// 					},
// 				});
// 			});
// 		});

// 		// Sort by most recent
// 		return posts.sort(
// 			(a, b) =>
// 				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
// 		);
// 	}, [filteredSimilarUsers]);

// 	// Filter all posts based on search term and selected tags
// 	const filteredAllPosts = useMemo(() => {
// 		if (!searchTerm && selectedTags.length === 0) {
// 			return allPosts;
// 		}

// 		return allPosts.filter((post) => {
// 			// Filter by search term
// 			const matchesSearch = searchTerm
// 				? post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 				  post.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
// 				  post.user.username.toLowerCase().includes(searchTerm.toLowerCase())
// 				: true;

// 			// For tags, we'd need to have tags on posts or fetch user tags
// 			// This is a simplified version
// 			return matchesSearch;
// 		});
// 	}, [allPosts, searchTerm, selectedTags]);

// 	// Get the active posts based on the selected tab
// 	const activePosts = useMemo(() => {
// 		return activeTab === "all" ? filteredAllPosts : similarPosts;
// 	}, [activeTab, filteredAllPosts, similarPosts]);

// 	// Pagination
// 	const postsPerPage = 12;
// 	const totalPages = Math.ceil(activePosts.length / postsPerPage);

// 	const paginatedPosts = useMemo(() => {
// 		const startIndex = (currentPage - 1) * postsPerPage;
// 		return activePosts.slice(startIndex, startIndex + postsPerPage);
// 	}, [activePosts, currentPage, postsPerPage]);

// 	// Handle page change
// 	const handlePageChange = (page: number) => {
// 		setCurrentPage(page);
// 		window.scrollTo({ top: 0, behavior: "smooth" });
// 	};

// 	// Handle refresh
// 	const handleRefresh = async () => {
// 		setIsRefreshing(true);
// 		try {
// 			// Force reload the current page
// 			window.location.reload();
// 		} catch (error) {
// 			console.error("Error refreshing feed:", error);
// 		} finally {
// 			setIsRefreshing(false);
// 		}
// 	};

// 	// Format time ago
// 	const formatTimeAgo = (dateString: string) => {
// 		const now = new Date();
// 		const date = new Date(dateString);
// 		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

// 		if (seconds < 60) return "just now";

// 		const minutes = Math.floor(seconds / 60);
// 		if (minutes < 60) return `${minutes}m ago`;

// 		const hours = Math.floor(minutes / 60);
// 		if (hours < 24) return `${hours}h ago`;

// 		const days = Math.floor(hours / 24);
// 		if (days < 7) return `${days}d ago`;

// 		const weeks = Math.floor(days / 7);
// 		if (weeks < 4) return `${weeks}w ago`;

// 		const months = Math.floor(days / 30);
// 		if (months < 12) return `${months}mo ago`;

// 		const years = Math.floor(days / 365);
// 		return `${years}y ago`;
// 	};

// 	// Toggle tag selection
// 	const toggleTag = (tag: string) => {
// 		setSelectedTags((prev) =>
// 			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
// 		);
// 	};

// 	// Clear all filters
// 	const clearFilters = () => {
// 		setSearchTerm("");
// 		setSelectedTags([]);
// 	};

// 	// Handle like/unlike post
// 	const handleLikePost = async (postId: number) => {
// 		if (!sessionUser) {
// 			navigate("/login");
// 			return;
// 		}

// 		try {
// 			// This would be replaced with actual API call
// 			console.log("Like post:", postId);
// 			// Refresh the feed after liking
// 			// handleRefresh();
// 		} catch (error) {
// 			console.error("Error liking post:", error);
// 		}
// 	};

// 	return (
// 		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100">
// 			{/* Header */}
// 			<div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
// 				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// 					<div className="flex items-center justify-between h-16">
// 						<div className="flex items-center gap-4">
// 							<h1 className="text-xl font-bold text-slate-800">Posts Feed</h1>
// 						</div>

// 						<div className="flex items-center gap-3">
// 							{sessionUser && (
// 								<Link
// 									to="/posts/create"
// 									className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-slate-600 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg"
// 								>
// 									<Plus size={18} />
// 									Create Post
// 								</Link>
// 							)}

// 							<button
// 								onClick={handleRefresh}
// 								className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
// 									isRefreshing ? "animate-spin" : ""
// 								}`}
// 								disabled={isRefreshing}
// 							>
// 								<RefreshCw size={20} />
// 							</button>
// 						</div>
// 					</div>
// 				</div>
// 			</div>

// 			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// 				{/* Page Title */}
// 				<div className="text-center mb-8">
// 					<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-slate-800 bg-clip-text text-transparent mb-4">
// 						Community Posts
// 					</h1>
// 					<p className="text-lg text-slate-600 max-w-2xl mx-auto">
// 						Discover posts from the community and connect with users who share
// 						your interests.
// 					</p>
// 				</div>

// 				{/* Feed Tabs */}
// 				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-8 flex">
// 					<button
// 						onClick={() => {
// 							setActiveTab("all");
// 							setCurrentPage(1);
// 						}}
// 						className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
// 							activeTab === "all"
// 								? "bg-orange-100 text-orange-700"
// 								: "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
// 						}`}
// 					>
// 						All Posts
// 					</button>
// 					<button
// 						onClick={() => {
// 							setActiveTab("similar");
// 							setCurrentPage(1);
// 						}}
// 						className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
// 							activeTab === "similar"
// 								? "bg-orange-100 text-orange-700"
// 								: "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
// 						}`}
// 					>
// 						Similar Users
// 					</button>
// 				</div>

// 				{/* Stats */}
// 				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
// 					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
// 						<div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
// 							<User size={24} className="text-orange-600" />
// 						</div>
// 						<h3 className="text-2xl font-bold text-slate-900">
// 							{activeTab === "all"
// 								? allPosts.length
// 								: loaderData.users_profile.length}
// 						</h3>
// 						<p className="text-slate-600">
// 							{activeTab === "all" ? "Total Posts" : "Similar Users"}
// 						</p>
// 					</div>
// 					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
// 						<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
// 							<Users size={24} className="text-blue-600" />
// 						</div>
// 						<h3 className="text-2xl font-bold text-slate-900">
// 							{activeTab === "all"
// 								? "All"
// 								: loaderData.users_profile.reduce(
// 										(acc, user) => acc + user.posts.length,
// 										0,
// 								  )}
// 						</h3>
// 						<p className="text-slate-600">
// 							{activeTab === "all" ? "Community" : "Similar Posts"}
// 						</p>
// 					</div>
// 					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
// 						<div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
// 							<Tag size={24} className="text-purple-600" />
// 						</div>
// 						<h3 className="text-2xl font-bold text-slate-900">
// 							{allTags.length}
// 						</h3>
// 						<p className="text-slate-600">Common Tags</p>
// 					</div>
// 				</div>

// 				{/* Filters and Controls */}
// 				<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
// 					<div className="flex flex-col lg:flex-row lg:items-center gap-4">
// 						{/* Search */}
// 						<div className="flex-1">
// 							<div className="relative">
// 								<Search
// 									size={20}
// 									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
// 								/>
// 								<input
// 									type="text"
// 									placeholder="Search posts by title, content, or username..."
// 									value={searchTerm}
// 									onChange={(e) => setSearchTerm(e.target.value)}
// 									className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
// 								/>
// 							</div>
// 						</div>

// 						{/* View Mode Toggle */}
// 						<div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
// 							<button
// 								onClick={() => setViewMode("grid")}
// 								className={`p-2 rounded-md transition-colors ${
// 									viewMode === "grid"
// 										? "bg-white shadow-sm text-orange-600"
// 										: "text-slate-600 hover:text-slate-900"
// 								}`}
// 							>
// 								<Grid size={18} />
// 							</button>
// 							<button
// 								onClick={() => setViewMode("list")}
// 								className={`p-2 rounded-md transition-colors ${
// 									viewMode === "list"
// 										? "bg-white shadow-sm text-orange-600"
// 										: "text-slate-600 hover:text-slate-900"
// 								}`}
// 							>
// 								<List size={18} />
// 							</button>
// 						</div>

// 						{/* Filter Toggle */}
// 						<button
// 							onClick={() => setShowFilters(!showFilters)}
// 							className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
// 								showFilters || selectedTags.length > 0
// 									? "bg-orange-100 text-orange-700 border border-orange-200"
// 									: "bg-slate-100 text-slate-700 hover:bg-slate-200"
// 							}`}
// 						>
// 							<Filter size={18} />
// 							Filters
// 							{selectedTags.length > 0 && (
// 								<span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
// 									{selectedTags.length}
// 								</span>
// 							)}
// 						</button>
// 					</div>

// 					{/* Tag Filters */}
// 					{showFilters && (
// 						<div className="mt-6 pt-6 border-t border-slate-200">
// 							<div className="flex items-center justify-between mb-3">
// 								<h3 className="font-medium text-slate-900">Filter by Tags</h3>
// 								{selectedTags.length > 0 && (
// 									<button
// 										onClick={clearFilters}
// 										className="text-sm text-orange-600 hover:text-orange-700 font-medium"
// 									>
// 										Clear all
// 									</button>
// 								)}
// 							</div>
// 							<div className="flex flex-wrap gap-2">
// 								{allTags.map((tag) => (
// 									<button
// 										key={tag}
// 										onClick={() => toggleTag(tag)}
// 										className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
// 											selectedTags.includes(tag)
// 												? "bg-orange-500 text-white"
// 												: "bg-slate-100 text-slate-700 hover:bg-slate-200"
// 										}`}
// 									>
// 										{tag}
// 									</button>
// 								))}
// 							</div>
// 						</div>
// 					)}
// 				</div>

// 				{/* Results */}
// 				<div className="mb-6">
// 					<div className="flex items-center justify-between">
// 						<p className="text-slate-600">
// 							Found{" "}
// 							<span className="font-semibold text-slate-900">
// 								{activePosts.length}
// 							</span>{" "}
// 							post{activePosts.length !== 1 ? "s" : ""}
// 						</p>

// 						{activePosts.length > 0 && (
// 							<div className="flex items-center gap-2">
// 								<span className="text-sm text-slate-500">
// 									Page {currentPage} of {totalPages}
// 								</span>
// 								<div className="flex items-center gap-1">
// 									<button
// 										onClick={() =>
// 											handlePageChange(Math.max(1, currentPage - 1))
// 										}
// 										disabled={currentPage === 1}
// 										className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
// 									>
// 										<ChevronLeft size={18} />
// 									</button>
// 									<button
// 										onClick={() =>
// 											handlePageChange(Math.min(totalPages, currentPage + 1))
// 										}
// 										disabled={currentPage === totalPages}
// 										className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
// 									>
// 										<ChevronRight size={18} />
// 									</button>
// 								</div>
// 							</div>
// 						)}
// 					</div>
// 				</div>

// 				{/* Posts Display */}
// 				{paginatedPosts.length === 0 ? (
// 					<div className="text-center py-16">
// 						<div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
// 							<MessageCircle size={32} className="text-slate-400" />
// 						</div>
// 						<h3 className="text-xl font-semibold text-slate-900 mb-2">
// 							No posts found
// 						</h3>
// 						<p className="text-slate-600 mb-6 max-w-md mx-auto">
// 							{searchTerm || selectedTags.length > 0
// 								? "Try adjusting your search or filters to find more posts."
// 								: activeTab === "similar"
// 								? "No posts from similar users found. Try adding more tags to your profile."
// 								: "No posts are currently available. Check back later!"}
// 						</p>
// 						{sessionUser && (
// 							<Link
// 								to="/posts/create"
// 								className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-slate-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-slate-700 transition-all duration-200"
// 							>
// 								<Plus size={20} />
// 								Create First Post
// 							</Link>
// 						)}
// 					</div>
// 				) : (
// 					<div
// 						className={
// 							viewMode === "grid"
// 								? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
// 								: "space-y-6"
// 						}
// 					>
// 						{paginatedPosts.map((post) => (
// 							<div
// 								key={post.id}
// 								className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 ${
// 									viewMode === "list" ? "p-6" : ""
// 								}`}
// 							>
// 								{viewMode === "grid" ? (
// 									// Grid View
// 									<div>
// 										{/* Post Image */}
// 										<div className="relative">
// 											<img
// 												src={post.image}
// 												alt={post.title}
// 												className="w-full h-64 object-cover"
// 											/>
// 											<div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
// 										</div>

// 										{/* Post Content */}
// 										<div className="p-6">
// 											{/* User Info */}
// 											<div className="flex items-center gap-3 mb-4">
// 												<Link
// 													to={`/users/${post.user.id}`}
// 													className="flex-shrink-0"
// 												>
// 													<img
// 														src={post.user.profileImage}
// 														alt={post.user.username}
// 														className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
// 													/>
// 												</Link>
// 												<div className="min-w-0">
// 													<Link
// 														to={`/users/${post.user.id}`}
// 														className="font-semibold text-slate-900 hover:text-orange-600 transition-colors block truncate"
// 													>
// 														{post.user.username}
// 													</Link>
// 													<div className="flex items-center text-xs text-slate-500">
// 														<Clock size={12} className="mr-1" />
// 														<span>{formatTimeAgo(post.createdAt)}</span>
// 													</div>
// 												</div>
// 											</div>

// 											{/* Post Title & Caption */}
// 											<Link to={`/posts/${post.id}`} className="block group">
// 												<h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-600 transition-colors mb-2 line-clamp-2">
// 													{post.title}
// 												</h3>
// 												<p className="text-slate-600 text-sm line-clamp-3 mb-4">
// 													{post.caption}
// 												</p>
// 											</Link>

// 											{/* Post Actions */}
// 											<div className="flex items-center justify-between">
// 												<div className="flex items-center gap-4">
// 													<button
// 														onClick={() => handleLikePost(post.id)}
// 														className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors"
// 													>
// 														<Heart size={18} />
// 														<span className="text-sm font-medium">
// 															{post.likes}
// 														</span>
// 													</button>
// 													<Link
// 														to={`/posts/${post.id}`}
// 														className="flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors"
// 													>
// 														<MessageCircle size={18} />
// 														<span className="text-sm font-medium">
// 															{post.comments || 0}
// 														</span>
// 													</Link>
// 												</div>
// 												<div className="flex items-center gap-2">
// 													<button className="text-slate-400 hover:text-orange-500 transition-colors">
// 														<Bookmark size={18} />
// 													</button>
// 													<button className="text-slate-400 hover:text-green-500 transition-colors">
// 														<Share2 size={18} />
// 													</button>
// 												</div>
// 											</div>
// 										</div>
// 									</div>
// 								) : (
// 									// List View
// 									<div className="flex gap-6">
// 										{/* Post Image */}
// 										<Link
// 											to={`/posts/${post.id}`}
// 											className="flex-shrink-0 w-32 h-32 sm:w-48 sm:h-48 overflow-hidden rounded-lg"
// 										>
// 											<img
// 												src={post.image}
// 												alt={post.title}
// 												className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
// 											/>
// 										</Link>

// 										{/* Post Content */}
// 										<div className="flex-1 min-w-0 flex flex-col">
// 											{/* User Info */}
// 											<div className="flex items-center gap-3 mb-3">
// 												<Link
// 													to={`/users/${post.user.id}`}
// 													className="flex-shrink-0"
// 												>
// 													<img
// 														src={post.user.profileImage}
// 														alt={post.user.username}
// 														className="w-8 h-8 rounded-full object-cover border-2 border-slate-200"
// 													/>
// 												</Link>
// 												<div className="min-w-0">
// 													<Link
// 														to={`/users/${post.user.id}`}
// 														className="font-semibold text-slate-900 hover:text-orange-600 transition-colors block truncate"
// 													>
// 														{post.user.username}
// 													</Link>
// 													<div className="flex items-center text-xs text-slate-500">
// 														<Clock size={12} className="mr-1" />
// 														<span>{formatTimeAgo(post.createdAt)}</span>
// 													</div>
// 												</div>
// 											</div>

// 											{/* Post Title & Caption */}
// 											<Link
// 												to={`/posts/${post.id}`}
// 												className="block group flex-1"
// 											>
// 												<h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-600 transition-colors mb-2">
// 													{post.title}
// 												</h3>
// 												<p className="text-slate-600 text-sm line-clamp-2 mb-4">
// 													{post.caption}
// 												</p>
// 											</Link>

// 											{/* Post Actions */}
// 											<div className="flex items-center justify-between mt-auto">
// 												<div className="flex items-center gap-4">
// 													<button
// 														onClick={() => handleLikePost(post.id)}
// 														className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors"
// 													>
// 														<Heart size={16} />
// 														<span className="text-sm font-medium">
// 															{post.likes}
// 														</span>
// 													</button>
// 													<Link
// 														to={`/posts/${post.id}`}
// 														className="flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors"
// 													>
// 														<MessageCircle size={16} />
// 														<span className="text-sm font-medium">
// 															{post.comments || 0}
// 														</span>
// 													</Link>
// 												</div>
// 												<div className="flex items-center gap-2">
// 													<button className="text-slate-400 hover:text-orange-500 transition-colors">
// 														<Bookmark size={16} />
// 													</button>
// 													<button className="text-slate-400 hover:text-green-500 transition-colors">
// 														<Share2 size={16} />
// 													</button>
// 												</div>
// 											</div>
// 										</div>
// 									</div>
// 								)}
// 							</div>
// 						))}
// 					</div>
// 				)}

// 				{/* Pagination */}
// 				{totalPages > 1 && (
// 					<div className="flex justify-center mt-8">
// 						<div className="flex items-center gap-2">
// 							<button
// 								onClick={() => handlePageChange(1)}
// 								disabled={currentPage === 1}
// 								className="px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
// 							>
// 								First
// 							</button>

// 							<button
// 								onClick={() => handlePageChange(currentPage - 1)}
// 								disabled={currentPage === 1}
// 								className="p-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
// 							>
// 								<ChevronLeft size={18} />
// 							</button>

// 							{/* Page Numbers */}
// 							<div className="flex items-center gap-1">
// 								{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
// 									// Show pages around current page
// 									let pageNum;
// 									if (totalPages <= 5) {
// 										pageNum = i + 1;
// 									} else if (currentPage <= 3) {
// 										pageNum = i + 1;
// 									} else if (currentPage >= totalPages - 2) {
// 										pageNum = totalPages - 4 + i;
// 									} else {
// 										pageNum = currentPage - 2 + i;
// 									}

// 									return (
// 										<button
// 											key={pageNum}
// 											onClick={() => handlePageChange(pageNum)}
// 											className={`w-8 h-8 flex items-center justify-center rounded-md ${
// 												currentPage === pageNum
// 													? "bg-orange-500 text-white"
// 													: "border border-slate-300 text-slate-700 hover:bg-slate-50"
// 											}`}
// 										>
// 											{pageNum}
// 										</button>
// 									);
// 								})}
// 							</div>

// 							<button
// 								onClick={() => handlePageChange(currentPage + 1)}
// 								disabled={currentPage === totalPages}
// 								className="p-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
// 							>
// 								<ChevronRight size={18} />
// 							</button>

// 							<button
// 								onClick={() => handlePageChange(totalPages)}
// 								disabled={currentPage === totalPages}
// 								className="px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
// 							>
// 								Last
// 							</button>
// 						</div>
// 					</div>
// 				)}

// 				{/* Similar Users Section */}
// 				{activeTab === "all" && (
// 					<div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
// 						<div className="flex items-center justify-between mb-6">
// 							<h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
// 								<Users size={20} className="text-orange-500" />
// 								Similar Users
// 							</h2>
// 							<Link
// 								to="/profile-feed"
// 								className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
// 							>
// 								View All
// 								<ChevronRight size={16} />
// 							</Link>
// 						</div>

// 						{loaderData.users_profile.length > 0 ? (
// 							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
// 								{loaderData.users_profile.slice(0, 4).map((user) => (
// 									<Link
// 										key={user.id}
// 										to={`/users/${user.id}`}
// 										className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors flex items-center gap-3"
// 									>
// 										<img
// 											src={user.profileImage}
// 											alt={user.username}
// 											className="w-12 h-12 rounded-full object-cover border-2 border-white"
// 										/>
// 										<div>
// 											<h3 className="font-semibold text-slate-900">
// 												{user.username}
// 											</h3>
// 											<div className="flex flex-wrap gap-1 mt-1">
// 												{user.usersTags?.slice(0, 2).map((tag) => (
// 													<span
// 														key={tag.id}
// 														className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full"
// 													>
// 														{tag.name}
// 													</span>
// 												))}
// 												{user.usersTags && user.usersTags.length > 2 && (
// 													<span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">
// 														+{user.usersTags.length - 2}
// 													</span>
// 												)}
// 											</div>
// 										</div>
// 									</Link>
// 								))}
// 							</div>
// 						) : (
// 							<div className="text-center py-8">
// 								<p className="text-slate-600">
// 									No similar users found. Try adding more tags to your profile.
// 								</p>
// 							</div>
// 						)}
// 					</div>
// 				)}

// 				{/* Empty State Message */}
// 				{loaderData.message &&
// 					activePosts.length === 0 &&
// 					activeTab === "similar" && (
// 						<div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-8 text-center">
// 							<div className="flex items-center justify-center gap-2 text-orange-600 mb-2">
// 								<TrendingUp size={20} />
// 								<h3 className="font-semibold">Personalized Feed</h3>
// 							</div>
// 							<p className="text-orange-700">{loaderData.message}</p>
// 						</div>
// 					)}
// 			</div>
// 		</div>
// 	);
// };

// export default PostsFeed;
