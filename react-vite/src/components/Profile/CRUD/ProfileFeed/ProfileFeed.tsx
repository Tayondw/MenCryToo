import React, { useState, useMemo, useCallback } from "react";
import { useLoaderData, Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	ArrowLeft,
	Settings,
	Users,
	Tag,
	Heart,
	MessageCircle,
	Filter,
	Search,
	Grid,
	List,
	UserPlus,
	Sparkles,
} from "lucide-react";
import {
	RootState,
	User,
	Tag as TagInterface,
	ProfileFeedData,
	ProfileFilterOptions,
} from "../../../../types";

const ProfileFeed: React.FC = () => {
	const loaderData = useLoaderData() as ProfileFeedData;
	const sessionUser = useSelector((state: RootState) => state.session.user);

	// ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL
	// State hooks
	const [filters, setFilters] = useState<ProfileFilterOptions>({
		searchTerm: "",
		selectedTags: [],
		sortBy: "similarity",
	});
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [showFilters, setShowFilters] = useState(false);

	// Memoized values - MUST be called unconditionally
	const sessionUserTags = useMemo(
		() => sessionUser?.usersTags?.map((tag: TagInterface) => tag.id) || [],
		[sessionUser],
	);

	const sessionUserTagNames = useMemo(
		() => sessionUser?.usersTags?.map((tag: TagInterface) => tag.name) || [],
		[sessionUser],
	);

	// Get all unique tags for filter options
	const allTags = useMemo(() => {
		const tagSet = new Set<string>();
		loaderData?.users_profile?.forEach((user) => {
			user.usersTags?.forEach((tag: TagInterface) => tagSet.add(tag.name));
		});
		return Array.from(tagSet).sort();
	}, [loaderData]);

	// Calculate similarity score for each user - moved to regular function
	const calculateSimilarity = useCallback(
		(user: User): number => {
			const userTagIds =
				user.usersTags?.map((tag: TagInterface) => tag.id) || [];
			const commonTags = userTagIds.filter((tagId: number) =>
				sessionUserTags.includes(tagId),
			);
			return commonTags.length;
		},
		[sessionUserTags],
	);

	// Filter and sort users
	const filteredAndSortedUsers = useMemo(() => {
		let users = loaderData?.users_profile || [];

		// Remove current user from results if sessionUser exists
		if (sessionUser) {
			users = users.filter((user) => user.id !== sessionUser.id);
		}

		// Filter by similarity (at least one common tag)
		users = users.filter((user) => calculateSimilarity(user) > 0);

		// Apply search filter
		if (filters.searchTerm) {
			const searchLower = filters.searchTerm.toLowerCase();
			users = users.filter(
				(user) =>
					user.firstName.toLowerCase().includes(searchLower) ||
					user.lastName.toLowerCase().includes(searchLower) ||
					user.username.toLowerCase().includes(searchLower) ||
					user.usersTags?.some((tag: TagInterface) =>
						tag.name.toLowerCase().includes(searchLower),
					),
			);
		}

		// Apply tag filter
		if (filters.selectedTags.length > 0) {
			users = users.filter((user) =>
				user.usersTags?.some((tag: TagInterface) =>
					filters.selectedTags.includes(tag.name),
				),
			);
		}

		// Sort users
		switch (filters.sortBy) {
			case "similarity":
				return users.sort(
					(a, b) => calculateSimilarity(b) - calculateSimilarity(a),
				);
			case "name":
				return users.sort((a, b) => a.firstName.localeCompare(b.firstName));
			case "recent":
				return users.sort((a, b) => {
					const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
					const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
					return bDate - aDate;
				});
			default:
				return users;
		}
	}, [loaderData, sessionUser, filters, calculateSimilarity]);

	// Redirect if not authenticated - check after all hooks
	if (!sessionUser) {
		return <Navigate to="/login" replace />;
	}

	// Event handlers
	const handleTagFilter = (tagName: string) => {
		setFilters((prev) => ({
			...prev,
			selectedTags: prev.selectedTags.includes(tagName)
				? prev.selectedTags.filter((t) => t !== tagName)
				: [...prev.selectedTags, tagName],
		}));
	};

	const clearFilters = () => {
		setFilters({
			searchTerm: "",
			selectedTags: [],
			sortBy: "similarity",
		});
	};

	// Component definitions
	const UserCard: React.FC<{ user: User; similarity: number }> = ({
		user,
		similarity,
	}) => {
		const commonTags =
			user.usersTags?.filter((tag: TagInterface) =>
				sessionUserTagNames.includes(tag.name),
			) || [];

		return (
			<Link
				to={`/users/${user.id}`}
				className="group block bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-slate-200 hover:border-orange-300 overflow-hidden"
			>
				<div className="relative">
					{/* Profile Image */}
					<div className="aspect-square w-full bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
						<img
							src={user.profileImage}
							alt={`${user.firstName} ${user.lastName}`}
							className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
						/>
						{/* Similarity Badge */}
						<div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
							<Sparkles size={12} />
							{similarity} match{similarity !== 1 ? "es" : ""}
						</div>
					</div>

					{/* Content */}
					<div className="p-4">
						<div className="mb-3">
							<h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-600 transition-colors">
								{user.firstName} {user.lastName}
							</h3>
							<p className="text-slate-600 text-sm">@{user.username}</p>
						</div>

						{/* Bio Preview */}
						{user.bio && (
							<p className="text-slate-700 text-sm mb-3 line-clamp-2 leading-relaxed">
								{user.bio}
							</p>
						)}

						{/* Common Tags */}
						<div className="mb-3">
							<div className="flex flex-wrap gap-1">
								{commonTags.slice(0, 3).map((tag: TagInterface) => (
									<span
										key={tag.id}
										className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
									>
										{tag.name}
									</span>
								))}
								{commonTags.length > 3 && (
									<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
										+{commonTags.length - 3} more
									</span>
								)}
							</div>
						</div>

						{/* Stats */}
						<div className="flex items-center justify-between text-xs text-slate-500">
							<div className="flex items-center gap-3">
								<span className="flex items-center gap-1">
									<Heart size={12} />
									{user.posts?.reduce(
										(acc, post) => acc + (post.likes || 0),
										0,
									) || 0}
								</span>
								<span className="flex items-center gap-1">
									<MessageCircle size={12} />
									{user.posts?.length || 0}
								</span>
							</div>
							<span className="flex items-center gap-1">
								<Users size={12} />
								{user.group?.length || 0} groups
							</span>
						</div>
					</div>
				</div>
			</Link>
		);
	};

	const UserListItem: React.FC<{ user: User; similarity: number }> = ({
		user,
		similarity,
	}) => {
		const commonTags =
			user.usersTags?.filter((tag: TagInterface) =>
				sessionUserTagNames.includes(tag.name),
			) || [];

		return (
			<Link
				to={`/users/${user.id}`}
				className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 hover:border-orange-300 p-4"
			>
				<div className="flex items-center gap-4">
					{/* Profile Image */}
					<div className="relative flex-shrink-0">
						<img
							src={user.profileImage}
							alt={`${user.firstName} ${user.lastName}`}
							className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 group-hover:border-orange-300 transition-colors"
						/>
						<div className="absolute -top-1 -right-1 bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold">
							{similarity}
						</div>
					</div>

					{/* Content */}
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between">
							<div>
								<h3 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
									{user.firstName} {user.lastName}
								</h3>
								<p className="text-slate-600 text-sm">@{user.username}</p>
							</div>
							<div className="flex items-center gap-2 text-xs text-slate-500">
								<span className="flex items-center gap-1">
									<Heart size={12} />
									{user.posts?.reduce(
										(acc, post) => acc + (post.likes || 0),
										0,
									) || 0}
								</span>
								<span className="flex items-center gap-1">
									<Users size={12} />
									{user.group?.length || 0}
								</span>
							</div>
						</div>

						{/* Common Tags */}
						<div className="mt-2 flex flex-wrap gap-1">
							{commonTags.slice(0, 4).map((tag: TagInterface) => (
								<span
									key={tag.id}
									className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
								>
									{tag.name}
								</span>
							))}
							{commonTags.length > 4 && (
								<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
									+{commonTags.length - 4}
								</span>
							)}
						</div>
					</div>
				</div>
			</Link>
		);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100">
			{/* Header */}
			<div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center gap-4">
							<Link
								to="/similar-feed"
								className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
							>
								<ArrowLeft size={20} />
								Posts
							</Link>
						</div>

						<div className="flex items-center gap-3">
							<Link
								to={`/users/${sessionUser.id}/profile/update`}
								className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 font-medium transition-colors"
							>
								<Settings size={18} />
								Update Profile
							</Link>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Page Title */}
				<div className="text-center mb-8">
					<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-slate-800 bg-clip-text text-transparent mb-4">
						Users Similar to You
					</h1>
					<p className="text-lg text-slate-600 max-w-2xl mx-auto">
						Connect with people who share your interests and experiences. Find
						your community based on common tags.
					</p>
				</div>

				{/* Your Tags Display */}
				{sessionUserTagNames.length > 0 && (
					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
						<h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
							<Tag size={20} className="text-orange-500" />
							Your Tags
						</h2>
						<div className="flex flex-wrap gap-2">
							{sessionUserTagNames.map((tagName: string) => (
								<span
									key={tagName}
									className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200"
								>
									{tagName}
								</span>
							))}
						</div>
					</div>
				)}

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
									placeholder="Search by name, username, or tags..."
									value={filters.searchTerm}
									onChange={(e) =>
										setFilters((prev) => ({
											...prev,
											searchTerm: e.target.value,
										}))
									}
									className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
								/>
							</div>
						</div>

						{/* Sort */}
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-slate-700">
								Sort by:
							</label>
							<select
								value={filters.sortBy}
								onChange={(e) =>
									setFilters((prev) => ({
										...prev,
										sortBy: e.target.value as ProfileFilterOptions["sortBy"],
									}))
								}
								className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
							>
								<option value="similarity">Similarity</option>
								<option value="name">Name</option>
								<option value="recent">Recent</option>
							</select>
						</div>

						{/* View Toggle */}
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

						{/* Filter Toggle */}
						<button
							onClick={() => setShowFilters(!showFilters)}
							className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
								showFilters || filters.selectedTags.length > 0
									? "bg-orange-100 text-orange-700 border border-orange-200"
									: "bg-slate-100 text-slate-700 hover:bg-slate-200"
							}`}
						>
							<Filter size={18} />
							Filters
							{filters.selectedTags.length > 0 && (
								<span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
									{filters.selectedTags.length}
								</span>
							)}
						</button>
					</div>

					{/* Tag Filters */}
					{showFilters && (
						<div className="mt-6 pt-6 border-t border-slate-200">
							<div className="flex items-center justify-between mb-3">
								<h3 className="font-medium text-slate-900">Filter by Tags</h3>
								{filters.selectedTags.length > 0 && (
									<button
										onClick={clearFilters}
										className="text-sm text-orange-600 hover:text-orange-700 font-medium"
									>
										Clear all
									</button>
								)}
							</div>
							<div className="flex flex-wrap gap-2">
								{allTags.map((tagName: string) => (
									<button
										key={tagName}
										onClick={() => handleTagFilter(tagName)}
										className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
											filters.selectedTags.includes(tagName)
												? "bg-orange-500 text-white"
												: "bg-slate-100 text-slate-700 hover:bg-slate-200"
										}`}
									>
										{tagName}
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Results */}
				<div className="mb-6">
					<div className="flex items-center justify-between">
						<p className="text-slate-600">
							Found{" "}
							<span className="font-semibold text-slate-900">
								{filteredAndSortedUsers.length}
							</span>{" "}
							similar user{filteredAndSortedUsers.length !== 1 ? "s" : ""}
						</p>
					</div>
				</div>

				{/* Users Display */}
				{filteredAndSortedUsers.length === 0 ? (
					<div className="text-center py-16">
						<div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
							<Users size={32} className="text-slate-400" />
						</div>
						<h3 className="text-xl font-semibold text-slate-900 mb-2">
							No similar users found
						</h3>
						<p className="text-slate-600 mb-6 max-w-md mx-auto">
							{sessionUserTagNames.length === 0
								? "Add some tags to your profile to find users with similar interests."
								: "Try adjusting your search or filters to find more users."}
						</p>
						<Link
							to={`/users/${sessionUser.id}/profile/update`}
							className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
						>
							<UserPlus size={20} />
							Update Your Profile
						</Link>
					</div>
				) : (
					<div
						className={
							viewMode === "grid"
								? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
								: "space-y-4"
						}
					>
						{filteredAndSortedUsers.map((user) => {
							const similarity = calculateSimilarity(user);
							return viewMode === "grid" ? (
								<UserCard key={user.id} user={user} similarity={similarity} />
							) : (
								<UserListItem
									key={user.id}
									user={user}
									similarity={similarity}
								/>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default ProfileFeed;
