import React, { useState, useEffect, useMemo } from "react";
import { useLoaderData, Link, useNavigate, Form } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	ArrowLeft,
	Users,
	Calendar,
	MapPin,
	Plus,
	UserPlus,
	UserMinus,
	Image as ImageIcon,
	User,
	Clock,
	ExternalLink,
	Share2,
	Edit,
	Trash2,
	AlertTriangle,
	Crown,
} from "lucide-react";
import { RootState } from "../../../types";
import { type GroupDetails, GroupMember } from "../../../types/groups";

type SectionType = "overview" | "events" | "members" | "photos";

const GroupDetails: React.FC = () => {
	const groupDetails = useLoaderData() as GroupDetails;
	const navigate = useNavigate();
	const sessionUser = useSelector((state: RootState) => state.session.user);
	const [activeSection, setActiveSection] = useState<SectionType>("overview");
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	useEffect(() => {
		if (!groupDetails?.id) {
			navigate("/groups");
		}
	}, [groupDetails, navigate]);

	// Ensure members array is always defined and includes organizer
	const safeMembers = useMemo(() => {
		if (!groupDetails) return [];

		// If members is undefined or null, create empty array
		let membersList = groupDetails.members || [];

		// Check if organizer is in the members list
		const organizerInMembers = membersList.some(
			(member) => member.userId === groupDetails.organizerId,
		);

		// If organizer is not in members, add them
		if (!organizerInMembers && groupDetails.organizer) {
			const organizerMember: GroupMember = {
				id: `organizer_${groupDetails.organizerId}`,
				userId: groupDetails.organizerId,
				groupId: groupDetails.id,
				isOrganizer: true,
				user: {
					id: groupDetails.organizer.id,
					firstName: groupDetails.organizer.firstName,
					lastName: groupDetails.organizer.lastName,
					username: groupDetails.organizer.username,
					email: groupDetails.organizer.email,
					profileImage: groupDetails.organizer.profileImage,
				},
			};
			membersList = [organizerMember, ...membersList];
		} else {
			// Mark organizer in existing members
			membersList = membersList.map((member) => ({
				...member,
				isOrganizer: member.userId === groupDetails.organizerId,
			}));
		}

		// Sort with organizer first
		return membersList.sort((a, b) => {
			if (a.isOrganizer && !b.isOrganizer) return -1;
			if (!a.isOrganizer && b.isOrganizer) return 1;
			return a.user.firstName.localeCompare(b.user.firstName);
		});
	}, [groupDetails]);

	// Check if user is a member
	const isMember = useMemo(() => {
		if (!sessionUser || !safeMembers.length) return false;
		return safeMembers.some((member) => member.userId === sessionUser.id);
	}, [sessionUser, safeMembers]);

	// Check if user is organizer
	const isOrganizer = useMemo(() => {
		return sessionUser?.id === groupDetails?.organizerId;
	}, [sessionUser, groupDetails]);

	// Separate upcoming and past events
	const { upcomingEvents, pastEvents } = useMemo(() => {
		if (!groupDetails?.events) return { upcomingEvents: [], pastEvents: [] };

		const now = new Date();
		const upcoming = groupDetails.events.filter(
			(event) => new Date(event.startDate) >= now,
		);
		const past = groupDetails.events.filter(
			(event) => new Date(event.startDate) < now,
		);

		upcoming.sort(
			(a, b) =>
				new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
		);
		past.sort(
			(a, b) =>
				new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
		);

		return { upcomingEvents: upcoming, pastEvents: past };
	}, [groupDetails?.events]);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const handleJoinRedirect = () => {
		navigate("/signup", {
			state: {
				from: `/groups/${groupDetails.id}`,
				groupId: groupDetails.id,
			},
		});
	};

	// Delete Modal Component
	const DeleteGroupModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
				<div className="flex items-center gap-3 mb-4">
					<div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
						<AlertTriangle size={24} className="text-red-600" />
					</div>
					<div>
						<h3 className="text-lg font-semibold text-slate-900">
							Delete Group
						</h3>
						<p className="text-slate-600 text-sm">
							This action cannot be undone
						</p>
					</div>
				</div>

				<p className="text-slate-700 mb-6">
					Are you sure you want to permanently delete{" "}
					<strong>"{groupDetails.name}"</strong>? All events, members, and group
					data will be lost forever.
				</p>

				<div className="flex gap-3">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
					>
						Cancel
					</button>
					<Form method="post" className="flex-1">
						<input type="hidden" name="intent" value="delete-group" />
						<input type="hidden" name="id" value={groupDetails.id} />
						<button
							type="submit"
							className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
						>
							Delete Group
						</button>
					</Form>
				</div>
			</div>
		</div>
	);

	if (!groupDetails) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
						<Users size={32} className="text-slate-400" />
					</div>
					<p className="text-slate-600">Group not found.</p>
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
							<Link
								to="/groups/new"
								className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 font-medium transition-colors"
							>
								Create Another Group
								<ExternalLink size={16} />
							</Link>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Hero Section */}
				<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
					<div className="relative h-64 md:h-80">
						<img
							src={groupDetails.image}
							alt={groupDetails.name}
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

						{/* Group Info Overlay */}
						<div className="absolute bottom-0 left-0 right-0 p-6 text-white">
							<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
								<div>
									<h1 className="text-3xl md:text-4xl font-bold mb-2">
										{groupDetails.name}
									</h1>
									<div className="flex flex-wrap items-center gap-4 text-sm">
										<span className="flex items-center gap-1">
											<MapPin size={16} />
											{groupDetails.city}, {groupDetails.state}
										</span>
										<span className="flex items-center gap-1">
											<Users size={16} />
											{safeMembers.length} members
										</span>
										<span className="flex items-center gap-1">
											<Calendar size={16} />
											{groupDetails.events?.length || 0} events
										</span>
										<span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
											{groupDetails.type}
										</span>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex items-center gap-3">
									{!sessionUser ? (
										<button
											onClick={handleJoinRedirect}
											className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
										>
											<UserPlus size={18} />
											Join Group
										</button>
									) : isOrganizer ? (
										<div className="flex items-center gap-2">
											<button
												onClick={() =>
													navigate(`/groups/${groupDetails.id}/events/new`)
												}
												className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
											>
												<Plus size={16} />
												Create Event
											</button>
											<button
												onClick={() =>
													navigate(`/groups/${groupDetails.id}/edit`)
												}
												className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
											>
												<Edit size={16} />
												Edit
											</button>
											<button
												onClick={() => setShowDeleteModal(true)}
												className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
											>
												<Trash2 size={16} />
												Delete
											</button>
										</div>
									) : isMember ? (
										<Form method="post">
											<input type="hidden" name="intent" value="leave-group" />
											<input type="hidden" name="id" value={groupDetails.id} />
											<input
												type="hidden"
												name="userId"
												value={sessionUser.id}
											/>
											<input
												type="hidden"
												name="memberId"
												value={sessionUser.id}
											/>
											<button
												type="submit"
												className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
											>
												<UserMinus size={18} />
												Leave Group
											</button>
										</Form>
									) : (
										<Form method="post">
											<input type="hidden" name="intent" value="join-group" />
											<input type="hidden" name="id" value={groupDetails.id} />
											<input
												type="hidden"
												name="userId"
												value={sessionUser.id}
											/>
											<button
												type="submit"
												className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
											>
												<UserPlus size={18} />
												Join Group
											</button>
										</Form>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="grid lg:grid-cols-3 gap-8">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-8">
						{/* Navigation Tabs */}
						<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1">
							<div className="flex space-x-1">
								{[
									{ id: "overview" as const, label: "Overview", icon: User },
									{ id: "events" as const, label: "Events", icon: Calendar },
									{ id: "members" as const, label: "Members", icon: Users },
									{ id: "photos" as const, label: "Photos", icon: ImageIcon },
								].map(({ id, label, icon: Icon }) => (
									<button
										key={id}
										onClick={() => setActiveSection(id)}
										className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
											activeSection === id
												? "bg-orange-100 text-orange-700"
												: "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
										}`}
									>
										<Icon size={18} />
										{label}
									</button>
								))}
							</div>
						</div>

						{/* Content Sections */}
						{activeSection === "overview" && (
							<div className="space-y-6">
								{/* About */}
								<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
									<h2 className="text-xl font-semibold text-slate-900 mb-4">
										About This Group
									</h2>
									<p className="text-slate-700 leading-relaxed">
										{groupDetails.about}
									</p>
								</div>

								{/* Organizer */}
								{groupDetails.organizer && (
									<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
										<h2 className="text-xl font-semibold text-slate-900 mb-4">
											Meet the Organizer
										</h2>
										<Link
											to={`/users/${groupDetails.organizer.id}`}
											className="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors"
										>
											<img
												src={groupDetails.organizer.profileImage}
												alt={groupDetails.organizer.username}
												className="w-16 h-16 rounded-full object-cover"
											/>
											<div>
												<h3 className="font-semibold text-slate-900">
													{groupDetails.organizer.firstName}{" "}
													{groupDetails.organizer.lastName}
												</h3>
												<p className="text-slate-600 text-sm">
													@{groupDetails.organizer.username}
												</p>
												{groupDetails.organizer.bio && (
													<p className="text-slate-700 text-sm mt-1 line-clamp-2">
														{groupDetails.organizer.bio}
													</p>
												)}
											</div>
										</Link>
									</div>
								)}

								{/* Recent Events */}
								{upcomingEvents.length > 0 && (
									<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
										<div className="flex items-center justify-between mb-4">
											<h2 className="text-xl font-semibold text-slate-900">
												Upcoming Events
											</h2>
											<button
												onClick={() => setActiveSection("events")}
												className="text-orange-600 hover:text-orange-700 font-medium text-sm"
											>
												View All
											</button>
										</div>
										<div className="space-y-4">
											{upcomingEvents.slice(0, 3).map((event) => (
												<Link
													key={event.id}
													to={`/events/${event.id}`}
													className="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
												>
													<img
														src={event.image}
														alt={event.name}
														className="w-16 h-16 rounded-lg object-cover"
													/>
													<div className="flex-1">
														<h3 className="font-semibold text-slate-900 mb-1">
															{event.name}
														</h3>
														<p className="text-slate-600 text-sm mb-2 line-clamp-2">
															{event.description}
														</p>
														<div className="flex items-center gap-4 text-xs text-slate-500">
															<span className="flex items-center gap-1">
																<Clock size={12} />
																{formatDate(event.startDate)}
															</span>
															{event.venueInfo && (
																<span className="flex items-center gap-1">
																	<MapPin size={12} />
																	{event.venueInfo.city},{" "}
																	{event.venueInfo.state}
																</span>
															)}
														</div>
													</div>
												</Link>
											))}
										</div>
									</div>
								)}
							</div>
						)}

						{activeSection === "events" && (
							<div className="space-y-6">
								{/* Upcoming Events */}
								<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
									<h2 className="text-xl font-semibold text-slate-900 mb-4">
										Upcoming Events ({upcomingEvents.length})
									</h2>
									{upcomingEvents.length === 0 ? (
										<div className="text-center py-8">
											<Calendar
												size={48}
												className="mx-auto text-slate-300 mb-4"
											/>
											<p className="text-slate-600">
												No upcoming events scheduled.
											</p>
											{isOrganizer && (
												<button
													onClick={() =>
														navigate(`/groups/${groupDetails.id}/events/new`)
													}
													className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
												>
													Create First Event
												</button>
											)}
										</div>
									) : (
										<div className="grid gap-4">
											{upcomingEvents.map((event) => (
												<Link
													key={event.id}
													to={`/events/${event.id}`}
													className="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
												>
													<img
														src={event.image}
														alt={event.name}
														className="w-20 h-20 rounded-lg object-cover"
													/>
													<div className="flex-1">
														<h3 className="font-semibold text-slate-900 mb-1">
															{event.name}
														</h3>
														<p className="text-slate-600 text-sm mb-2 line-clamp-2">
															{event.description}
														</p>
														<div className="flex items-center gap-4 text-sm text-slate-500">
															<span className="flex items-center gap-1">
																<Clock size={14} />
																{formatDate(event.startDate)}
															</span>
															{event.venueInfo && (
																<span className="flex items-center gap-1">
																	<MapPin size={14} />
																	{event.venueInfo.city},{" "}
																	{event.venueInfo.state}
																</span>
															)}
														</div>
													</div>
												</Link>
											))}
										</div>
									)}
								</div>

								{/* Past Events */}
								{pastEvents.length > 0 && (
									<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
										<h2 className="text-xl font-semibold text-slate-900 mb-4">
											Past Events ({pastEvents.length})
										</h2>
										<div className="grid gap-4">
											{pastEvents.map((event) => (
												<Link
													key={event.id}
													to={`/events/${event.id}`}
													className="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100 opacity-75"
												>
													<img
														src={event.image}
														alt={event.name}
														className="w-16 h-16 rounded-lg object-cover"
													/>
													<div className="flex-1">
														<h3 className="font-semibold text-slate-900 mb-1">
															{event.name}
														</h3>
														<p className="text-slate-600 text-sm mb-2 line-clamp-1">
															{event.description}
														</p>
														<div className="flex items-center gap-4 text-xs text-slate-500">
															<span className="flex items-center gap-1">
																<Clock size={12} />
																{formatDate(event.startDate)}
															</span>
															{event.venueInfo && (
																<span className="flex items-center gap-1">
																	<MapPin size={12} />
																	{event.venueInfo.city},{" "}
																	{event.venueInfo.state}
																</span>
															)}
														</div>
													</div>
												</Link>
											))}
										</div>
									</div>
								)}
							</div>
						)}

						{activeSection === "members" && (
							<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
								<h2 className="text-xl font-semibold text-slate-900 mb-4">
									Members ({safeMembers.length})
								</h2>
								{!sessionUser ? (
									<div className="text-center py-8">
										<Users size={48} className="mx-auto text-slate-300 mb-4" />
										<p className="text-slate-600 mb-4">
											You must be logged in to view group members.
										</p>
										<button
											onClick={handleJoinRedirect}
											className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
										>
											Sign Up to View Members
										</button>
									</div>
								) : safeMembers.length === 0 ? (
									<div className="text-center py-8">
										<Users size={48} className="mx-auto text-slate-300 mb-4" />
										<p className="text-slate-600 mb-4">
											No members yet. Be the first to join!
										</p>
										{!isMember && (
											<Form method="post">
												<input type="hidden" name="intent" value="join-group" />
												<input
													type="hidden"
													name="id"
													value={groupDetails.id}
												/>
												<input
													type="hidden"
													name="userId"
													value={sessionUser.id}
												/>
												<button
													type="submit"
													className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
												>
													Join This Group
												</button>
											</Form>
										)}
									</div>
								) : (
									<div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
										{safeMembers.map((member) => (
											<Link
												key={`${member.userId}-${member.groupId}`}
												to={`/users/${member.userId}`}
												className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100 relative"
											>
												{/* Organizer crown indicator */}
												{member.isOrganizer && (
													<div className="absolute top-2 right-2">
														<Crown
															size={16}
															className="text-yellow-500 fill-current"
														/>
													</div>
												)}
												<img
													src={member.user.profileImage}
													alt={member.user.username}
													className="w-12 h-12 rounded-full object-cover"
												/>
												<div className="flex-1">
													<div className="flex items-center gap-2">
														<h3 className="font-semibold text-slate-900">
															{member.user.firstName} {member.user.lastName}
														</h3>
														{member.isOrganizer && (
															<span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
																Organizer
															</span>
														)}
													</div>
													<p className="text-slate-600 text-sm">
														@{member.user.username}
													</p>
												</div>
											</Link>
										))}
									</div>
								)}
							</div>
						)}

						{activeSection === "photos" && (
							<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
								<h2 className="text-xl font-semibold text-slate-900 mb-4">
									Group Photos
								</h2>
								{!groupDetails.groupImage ||
								groupDetails.groupImage?.length === 0 ? (
									<div className="text-center py-8">
										<ImageIcon
											size={48}
											className="mx-auto text-slate-300 mb-4"
										/>
										<p className="text-slate-600 mb-4">
											No photos uploaded yet.
										</p>
										{isOrganizer && (
											<button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
												Add Photos
											</button>
										)}
									</div>
								) : (
									<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
										{groupDetails.groupImage?.map((image) => (
											<div
												key={image.id}
												className="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer"
											>
												<img
													src={image.groupImage}
													alt={image.name}
													className="w-full h-full object-cover"
												/>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Quick Stats */}
						<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
							<h3 className="font-semibold text-slate-900 mb-4">Group Stats</h3>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-slate-600">Members</span>
									<span className="font-semibold text-slate-900">
										{safeMembers.length}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-600">Events</span>
									<span className="font-semibold text-slate-900">
										{groupDetails.events?.length || 0}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-600">Upcoming</span>
									<span className="font-semibold text-slate-900">
										{upcomingEvents.length}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-600">Type</span>
									<span className="font-semibold text-slate-900">
										{groupDetails.type}
									</span>
								</div>
							</div>
						</div>

						{/* Location */}
						<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
							<h3 className="font-semibold text-slate-900 mb-4">Location</h3>
							<div className="flex items-center gap-2 text-slate-600">
								<MapPin size={16} />
								<span>
									{groupDetails.city}, {groupDetails.state}
								</span>
							</div>
						</div>

						{/* Share */}
						<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
							<h3 className="font-semibold text-slate-900 mb-4">
								Share This Group
							</h3>
							<button className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">
								<Share2 size={16} />
								Share Group
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Delete Modal */}
			{showDeleteModal && (
				<DeleteGroupModal onClose={() => setShowDeleteModal(false)} />
			)}
		</div>
	);
};

export default GroupDetails;
