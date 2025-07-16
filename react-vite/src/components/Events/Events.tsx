import React, { useState, useMemo } from "react";
import { useLoaderData, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	Calendar,
	Clock,
	MapPin,
	Users,
	Search,
	Filter,
	Grid,
	List,
	ArrowLeft,
	Sparkles,
	User,
	Plus,
	X,
} from "lucide-react";
import { RootState, Group, Event, EventsData, EventFilterOptions } from "../../types";

const Events: React.FC = () => {
	const { allEvents } = useLoaderData() as { allEvents: EventsData };
	const sessionUser = useSelector((state: RootState) => state.session.user);

	const [filters, setFilters] = useState<EventFilterOptions>({
		searchTerm: "",
		location: "",
		type: "",
		timeFilter: "all",
		sortBy: "date",
	});
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [showFilters, setShowFilters] = useState(false);
	const [showGroupSelector, setShowGroupSelector] = useState(false);
	const [groupSearchTerm, setGroupSearchTerm] = useState("");

	// Get groups where user is ORGANIZER and member groups using organizerId
	const userGroups = useMemo(() => {
		if (!sessionUser) {
			return {
				organizer: [] as Group[],
				member: [] as Group[],
				all: [] as Group[],
			};
		}

		// Get all groups from user data
		const allUserGroups = sessionUser.group || [];

		// Separate organizer groups from member groups using organizerId
		const organizerGroups = allUserGroups.filter((group: Group) => {
			return group.organizerId === sessionUser.id;
		});

		const memberGroups = allUserGroups.filter((group: Group) => {
			return group.organizerId !== sessionUser.id;
		});

		return {
			organizer: organizerGroups,
			member: memberGroups,
			all: allUserGroups,
		};
	}, [sessionUser]);

	// Process and filter events
	const processedEvents = useMemo(() => {
		if (!allEvents?.events) return { upcoming: [], past: [], all: [] };

		const now = new Date();
		const upcoming = allEvents.events.filter(
			(event) => new Date(event.startDate) >= now,
		);
		const past = allEvents.events.filter(
			(event) => new Date(event.startDate) < now,
		);

		// Sort upcoming events by start date (earliest first)
		upcoming.sort(
			(a, b) =>
				new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
		);
		// Sort past events by start date (most recent first)
		past.sort(
			(a, b) =>
				new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
		);

		const all = [...upcoming, ...past];

		return { upcoming, past, all };
	}, [allEvents]);

	// Filter and sort events
	const filteredAndSortedEvents = useMemo(() => {
		let events = processedEvents.all;

		// Apply time filter
		switch (filters.timeFilter) {
			case "upcoming":
				events = processedEvents.upcoming;
				break;
			case "past":
				events = processedEvents.past;
				break;
			default:
				events = processedEvents.all;
		}

		// Apply search filter
		if (filters.searchTerm) {
			const searchLower = filters.searchTerm.toLowerCase();
			events = events.filter(
				(event) =>
					event.name.toLowerCase().includes(searchLower) ||
					event.description.toLowerCase().includes(searchLower) ||
					event.groupInfo.name.toLowerCase().includes(searchLower) ||
					event.venueInfo?.city.toLowerCase().includes(searchLower) ||
					event.venueInfo?.state.toLowerCase().includes(searchLower),
			);
		}

		// Apply location filter
		if (filters.location) {
			const locationLower = filters.location.toLowerCase();
			events = events.filter(
				(event) =>
					event.venueInfo?.city.toLowerCase().includes(locationLower) ||
					event.venueInfo?.state.toLowerCase().includes(locationLower) ||
					event.groupInfo.city.toLowerCase().includes(locationLower) ||
					event.groupInfo.state.toLowerCase().includes(locationLower),
			);
		}

		// Apply type filter
		if (filters.type) {
			events = events.filter((event) => event.type === filters.type);
		}

		// Sort events
		switch (filters.sortBy) {
			case "name":
				return events.sort((a, b) => a.name.localeCompare(b.name));
			case "attendees":
				return events.sort((a, b) => b.numAttendees - a.numAttendees);
			case "capacity":
				return events.sort((a, b) => b.capacity - a.capacity);
			case "date":
			default:
				return events; // Already sorted by date in processedEvents
		}
	}, [processedEvents, filters]);

	// Filter groups based on search term - only organizer groups for event creation
	const filteredOrganizerGroups = useMemo(() => {
		const organizerGroups = userGroups.organizer;
		if (!groupSearchTerm) return organizerGroups;

		const searchLower = groupSearchTerm.toLowerCase();
		return organizerGroups.filter((group: Group) =>
			group.name.toLowerCase().includes(searchLower),
		);
	}, [userGroups.organizer, groupSearchTerm]);

	const clearFilters = () => {
		setFilters({
			searchTerm: "",
			location: "",
			type: "",
			timeFilter: "all",
			sortBy: "date",
		});
	};

	const getUniqueTypes = () => {
		if (!allEvents?.events) return [];
		return [...new Set(allEvents.events.map((event) => event.type))];
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const formatDateRange = (startDate: string, endDate: string) => {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const sameDay = start.toDateString() === end.toDateString();

		if (sameDay) {
			return `${start.toLocaleDateString("en-US", {
				weekday: "short",
				month: "short",
				day: "numeric",
			})} • ${start.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
			})} - ${end.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
			})}`;
		} else {
			return `${formatDate(startDate)} - ${formatDate(endDate)}`;
		}
	};

	const isEventPast = (startDate: string) => {
		return new Date(startDate) < new Date();
	};

	const EventCard: React.FC<{ event: Event }> = ({ event }) => {
		const isPast = isEventPast(event.startDate);

		return (
			<Link
				to={`/events/${event.id}`}
				className={`group block bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-slate-200 hover:border-orange-300 overflow-hidden ${
					isPast ? "opacity-75" : ""
				}`}
			>
				<div className="relative">
					{/* Event Image */}
					<div className="aspect-video w-full bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
						<img
							src={event.image}
							alt={event.name}
							className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
						/>
						{/* Status Badge */}
						<div
							className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
								isPast ? "bg-slate-500 text-white" : "bg-green-500 text-white"
							}`}
						>
							<Clock size={14} />
							{isPast ? "Past" : "Upcoming"}
						</div>
						{/* Attendees Badge */}
						<div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
							<Users size={14} />
							{event.numAttendees}/{event.capacity}
						</div>
					</div>

					{/* Content */}
					<div className="p-6">
						<div className="mb-4">
							<h3 className="font-bold text-xl text-slate-900 group-hover:text-orange-600 transition-colors mb-2 line-clamp-2">
								{event.name}
							</h3>
							<p className="text-slate-600 text-sm line-clamp-3 leading-relaxed mb-3">
								{event.description}
							</p>

							{/* Date and Time */}
							<div className="flex items-center gap-2 text-slate-500 mb-2">
								<Calendar size={16} />
								<span className="text-sm">
									{formatDateRange(event.startDate, event.endDate)}
								</span>
							</div>

							{/* Location */}
							<div className="flex items-center gap-2 text-slate-500 mb-3">
								<MapPin size={16} />
								<span className="text-sm">
									{event.venueInfo
										? `${event.venueInfo.city}, ${event.venueInfo.state}`
										: "Online Event"}
								</span>
							</div>
						</div>

						{/* Group Info */}
						<div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg mb-4">
							<img
								src={event.groupInfo.image}
								alt={event.groupInfo.name}
								className="w-10 h-10 rounded-full object-cover"
							/>
							<div className="flex-1 min-w-0">
								<p className="font-medium text-slate-900 text-sm truncate">
									{event.groupInfo.name}
								</p>
								<p className="text-slate-500 text-xs">
									{event.groupInfo.city}, {event.groupInfo.state}
								</p>
							</div>
						</div>

						{/* Stats */}
						<div className="flex items-center justify-between text-sm">
							<div className="flex items-center gap-4">
								<span className="flex items-center gap-1 text-slate-600">
									<User size={14} />
									{event.numAttendees} attending
								</span>
								<span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-medium">
									{event.type}
								</span>
							</div>
							{!isPast && (
								<span className="text-green-600 font-medium text-xs">
									{event.capacity - event.numAttendees} spots left
								</span>
							)}
						</div>
					</div>
				</div>
			</Link>
		);
	};

	const EventListItem: React.FC<{ event: Event }> = ({ event }) => {
		const isPast = isEventPast(event.startDate);

		return (
			<Link
				to={`/events/${event.id}`}
				className={`group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 hover:border-orange-300 p-6 ${
					isPast ? "opacity-75" : ""
				}`}
			>
				<div className="flex items-center gap-6">
					{/* Event Image */}
					<div className="relative flex-shrink-0">
						<img
							src={event.image}
							alt={event.name}
							className="w-24 h-24 rounded-xl object-cover border-2 border-slate-200 group-hover:border-orange-300 transition-colors"
						/>
						<div
							className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-semibold ${
								isPast ? "bg-slate-500 text-white" : "bg-green-500 text-white"
							}`}
						>
							{isPast ? "Past" : "Live"}
						</div>
					</div>

					{/* Content */}
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<h3 className="font-semibold text-lg text-slate-900 group-hover:text-orange-600 transition-colors mb-1">
									{event.name}
								</h3>
								<p className="text-slate-600 text-sm mb-3 line-clamp-2">
									{event.description}
								</p>

								<div className="flex items-center gap-6 text-sm text-slate-500 mb-2">
									<span className="flex items-center gap-1">
										<Calendar size={14} />
										{formatDate(event.startDate)}
									</span>
									<span className="flex items-center gap-1">
										<MapPin size={14} />
										{event.venueInfo
											? `${event.venueInfo.city}, ${event.venueInfo.state}`
											: "Online"}
									</span>
									<span className="flex items-center gap-1">
										<Users size={14} />
										{event.numAttendees}/{event.capacity}
									</span>
								</div>

								<div className="flex items-center gap-3">
									<span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-medium">
										{event.type}
									</span>
									<span className="text-slate-500 text-xs">
										by {event.groupInfo.name}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Link>
		);
	};

	// Group selection modal
	const GroupSelectionModal: React.FC = () => (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-xl font-bold text-slate-900">Create Event</h3>
					<button
						onClick={() => setShowGroupSelector(false)}
						className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				{userGroups.organizer.length === 0 ? (
					<div className="text-center py-8">
						<div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Users size={24} className="text-slate-400" />
						</div>
						<h4 className="text-lg font-semibold text-slate-900 mb-2">
							No Groups to Organize
						</h4>
						<p className="text-slate-600 mb-4">
							You need to be an organizer of a group to create an event.
						</p>
						{userGroups.member.length > 0 && (
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
								<p className="text-blue-800 text-sm">
									You're a member of {userGroups.member.length} group
									{userGroups.member.length !== 1 ? "s" : ""}, but only
									organizers can create events.
								</p>
							</div>
						)}
						<Link
							to="/groups/new"
							className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
						>
							<Plus size={18} />
							Create Your Own Group
						</Link>
					</div>
				) : (
					<>
						<div className="mb-6">
							<p className="text-center text-slate-700 mb-4">
								Select a group you organize to create an event:
							</p>
							<div className="relative">
								<Search
									size={18}
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
								/>
								<input
									type="text"
									placeholder="Search your groups..."
									value={groupSearchTerm}
									onChange={(e) => setGroupSearchTerm(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
								/>
							</div>
						</div>

						<div className="max-h-80 overflow-y-auto pr-2 space-y-3">
							{filteredOrganizerGroups.length === 0 ? (
								<p className="text-center py-4 text-slate-500">
									No matching organizer groups found
								</p>
							) : (
								<>
									{/* Show organizer groups - these are clickable */}
									{filteredOrganizerGroups.map((group: Group) => (
										<Link
											key={group.id}
											to={`/groups/${group.id}/events/new`}
											className="flex items-center gap-3 p-4 rounded-lg hover:bg-orange-50 transition-colors border-2 border-orange-200 hover:border-orange-300 group"
										>
											<img
												src={group.image}
												alt={group.name}
												className="w-12 h-12 rounded-lg object-cover"
											/>
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<h4 className="font-medium text-slate-900 group-hover:text-orange-700">
														{group.name}
													</h4>
													<span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
														Organizer
													</span>
												</div>
												<p className="text-sm text-slate-500">
													Click to create an event for this group
												</p>
											</div>
										</Link>
									))}

									{/* Show member groups for reference - these are NOT clickable */}
									{userGroups.member.length > 0 && (
										<>
											<div className="border-t border-slate-200 pt-4 mt-4">
												<p className="text-sm font-medium text-slate-600 mb-3">
													Groups you're a member of (can't create events):
												</p>
												{userGroups.member.slice(0, 3).map((group: Group) => (
													<div
														key={group.id}
														className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 opacity-60"
													>
														<img
															src={group.image}
															alt={group.name}
															className="w-10 h-10 rounded-lg object-cover"
														/>
														<div className="flex-1">
															<div className="flex items-center gap-2">
																<h4 className="font-medium text-slate-700">
																	{group.name}
																</h4>
																<span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs">
																	Member
																</span>
															</div>
															<p className="text-xs text-slate-500">
																Only organizers can create events
															</p>
														</div>
													</div>
												))}
												{userGroups.member.length > 3 && (
													<p className="text-xs text-slate-500 text-center mt-2">
														...and {userGroups.member.length - 3} more groups
													</p>
												)}
											</div>
										</>
									)}
								</>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);

	if (!allEvents || !allEvents.events) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
						<Calendar size={32} className="text-slate-400" />
					</div>
					<p className="text-slate-600">No events available.</p>
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
								to="/groups"
								className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
							>
								<ArrowLeft size={20} />
								Groups
							</Link>
						</div>

						<div className="flex items-center gap-3">
							{sessionUser && (
								<button
									onClick={() => setShowGroupSelector(true)}
									className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
									title={
										userGroups.organizer.length === 0
											? "You need to organize a group to create events"
											: "Create an event for one of your groups"
									}
								>
									<Plus size={18} />
									Create Event
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Page Title */}
				<div className="text-center mb-8">
					<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-slate-800 bg-clip-text text-transparent mb-4">
						Discover Events
					</h1>
					<p className="text-lg text-slate-600 max-w-2xl mx-auto">
						Join meaningful events that support mental health and build
						community connections.
					</p>
				</div>

				{/* Quick Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
						<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
							<Calendar size={24} className="text-green-600" />
						</div>
						<h3 className="text-2xl font-bold text-slate-900">
							{processedEvents.upcoming.length}
						</h3>
						<p className="text-slate-600">Upcoming Events</p>
					</div>
					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
						<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
							<Users size={24} className="text-blue-600" />
						</div>
						<h3 className="text-2xl font-bold text-slate-900">
							{allEvents.events.reduce(
								(sum, event) => sum + event.numAttendees,
								0,
							)}
						</h3>
						<p className="text-slate-600">Total Attendees</p>
					</div>
					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
						<div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
							<Sparkles size={24} className="text-purple-600" />
						</div>
						<h3 className="text-2xl font-bold text-slate-900">
							{getUniqueTypes().length}
						</h3>
						<p className="text-slate-600">Event Types</p>
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
									placeholder="Search events by name, description, or group..."
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

						{/* Time Filter */}
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-slate-700">
								Time:
							</label>
							<select
								value={filters.timeFilter}
								onChange={(e) =>
									setFilters((prev) => ({
										...prev,
										timeFilter: e.target.value as EventFilterOptions["timeFilter"],
									}))
								}
								className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
							>
								<option value="all">All Events</option>
								<option value="upcoming">Upcoming</option>
								<option value="past">Past Events</option>
							</select>
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
										sortBy: e.target.value as EventFilterOptions["sortBy"],
									}))
								}
								className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
							>
								<option value="date">Date</option>
								<option value="name">Name</option>
								<option value="attendees">Most Attendees</option>
								<option value="capacity">Capacity</option>
							</select>
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
								{filteredAndSortedEvents.length}
							</span>{" "}
							event{filteredAndSortedEvents.length !== 1 ? "s" : ""}
						</p>
					</div>
				</div>

				{/* Events Display */}
				{filteredAndSortedEvents.length === 0 ? (
					<div className="text-center py-16">
						<div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
							<Calendar size={32} className="text-slate-400" />
						</div>
						<h3 className="text-xl font-semibold text-slate-900 mb-2">
							No events found
						</h3>
						<p className="text-slate-600 mb-6 max-w-md mx-auto">
							{filters.searchTerm || filters.location || filters.type
								? "Try adjusting your search or filters to find more events."
								: "No events are currently available. Check back later!"}
						</p>
						{sessionUser && userGroups.organizer.length > 0 && (
							<button
								onClick={() => setShowGroupSelector(true)}
								className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
							>
								<Plus size={20} />
								Create First Event
							</button>
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
						{filteredAndSortedEvents.map((event) =>
							viewMode === "grid" ? (
								<EventCard key={event.id} event={event} />
							) : (
								<EventListItem key={event.id} event={event} />
							),
						)}
					</div>
				)}
			</div>

			{/* Group Selection Modal */}
			{showGroupSelector && <GroupSelectionModal />}
		</div>
	);
};

export default Events;