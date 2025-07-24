import React, { useState, useMemo } from "react";
import { useLoaderData, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	Users,
	Calendar,
	MapPin,
	Plus,
	Search,
	Filter,
	Grid,
	List,
	ArrowLeft
} from "lucide-react";
import { RootState, Group, GroupsData, GroupFilterOptions } from "../../types";

const Groups: React.FC = () => {
	const { allGroups } = useLoaderData() as { allGroups: GroupsData };
	const sessionUser = useSelector((state: RootState) => state.session.user);

	const [filters, setFilters] = useState<GroupFilterOptions>({
		searchTerm: "",
		location: "",
		type: "",
		sortBy: "members",
	});
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [showFilters, setShowFilters] = useState(false);

	// Filter and sort groups
	const filteredAndSortedGroups = useMemo(() => {
		if (!allGroups?.groups) return [];

		let groups = [...allGroups.groups];

		// Apply search filter
		if (filters.searchTerm) {
			const searchLower = filters.searchTerm.toLowerCase();
			groups = groups.filter(
				(group) =>
					group.name.toLowerCase().includes(searchLower) ||
					group.about.toLowerCase().includes(searchLower) ||
					group.city.toLowerCase().includes(searchLower) ||
					group.state.toLowerCase().includes(searchLower),
			);
		}

		// Apply location filter
		if (filters.location) {
			const locationLower = filters.location.toLowerCase();
			groups = groups.filter(
				(group) =>
					group.city.toLowerCase().includes(locationLower) ||
					group.state.toLowerCase().includes(locationLower),
			);
		}

		// Apply type filter
		if (filters.type) {
			groups = groups.filter((group) => group.type === filters.type);
		}

		// Sort groups
		switch (filters.sortBy) {
			case "name":
				return groups.sort((a, b) => a.name.localeCompare(b.name));
			case "members":
				return groups.sort((a, b) => b.numMembers - a.numMembers);
			case "events":
				return groups.sort((a, b) => b.numEvents - a.numEvents);
			case "recent":
				return groups.sort((a, b) => b.id - a.id); // Assuming higher ID = more recent
			default:
				return groups;
		}
	}, [allGroups, filters]);

	const clearFilters = () => {
		setFilters({
			searchTerm: "",
			location: "",
			type: "",
			sortBy: "members",
		});
	};

	const getUniqueTypes = () => {
		if (!allGroups?.groups) return [];
		return [...new Set(allGroups.groups.map((group) => group.type))];
	};

	const GroupCard: React.FC<{ group: Group }> = ({ group }) => (
		<Link
			to={`/groups/${group.id}`}
			className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-slate-200 hover:border-orange-300 overflow-hidden h-[410px] flex flex-col w-[300px]"
		>
			<div className="relative flex-shrink-0">
				{/* Group Image */}
				<div className="aspect-video w-full bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
					<img
						src={group.image}
						alt={group.name}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
					/>
					{/* Member Count Badge */}
					<div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
						<Users size={14} />
						{group.numMembers}
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="p-6 flex flex-col flex-1">
				<div className="flex-1">
					<h3 className="font-bold text-xl text-slate-900 group-hover:text-orange-600 transition-colors mb-2 line-clamp-2 h-[3.5rem]">
						{group.name}
					</h3>
					<p className="text-slate-600 text-sm line-clamp-4 leading-relaxed mb-4 h-[4rem]">
						{group.about}
					</p>

					{/* Location */}
					<div className="flex items-center gap-2 text-slate-500 mb-4">
						<MapPin size={16} />
						<span className="text-sm">
							{group.city}, {group.state}
						</span>
					</div>
				</div>

				{/* Stats - Always at bottom */}
				<div className="flex items-center justify-between text-sm mt-auto">
					<div className="flex items-center gap-4">
						<span className="flex items-center gap-1 text-slate-600">
							<Users size={14} />
							{group.numMembers} members
						</span>
						<span className="flex items-center gap-1 text-slate-600">
							<Calendar size={14} />
							{group.numEvents} events
						</span>
					</div>
					<span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-medium">
						{group.type}
					</span>
				</div>
			</div>
		</Link>
	);

	const GroupListItem: React.FC<{ group: Group }> = ({ group }) => (
		<Link
			to={`/groups/${group.id}`}
			className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 hover:border-orange-300 p-6"
		>
			<div className="flex items-center gap-6">
				{/* Group Image */}
				<div className="relative flex-shrink-0">
					<img
						src={group.image}
						alt={group.name}
						className="w-24 h-24 rounded-xl object-cover border-2 border-slate-200 group-hover:border-orange-300 transition-colors"
					/>
					<div className="absolute -top-2 -right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
						{group.numMembers}
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 min-w-0">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<h3 className="font-semibold text-lg text-slate-900 group-hover:text-orange-600 transition-colors mb-1">
								{group.name}
							</h3>
							<p className="text-slate-600 text-sm mb-3 line-clamp-2">
								{group.about}
							</p>
							<div className="flex items-center gap-4 text-sm text-slate-500">
								<span className="flex items-center gap-1">
									<MapPin size={14} />
									{group.city}, {group.state}
								</span>
								<span className="flex items-center gap-1">
									<Calendar size={14} />
									{group.numEvents} events
								</span>
								<span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-medium">
									{group.type}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);

	if (!allGroups || !allGroups.groups) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
						<Users size={32} className="text-slate-400" />
					</div>
					<p className="text-slate-600">No groups available.</p>
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
							<Link
								to="/events"
								className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
							>
								<ArrowLeft size={20} />
								Events
							</Link>
						</div>

						<div className="flex items-center gap-3">
							{sessionUser ? (
								<Link
									to="/groups/new"
									className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
								>
									<Plus size={18} />
									Create Group
								</Link>
							) : (
								<Link
									to="/groups/new"
									className="inline-flex items-center gap-2 bg-slate-300 text-slate-500 px-4 py-2 rounded-lg font-medium cursor-not-allowed"
								>
									<Plus size={18} />
									Create Group
								</Link>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Page Title */}
				<div className="text-center mb-8">
					<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-slate-800 bg-clip-text text-transparent mb-4">
						Find Your Community
					</h1>
					<p className="text-lg text-slate-600 max-w-2xl mx-auto">
						Discover support groups that match your interests and connect with
						others on similar journeys.
					</p>
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
									placeholder="Search groups by name, description, or location..."
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
										sortBy: e.target.value as GroupFilterOptions["sortBy"],
									}))
								}
								className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
							>
								<option value="members">Most Members</option>
								<option value="events">Most Events</option>
								<option value="name">Name</option>
								<option value="recent">Recently Created</option>
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
								showFilters || filters.location || filters.type
									? "bg-orange-100 text-orange-700 border border-orange-200"
									: "bg-slate-100 text-slate-700 hover:bg-slate-200"
							}`}
						>
							<Filter size={18} />
							Filters
							{(filters.location || filters.type) && (
								<span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
									{(filters.location ? 1 : 0) + (filters.type ? 1 : 0)}
								</span>
							)}
						</button>
					</div>

					{/* Advanced Filters */}
					{showFilters && (
						<div className="mt-6 pt-6 border-t border-slate-200">
							<div className="grid md:grid-cols-3 gap-4">
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										Location
									</label>
									<input
										type="text"
										placeholder="City or State"
										value={filters.location}
										onChange={(e) =>
											setFilters((prev) => ({
												...prev,
												location: e.target.value,
											}))
										}
										className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-2">
										Type
									</label>
									<select
										value={filters.type}
										onChange={(e) =>
											setFilters((prev) => ({ ...prev, type: e.target.value }))
										}
										className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
									>
										<option value="">All Types</option>
										{getUniqueTypes().map((type) => (
											<option key={type} value={type}>
												{type}
											</option>
										))}
									</select>
								</div>
								<div className="flex items-end">
									<button
										onClick={clearFilters}
										className="w-full px-4 py-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
									>
										Clear Filters
									</button>
								</div>
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
								{filteredAndSortedGroups.length}
							</span>{" "}
							group{filteredAndSortedGroups.length !== 1 ? "s" : ""}
						</p>
					</div>
				</div>

				{/* Groups Display */}
				{filteredAndSortedGroups.length === 0 ? (
					<div className="text-center py-16">
						<div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
							<Users size={32} className="text-slate-400" />
						</div>
						<h3 className="text-xl font-semibold text-slate-900 mb-2">
							No groups found
						</h3>
						<p className="text-slate-600 mb-6 max-w-md mx-auto">
							{filters.searchTerm || filters.location || filters.type
								? "Try adjusting your search or filters to find more groups."
								: "Be the first to create a group in your area!"}
						</p>
						{sessionUser && (
							<Link
								to="/groups/new"
								className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
							>
								<Plus size={20} />
								Create First Group
							</Link>
						)}
					</div>
				) : (
					<div
						className={
							viewMode === "grid"
								? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
								: "space-y-4"
						}
					>
						{filteredAndSortedGroups.map((group) =>
							viewMode === "grid" ? (
								<GroupCard key={group.id} group={group} />
							) : (
								<GroupListItem key={group.id} group={group} />
							),
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default Groups;
