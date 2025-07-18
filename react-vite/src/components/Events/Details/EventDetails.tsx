import React, { useState, useEffect, useMemo } from "react";
import { useLoaderData, Link, useNavigate, Form } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	ArrowLeft,
	Calendar,
	Clock,
	MapPin,
	Users,
	UserPlus,
	UserMinus,
	Image as ImageIcon,
	Share2,
	Edit,
	Trash2,
	Building,
	Globe,
	Info,
} from "lucide-react";
import { RootState, EventVenue, type EventDetails } from "../../../types";
import { useModal } from "../../../hooks/useModal";
import DeleteEvent from "../CRUD/Delete/DeleteEvent";

type SectionType = "overview" | "attendees" | "group" | "photos";

const getVenueDisplay = (
	venueInfo: EventVenue | null | undefined,
	type: string,
) => {
	if (type === "online") {
		return {
			address: "Online Event",
			city: "Virtual",
			state: "",
			display: "This is an online event - no physical location",
		};
	}

	if (!venueInfo || (!venueInfo.address && !venueInfo.city)) {
		return {
			address: "Venue TBD",
			city: "Location Coming Soon",
			state: "",
			display: "Venue details will be announced soon",
		};
	}

	return {
		address: venueInfo.address || "Address TBD",
		city: venueInfo.city || "City TBD",
		state: venueInfo.state || "",
		display: `${venueInfo.address || "Address TBD"}, ${
			venueInfo.city || "City TBD"
		}${venueInfo.state ? `, ${venueInfo.state}` : ""}`,
	};
};

