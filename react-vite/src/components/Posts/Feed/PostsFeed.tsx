import React, { useState, useMemo, useCallback } from "react";
import {
	useLoaderData,
	Link,
	useSearchParams,
	useFetcher,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
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
	AlertCircle,
} from "lucide-react";
import LikeButton from "../../Likes/PostsLikesButton";
import LikesModal from "../../Likes/PostsLikesModal";
import CommentModal from "../../Comments/CommentModal";
import { useComments } from "../../../hooks/useComments";
import { useLikes, useLikesModal } from "../../../hooks/useLikes";
import { PostsFeedLoaderData } from "../../../loaders/postsFeedLoaders";
import { SessionUser } from "../../../types/postsFeed";
import type { Comment } from "../../../types/comments";

interface RootState {
	session: {
		user: SessionUser | null;
	};
}

// Create a type that represents a post with optional comments array
interface OldComment {
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

interface PostWithComments {
	id: number;
	title: string;
	caption: string;
	image: string;
	likes: number;
	creator: number;
	comments: number; // Count of comments
	createdAt: string;
	updatedAt: string;
	user: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	};
	// Optional array of comment objects in old format
	postComments?: OldComment[];
}

const PostsFeed: React.FC = () => {
	const loaderData = useLoaderData() as PostsFeedLoaderData;
	const sessionUser = useSelector((state: RootState) => state.session.user);
	const [searchParams, setSearchParams] = useSearchParams();
	const fetcher = useFetcher();

	// Comment management
	const {
		modal: commentModal,
		openModal: openCommentModal,
		closeModal: closeCommentModal,
	} = useComments();

	// Likes management
	const { likeStates, setLikeState, fetchLikeStatus } = useLikes();
	const {
		isOpen: isLikesModalOpen,
		postId: likesModalPostId,
		openModal: openLikesModal,
		closeModal: closeLikesModal,
	} = useLikesModal();

	// State for UI controls
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);

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
				activePosts: loaderData.similarPosts || [],
				activePagination: loaderData.similarPostsPagination,
			};
		}
		return {
			activePosts: loaderData.allPosts || [],
			activePagination: loaderData.allPostsPagination,
		};
	}, [activeTab, loaderData]);

	// Initialize like states from loader data
	React.useEffect(() => {
		activePosts.forEach((post) => {
			if (!likeStates.has(post.id)) {
				// We'll need to fetch like status for each post
				// For now, assume not liked and use the count from the post
				setLikeState(post.id, false, post.likes);
				// Fetch actual like status asynchronously
				fetchLikeStatus(post.id);
			}
		});
	}, [activePosts, likeStates, setLikeState, fetchLikeStatus]);

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
		setIsRefreshing(true);
		fetcher.submit({ intent: "refresh-feed" }, { method: "post" });

		// Reset loading state after a delay
		setTimeout(() => {
			setIsRefreshing(false);
		}, 1000);
	}, [fetcher]);

	// Handle likes modal open
	const handleLikesClick = useCallback(
		(postId: number) => {
			openLikesModal(postId);
		},
		[openLikesModal],
	);

	const handleCommentClick = useCallback(
		async (postId: number, post: PostWithComments) => {
			console.log("Opening comment modal for post:", postId, post);

			let initialComments: Comment[] = [];

			if (post.postComments && post.postComments.length > 0) {
				console.log("Processing post comments:", post.postComments);

				initialComments = post.postComments.map((oldComment: OldComment) => {
					console.log("Processing comment:", oldComment);

					// Use commenter data from API if available
					let commenterData = {
						id: oldComment.userId,
						username: oldComment.username || "Unknown User",
						firstName: "",
						lastName: "",
						profileImage: "/default-avatar.png",
					};

					// Check if API provided commenter data
					if (oldComment.commenter) {
						console.log("Using API commenter data:", oldComment.commenter);
						commenterData = {
							id: oldComment.commenter.id,
							username: oldComment.commenter.username,
							firstName: oldComment.commenter.firstName || "",
							lastName: oldComment.commenter.lastName || "",
							profileImage:
								oldComment.commenter.profileImage || "/default-avatar.png",
						};
					}
					// Fallback to user matching only if API data is missing
					else {
						console.log("No API commenter data, using fallback");

						// If this is the current user's comment, use their session data
						if (sessionUser && oldComment.userId === sessionUser.id) {
							commenterData = {
								id: sessionUser.id,
								username: sessionUser.username,
								firstName: sessionUser.firstName || "",
								lastName: sessionUser.lastName || "",
								profileImage: sessionUser.profileImage || "/default-avatar.png",
							};
						}
						// If it's the post creator, use their data
						else if (oldComment.userId === post.user.id) {
							commenterData = {
								id: post.user.id,
								username: post.user.username,
								firstName: post.user.firstName,
								lastName: post.user.lastName,
								profileImage: post.user.profileImage,
							};
						}
						// For other users, use whatever data we have
						else {
							commenterData = {
								id: oldComment.userId,
								username: oldComment.username || "Unknown User",
								firstName: "",
								lastName: "",
								profileImage: "/default-avatar.png",
							};
						}
					}

					const newComment: Comment = {
						id: oldComment.id,
						userId: oldComment.userId,
						postId: oldComment.postId,
						comment: oldComment.comment,
						parentId: oldComment.parentId,
						createdAt: oldComment.created_at,
						updatedAt: oldComment.updated_at,
						commenter: commenterData,
						replies: [],
					};

					console.log("Transformed comment:", newComment);
					return newComment;
				});

				console.log("All transformed comments for modal:", initialComments);
			} else {
				// If no postComments, try to fetch them from the API
				try {
					const response = await fetch(
						`/api/comments/posts/${postId}/comments?include_replies=true`,
						{
							credentials: "include",
						},
					);

					if (response.ok) {
						const data = await response.json();
						console.log("Fetched comments from API:", data);

						// The API should now return properly formatted comments with commenter data
						interface ApiComment {
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
							commenter?: {
								id: number;
								username: string;
								firstName?: string;
								first_name?: string;
								lastName?: string;
								last_name?: string;
								profileImage?: string;
								profile_image_url?: string;
							};
							username?: string;
							firstName?: string;
							first_name?: string;
							lastName?: string;
							last_name?: string;
							profileImage?: string;
							profile_image_url?: string;
						}

						initialComments = (data.comments || []).map(
							(apiComment: ApiComment) => ({
								id: apiComment.id,
								userId: apiComment.userId || apiComment.user_id || 0,
								postId: apiComment.postId || apiComment.post_id || postId,
								comment: apiComment.comment,
								parentId: apiComment.parentId || apiComment.parent_id || null,
								createdAt: apiComment.createdAt || apiComment.created_at || "",
								updatedAt: apiComment.updatedAt || apiComment.updated_at || "",
								// Use commenter data from API response
								commenter: apiComment.commenter || {
									id: apiComment.userId || apiComment.user_id || 0,
									username: apiComment.username || "unknown",
									firstName:
										apiComment.firstName || apiComment.first_name || "",
									lastName: apiComment.lastName || apiComment.last_name || "",
									profileImage:
										apiComment.profileImage ||
										apiComment.profile_image_url ||
										"/default-avatar.png",
								},
								replies: [],
							}),
						);
					}
				} catch (error) {
					console.error("Failed to fetch comments for modal:", error);
				}
			}

			console.log("Final comments for modal:", initialComments);
			openCommentModal(postId, initialComments);
		},
		[openCommentModal, sessionUser],
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
					<AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
					<h3 className="text-xl font-semibold text-red-800 mb-2">
						Error Loading Posts
					</h3>
					<p className="text-red-600 mb-4">{loaderData.error}</p>
					<button
						onClick={handleRefresh}
						className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
						disabled={isRefreshing}
					>
						<RefreshCw
							size={18}
							className={isRefreshing ? "animate-spin" : ""}
						/>
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
									isRefreshing ? "animate-spin" : ""
								}`}
								disabled={isRefreshing}
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
						All Posts ({loaderData.stats?.totalPosts || 0})
					</button>
					<button
						onClick={() => handleTabChange("similar")}
						className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
							activeTab === "similar"
								? "bg-orange-100 text-orange-700"
								: "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
						}`}
					>
						Similar Users ({loaderData.stats?.similarPosts || 0})
					</button>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
						<div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
							<User size={24} className="text-orange-600" />
						</div>
						<h3 className="text-2xl font-bold text-slate-900">
							{activeTab === "all"
								? loaderData.stats?.totalPosts || 0
								: loaderData.stats?.similarUsers || 0}
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
							{activeTab === "all"
								? "All"
								: loaderData.stats?.similarPosts || 0}
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
							{loaderData.stats?.userTags || 0}
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
							{activeTab === "similar" && " from similar users"}
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
							<div className="space-y-4">
								<Link
									to="/posts/create"
									className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-slate-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-slate-700 transition-all duration-200"
								>
									<Plus size={20} />
									Create First Post
								</Link>
								{activeTab === "similar" &&
									(!sessionUser.usersTags ||
										sessionUser.usersTags.length === 0) && (
										<div className="mt-4">
											<Link
												to={`/users/${sessionUser.id}/profile/update`}
												className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
											>
												<User size={20} />
												Add Tags to Your Profile
											</Link>
										</div>
									)}
							</div>
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
								<PostCardWithComments
									key={post.id}
									post={post}
									viewMode={viewMode}
									formatTimeAgo={formatTimeAgo}
									handleCommentClick={handleCommentClick}
									handleLikesClick={handleLikesClick}
									likeState={likeStates.get(post.id)}
									setLikeState={setLikeState}
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

			{/* Comment Modal */}
			<CommentModal
				isOpen={commentModal.isOpen}
				onClose={closeCommentModal}
				postId={commentModal.postId || 0}
				initialComments={commentModal.comments}
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