const EventDetails: React.FC = () => {
	const eventDetails = useLoaderData() as EventDetails;
	const navigate = useNavigate();
	const sessionUser = useSelector((state: RootState) => state.session.user);
	const [activeSection, setActiveSection] = useState<SectionType>("overview");
	const [showOrganizerInfo, setShowOrganizerInfo] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

	// Use the modal context
	const { setModalContent } = useModal();

	useEffect(() => {
		if (!eventDetails?.id) {
			navigate("/events");
		}
	}, [eventDetails, navigate]);

	// Check if user is attending
	const isAttending = useMemo(() => {
		if (!sessionUser || !eventDetails?.attendees) return false;
		return eventDetails.attendees.some(
			(attendee) => attendee.user.id === sessionUser.id,
		);
	}, [sessionUser, eventDetails?.attendees]);

	// Check if user is organizer
	const isOrganizer = useMemo(() => {
		return sessionUser?.id === eventDetails?.organizer?.id;
	}, [sessionUser, eventDetails?.organizer]);

	// Check if event is past
	const isPastEvent = useMemo(() => {
		return new Date(eventDetails?.startDate) < new Date();
	}, [eventDetails?.startDate]);

	// Check if event is full
	const isFull = useMemo(() => {
		return eventDetails?.numAttendees >= eventDetails?.capacity;
	}, [eventDetails?.numAttendees, eventDetails?.capacity]);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatTime = (dateString: string) => {
		return new Date(dateString).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	const formatDateRange = (startDate: string, endDate: string) => {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const sameDay = start.toDateString() === end.toDateString();

		if (sameDay) {
			return {
				date: formatDate(startDate),
				time: `${formatTime(startDate)} - ${formatTime(endDate)}`,
			};
		} else {
			return {
				date: `${formatDate(startDate)} - ${formatDate(endDate)}`,
				time: `${formatTime(startDate)} - ${formatTime(endDate)}`,
			};
		}
	};

	const handleSignupRedirect = () => {
		navigate("/signup", {
			state: {
				from: `/events/${eventDetails.id}`,
				eventId: eventDetails.id,
			},
		});
	};

	const handleEditClick = () => {
		const editPath = `/groups/${eventDetails.groupId}/events/${eventDetails.id}/edit`;

		// Check if we have all required data
		if (!eventDetails.groupId || !eventDetails.id) {
			console.error("Missing required IDs for edit navigation:", {
				groupId: eventDetails.groupId,
				eventId: eventDetails.id,
			});
			alert(
				"Error: Missing event or group information. Please refresh the page and try again.",
			);
			return;
		}

		// Check authorization again
		if (!isOrganizer) {
			console.error("User is not organizer, should not see edit button");
			alert("Error: You are not authorized to edit this event.");
			return;
		}

		// Add a small delay to see if there are any immediate errors
		setTimeout(() => {
			navigate(editPath);
		}, 100);
	};

	// Handle delete button click - opens the DeleteEvent modal
	const handleDeleteClick = () => {
		setModalContent(
			<DeleteEvent
				eventDetails={{
					id: eventDetails.id,
					name: eventDetails.name,
					groupId: eventDetails.groupId,
					image: eventDetails.image,
					startDate: eventDetails.startDate,
					description: eventDetails.description,
				}}
			/>,
		);
	};

	// Organizer Info Modal
	const OrganizerInfoModal: React.FC = () => (
		<div className="fixed top-4 right-4 bg-orange-100 border border-orange-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
			<div className="flex items-center gap-2 mb-2">
				<Info size={20} className="text-orange-600" />
				<h4 className="font-semibold text-orange-800">Event Organizer</h4>
			</div>
			<p className="text-orange-700 text-sm">
				As the event organizer, you are automatically attending this event. You
				cannot leave your own event.
			</p>
		</div>
	);

	if (!eventDetails) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
						<Calendar size={32} className="text-slate-400" />
					</div>
					<p className="text-slate-600">Event not found.</p>
				</div>
			</div>
		);
	}

	const dateInfo = formatDateRange(
		eventDetails.startDate,
		eventDetails.endDate,
	);

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
							<button className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 font-medium transition-colors">
								<Share2 size={16} />
								Share Event
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Hero Section */}
				<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
					<div className="relative h-64 md:h-80">
						<img
							src={eventDetails.image}
							alt={eventDetails.name}
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

						{/* Event Status Badges */}
						<div className="absolute top-4 left-4 flex gap-2">
							{isPastEvent ? (
								<span className="bg-slate-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
									Past Event
								</span>
							) : (
								<span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
									Upcoming
								</span>
							)}
							{isFull && !isPastEvent && (
								<span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
									Full
								</span>
							)}
							{isOrganizer && (
								<span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
									Your Event
								</span>
							)}
						</div>

						{/* Event Info Overlay */}
						<div className="absolute bottom-0 left-0 right-0 p-6 text-white">
							<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
								<div>
									<h1 className="text-3xl md:text-4xl font-bold mb-2">
										{eventDetails.name}
									</h1>
									<div className="flex flex-wrap items-center gap-4 text-sm">
										<span className="flex items-center gap-1">
											<Calendar size={16} />
											{dateInfo.date}
										</span>
										<span className="flex items-center gap-1">
											<Clock size={16} />
											{dateInfo.time}
										</span>
										<span className="flex items-center gap-1">
											<Users size={16} />
											{eventDetails.numAttendees}/{eventDetails.capacity}{" "}
											attending
										</span>
										<span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
											{eventDetails.type}
										</span>
									</div>
								</div>

								{/* Action Buttons with better organizer handling */}
								<div className="flex items-center gap-3">
									{!sessionUser ? (
										<button
											onClick={handleSignupRedirect}
											className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
											disabled={isPastEvent || isFull}
										>
											<UserPlus size={18} />
											{isPastEvent
												? "Event Ended"
												: isFull
												? "Event Full"
												: "Attend Event"}
										</button>
									) : isOrganizer ? (
										<div className="flex items-center gap-2">
											<div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg flex items-center gap-2">
												<Users size={16} />
												<span className="font-medium">
													You're the organizer
												</span>
											</div>
											{!isPastEvent && (
												<>
													<button
														onClick={handleEditClick}
														className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
													>
														<Edit size={16} />
														Edit
													</button>
													<button
														onClick={handleDeleteClick}
														className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
													>
														<Trash2 size={16} />
														Delete
													</button>
												</>
											)}
										</div>
									) : isAttending ? (
										<Form method="post">
											<input type="hidden" name="intent" value="leave-event" />
											<input type="hidden" name="id" value={eventDetails.id} />
											<input
												type="hidden"
												name="userId"
												value={sessionUser.id}
											/>
											<input
												type="hidden"
												name="attendeeId"
												value={sessionUser.id}
											/>
											<button
												type="submit"
												className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
												disabled={isPastEvent}
											>
												<UserMinus size={18} />
												{isPastEvent ? "Event Ended" : "Leave Event"}
											</button>
										</Form>
									) : (
										<Form method="post">
											<input type="hidden" name="intent" value="attend-event" />
											<input type="hidden" name="id" value={eventDetails.id} />
											<input
												type="hidden"
												name="userId"
												value={sessionUser.id}
											/>
											<button
												type="submit"
												className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
												disabled={isPastEvent || isFull}
											>
												<UserPlus size={18} />
												{isPastEvent
													? "Event Ended"
													: isFull
													? "Event Full"
													: "Attend Event"}
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
									{
										id: "overview" as const,
										label: "Overview",
										icon: Calendar,
									},
									{ id: "attendees" as const, label: "Attendees", icon: Users },
									{ id: "group" as const, label: "Group", icon: Building },
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
								{/* Description */}
								<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
									<h2 className="text-xl font-semibold text-slate-900 mb-4">
										About This Event
									</h2>
									<p className="text-slate-700 leading-relaxed">
										{eventDetails.description}
									</p>
								</div>

								{/* Event Details */}
								<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
									<h2 className="text-xl font-semibold text-slate-900 mb-4">
										Event Details
									</h2>
									<div className="grid md:grid-cols-2 gap-6">
										<div className="space-y-4">
											<div className="flex items-center gap-3">
												<Calendar size={20} className="text-orange-500" />
												<div>
													<p className="font-medium text-slate-900">Date</p>
													<p className="text-slate-600">{dateInfo.date}</p>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<Clock size={20} className="text-orange-500" />
												<div>
													<p className="font-medium text-slate-900">Time</p>
													<p className="text-slate-600">{dateInfo.time}</p>
												</div>
											</div>
										</div>
										<div className="space-y-4">
											<div className="flex items-center gap-3">
												<Users size={20} className="text-orange-500" />
												<div>
													<p className="font-medium text-slate-900">Capacity</p>
													<p className="text-slate-600">
														{eventDetails.numAttendees}/{eventDetails.capacity}{" "}
														people
													</p>
												</div>
											</div>
											<div className="flex items-center gap-3">
												{eventDetails.type === "online" ? (
													<Globe size={20} className="text-orange-500" />
												) : (
													<Building size={20} className="text-orange-500" />
												)}
												<div>
													<p className="font-medium text-slate-900">Location</p>
													<p className="text-slate-600">
														{
															getVenueDisplay(
																eventDetails.venueInfo,
																eventDetails.type,
															).display
														}
													</p>
													{eventDetails.type === "in-person" &&
														!eventDetails.venueInfo?.address && (
															<p className="text-orange-600 text-sm mt-1">
																Venue details will be shared closer to the event
																date
															</p>
														)}
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Organizer */}
								{eventDetails.organizer && (
									<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
										<h2 className="text-xl font-semibold text-slate-900 mb-4">
											Event Organizer
										</h2>
										<Link
											to={`/users/${eventDetails.organizer.id}`}
											className="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors"
										>
											<img
												src={eventDetails.organizer.profileImage}
												alt={eventDetails.organizer.username}
												className="w-16 h-16 rounded-full object-cover"
											/>
											<div>
												<h3 className="font-semibold text-slate-900">
													{eventDetails.organizer.firstName}{" "}
													{eventDetails.organizer.lastName}
												</h3>
												<p className="text-slate-600 text-sm">
													@{eventDetails.organizer.username}
												</p>
												{eventDetails.organizer.bio && (
													<p className="text-slate-700 text-sm mt-1 line-clamp-2">
														{eventDetails.organizer.bio}
													</p>
												)}
											</div>
										</Link>
									</div>
								)}
							</div>
						)}

						{/* Continue with attendees, group, and photos sections... */}
						{/* Rest of your existing section content goes here */}
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Quick Stats */}
						<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
							<h3 className="font-semibold text-slate-900 mb-4">Event Stats</h3>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-slate-600">Attending</span>
									<span className="font-semibold text-slate-900">
										{eventDetails.numAttendees}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-600">Capacity</span>
									<span className="font-semibold text-slate-900">
										{eventDetails.capacity}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-600">Available</span>
									<span className="font-semibold text-slate-900">
										{eventDetails.capacity - eventDetails.numAttendees}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-600">Type</span>
									<span className="font-semibold text-slate-900">
										{eventDetails.type}
									</span>
								</div>
							</div>
						</div>

						{/* Location */}
						<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
							<h3 className="font-semibold text-slate-900 mb-4">Location</h3>
							<div className="flex items-start gap-3">
								{eventDetails.type === "online" ? (
									<Globe size={20} className="text-orange-500 mt-0.5" />
								) : (
									<MapPin size={20} className="text-orange-500 mt-0.5" />
								)}
								<div className="flex-1">
									{(() => {
										const venueDisplay = getVenueDisplay(
											eventDetails.venueInfo,
											eventDetails.type,
										);

										if (eventDetails.type === "online") {
											return (
												<div>
													<p className="font-medium text-slate-900">
														Online Event
													</p>
													<p className="text-slate-600 text-sm">
														Join from anywhere with an internet connection
													</p>
													<div className="mt-2 p-2 bg-blue-50 rounded-lg">
														<p className="text-blue-700 text-sm">
															Event link will be shared with attendees before
															the event
														</p>
													</div>
												</div>
											);
										}

										if (
											!eventDetails.venueInfo?.address &&
											!eventDetails.venueInfo?.city
										) {
											return (
												<div>
													<p className="font-medium text-slate-900">
														Venue Coming Soon
													</p>
													<p className="text-slate-600 text-sm">
														Location details will be announced
													</p>
													<div className="mt-2 p-2 bg-orange-50 rounded-lg">
														<p className="text-orange-700 text-sm">
															Check back soon for venue information
														</p>
													</div>
												</div>
											);
										}

										return (
											<div>
												<p className="font-medium text-slate-900">
													{venueDisplay.address}
												</p>
												<p className="text-slate-600">
													{venueDisplay.city}
													{venueDisplay.state && `, ${venueDisplay.state}`}
												</p>
												{(!eventDetails.venueInfo?.address ||
													eventDetails.venueInfo.address === "Address TBD") && (
													<div className="mt-2 p-2 bg-amber-50 rounded-lg">
														<p className="text-amber-700 text-sm">
															Exact address will be provided closer to the event
														</p>
													</div>
												)}
											</div>
										);
									})()}
								</div>
							</div>
						</div>

						{/* Share */}
						<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
							<h3 className="font-semibold text-slate-900 mb-4">
								Share This Event
							</h3>
							<button className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">
								<Share2 size={16} />
								Share Event
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Organizer Info Modal */}
			{showOrganizerInfo && <OrganizerInfoModal />}
		</div>
	);
};

export default EventDetails;