// Define proper interface for PostCard props
interface PostCardWithCommentsProps {
	post: PostWithComments;
	viewMode: "grid" | "list";
	formatTimeAgo: (dateString: string) => string;
	handleCommentClick: (postId: number, post: PostWithComments) => void;
	handleLikesClick: (postId: number) => void;
	likeState?: { isLiked: boolean; likeCount: number; isLoading: boolean };
	setLikeState: (postId: number, isLiked: boolean, count: number) => void;
	sessionUser: SessionUser | null;
}

const PostCardWithComments: React.FC<PostCardWithCommentsProps> = ({
	post,
	viewMode,
	formatTimeAgo,
	handleCommentClick,
	handleLikesClick,
	likeState,
	setLikeState,
}) => {
	// Cast post to PostWithComments type for this component
	const postWithComments = post as PostWithComments;

	// Comment button with better logging
	const handleCommentButtonClick = () => {
		console.log(
			"Comment button clicked for post:",
			post.id,
			"Post data:",
			postWithComments,
		);
		handleCommentClick(post.id, postWithComments);
	};

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
							loading="lazy"
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
									loading="lazy"
									onError={(e) => {
										const target = e.target as HTMLImageElement;
										target.src = "/default-avatar.png";
									}}
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
								<LikeButton
									postId={post.id}
									initialLikeCount={likeState?.likeCount || post.likes}
									initialIsLiked={likeState?.isLiked || false}
									onLikeToggle={(postId, isLiked, newCount) => {
										setLikeState(postId, isLiked, newCount);
									}}
									onLikesClick={handleLikesClick}
									size={18}
									disabled={likeState?.isLoading}
								/>
								<button
									onClick={handleCommentButtonClick}
									className="flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors"
								>
									<MessageCircle size={18} />
									<span className="text-sm font-medium">{post.comments}</span>
								</button>
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
							loading="lazy"
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
									loading="lazy"
									onError={(e) => {
										const target = e.target as HTMLImageElement;
										target.src = "/default-avatar.png";
									}}
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
								<LikeButton
									postId={post.id}
									initialLikeCount={likeState?.likeCount || post.likes}
									initialIsLiked={likeState?.isLiked || false}
									onLikeToggle={(postId, isLiked, newCount) => {
										setLikeState(postId, isLiked, newCount);
									}}
									onLikesClick={handleLikesClick}
									size={16}
									disabled={likeState?.isLoading}
								/>
								<button
									onClick={handleCommentButtonClick}
									className="flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors"
								>
									<MessageCircle size={16} />
									<span className="text-sm font-medium">{post.comments}</span>
								</button>
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
