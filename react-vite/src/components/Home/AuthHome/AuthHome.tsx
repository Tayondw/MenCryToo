import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	Users,
	Calendar,
	ArrowRight,
	ChevronLeft,
	ChevronRight,
	MapPin,
	Clock,
	User as UserIcon,
	Handshake,
	PenTool,
	UserCheck,
	Plus,
	Search,
} from "lucide-react";
import { RootState } from "../../../types";
import "./AuthHome.css";

// Mock data for demonstration when no user data is available
const mockGroups = [
	{
		id: 1,
		name: "Anxiety Support Circle",
		about: "A safe space for men dealing with anxiety and stress management",
		image:
			"https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400",
		city: "San Francisco",
		state: "CA",
		type: "Weekly",
		numMembers: 24,
	},
	{
		id: 2,
		name: "Depression Recovery Group",
		about:
			"Supporting each other through depression and mental health challenges",
		image:
			"https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400",
		city: "Los Angeles",
		state: "CA",
		type: "Bi-weekly",
		numMembers: 18,
	},
	{
		id: 3,
		name: "Trauma Healing Circle",
		about: "A community for men working through trauma and PTSD",
		image:
			"https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400",
		city: "New York",
		state: "NY",
		type: "Monthly",
		numMembers: 32,
	},
];

const mockEvents = [
	{
		id: 1,
		name: "Mental Health Workshop",
		description:
			"Learn coping strategies and stress management techniques for daily life",
		image:
			"https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400",
		type: "Workshop",
		startDate: "2024-02-15T18:00:00Z",
		endDate: "2024-02-15T20:00:00Z",
		groupInfo: { name: "Anxiety Support Circle" },
		venueInfo: { address: "123 Main St", city: "San Francisco", state: "CA" },
		numAttendees: 15,
		capacity: 25,
	},
	{
		id: 2,
		name: "Group Therapy Session",
		description:
			"Weekly group therapy session for depression support and peer connection",
		image:
			"https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=400",
		type: "Therapy",
		startDate: "2024-02-20T19:00:00Z",
		endDate: "2024-02-20T21:00:00Z",
		groupInfo: { name: "Depression Recovery Group" },
		venueInfo: { address: "456 Oak Ave", city: "Los Angeles", state: "CA" },
		numAttendees: 12,
		capacity: 20,
	},
	{
		id: 3,
		name: "Mindfulness Meditation",
		description:
			"Guided meditation session for stress relief and mental clarity practice",
		image:
			"https://images.pexels.com/photos/3184340/pexels-photo-3184340.jpeg?auto=compress&cs=tinysrgb&w=400",
		type: "Meditation",
		startDate: "2024-02-25T17:00:00Z",
		endDate: "2024-02-25T18:30:00Z",
		groupInfo: { name: "Mindfulness Circle" },
		venueInfo: { address: "789 Pine St", city: "Seattle", state: "WA" },
		numAttendees: 8,
		capacity: 15,
	},
];

const AuthHome: React.FC = () => {
      const sessionUser = useSelector((state: RootState) => state.session.user);
	const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
	const [currentEventIndex, setCurrentEventIndex] = useState(0);

	// Use user's actual groups and events, fallback to mock data if none
	const userGroups =
		sessionUser?.group && sessionUser.group.length > 0 ? sessionUser.group : [];
	const userEvents =
		sessionUser?.events && sessionUser.events.length > 0
			? sessionUser.events
			: [];

	// Use mock data for display if user has no groups/events
	const displayGroups = userGroups.length > 0 ? userGroups : mockGroups;
	const displayEvents = userEvents.length > 0 ? userEvents : mockEvents;

	// Auto-advance carousels
	useEffect(() => {
		if (displayGroups.length > 1) {
			const groupInterval = setInterval(() => {
				setCurrentGroupIndex((prev) =>
					prev < displayGroups.length - 1 ? prev + 1 : 0,
				);
			}, 5000); // Change every 5 seconds

			return () => clearInterval(groupInterval);
		}
	}, [displayGroups.length]);

	useEffect(() => {
		if (displayEvents.length > 1) {
			const eventInterval = setInterval(() => {
				setCurrentEventIndex((prev) =>
					prev < displayEvents.length - 1 ? prev + 1 : 0,
				);
			}, 6000); // Change every 6 seconds (offset from groups)

			return () => clearInterval(eventInterval);
		}
	}, [displayEvents.length]);

	const handleGroupPrev = () => {
		setCurrentGroupIndex((prev) =>
			prev > 0 ? prev - 1 : displayGroups.length - 1,
		);
	};

	const handleGroupNext = () => {
		setCurrentGroupIndex((prev) =>
			prev < displayGroups.length - 1 ? prev + 1 : 0,
		);
	};

	const handleEventPrev = () => {
		setCurrentEventIndex((prev) =>
			prev > 0 ? prev - 1 : displayEvents.length - 1,
		);
	};

	const handleEventNext = () => {
		setCurrentEventIndex((prev) =>
			prev < displayEvents.length - 1 ? prev + 1 : 0,
		);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
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

	// Empty state components
	const EmptyGroupsState = () => (
		<div className="empty-state">
			<div className="empty-icon">
				<Users size={48} />
			</div>
			<h4>No Groups Yet</h4>
			<p>
				You haven't joined any support groups. Discover groups that match your
				interests and connect with others.
			</p>
			<div className="empty-actions">
				<Link to="/groups" className="btn-primary">
					<Search size={16} />
					Find Groups
				</Link>
				<Link to="/groups/create" className="btn-outline">
					<Plus size={16} />
					Create Group
				</Link>
			</div>
		</div>
	);

	const EmptyEventsState = () => (
		<div className="empty-state">
			<div className="empty-icon">
				<Calendar size={48} />
			</div>
			<h4>No Events Yet</h4>
			<p>
				You haven't joined any events. Explore upcoming events in your area and
				start participating.
			</p>
			<div className="empty-actions">
				<Link to="/events" className="btn-primary">
					<Search size={16} />
					Find Events
				</Link>
				<Link to="/events/create" className="btn-outline">
					<Plus size={16} />
					Create Event
				</Link>
			</div>
		</div>
	);

	return (
		<div className="auth-home">
			{/* Welcome Hero */}
			<section className="welcome-hero">
				<div className="hero-overlay">
					<div className="welcome-content">
						<h1 className="welcome-title">
							Welcome back, {sessionUser?.firstName || "Friend"}
						</h1>
						<p className="welcome-subtitle">
							Continue your journey toward better mental health
						</p>
						<div className="welcome-actions">
							<Link to="/posts-feed" className="btn-primary">
								<Users size={20} />
								Connect with Others
							</Link>
							<Link to="/partnership" className="btn-secondary">
								<Handshake size={20} />
								Partnership
							</Link>
							<Link to="/profile" className="btn-outline-hero">
								<UserIcon size={20} />
								View Profile
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Connect Section - Improved Layout */}
			<section className="connect-section">
				<div className="container">
					<div className="connect-layout">
						<div className="connect-header">
							<h2 className="section-title">Connect with Others</h2>
						</div>
						<div className="connect-description">
							<p className="section-subtitle">
								Find users with similar experiences and build meaningful
								connections through shared stories and mutual support.
							</p>
						</div>
						<div className="connect-card">
							<div className="connect-content">
								<div className="connect-icon">
									<Users size={32} />
								</div>
								<h3>Posts Feed</h3>
								<p>
									Discover posts from users who share similar tags and
									experiences. Connect, support, and learn from each other's
									journeys.
								</p>
								<Link to="/posts-feed" className="btn-outline-auth">
									Explore Posts
									<ArrowRight size={16} />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Groups and Events - Auto Carousel */}
			<section className="content-section">
				<div className="container">
					<div className="content-grid">
						{/* Groups Carousel */}
						<div className="carousel-container">
							<div className="carousel-header">
								<h3 className="carousel-title">
									<Users size={24} />
									{userGroups.length > 0 ? "Your Groups" : "Support Groups"}
								</h3>
								{displayGroups.length > 1 && (
									<div className="carousel-controls">
										<button onClick={handleGroupPrev} className="carousel-btn">
											<ChevronLeft size={20} />
										</button>
										<span className="carousel-indicator">
											{currentGroupIndex + 1} of {displayGroups.length}
										</span>
										<button onClick={handleGroupNext} className="carousel-btn">
											<ChevronRight size={20} />
										</button>
									</div>
								)}
							</div>

							<div className="carousel-content">
								{userGroups.length === 0 ? (
									<EmptyGroupsState />
								) : (
									<>
										<div
											className="carousel-track"
											style={{
												transform: `translateX(-${currentGroupIndex * 100}%)`,
											}}
										>
											{displayGroups.map((group) => (
												<div key={group.id} className="carousel-item">
													<Link
														to={`/groups/${group.id}`}
														className="content-card glow-card"
													>
														<div className="card-image">
															<img src={group.image} alt={group.name} />
														</div>
														<div className="card-content">
															<h4 className="card-title">{group.name}</h4>
															<p className="card-description">{group.about}</p>
															<div className="card-meta">
																<div className="meta-item">
																	<MapPin size={16} />
																	<span>
																		{group.city}, {group.state}
																	</span>
																</div>
																<div className="meta-item">
																	<Clock size={16} />
																	<span>Meets {group.type}</span>
																</div>
																<div className="meta-item">
																	<UserCheck size={16} />
																	<span>
																		{group.numMembers || "Multiple"} members
																	</span>
																</div>
																<div className="meta-item">
																	<Users size={16} />
																	<span>{group.type} group</span>
																</div>
															</div>
														</div>
													</Link>
												</div>
											))}
										</div>

										{/* Progress indicators */}
										{displayGroups.length > 1 && (
											<div className="carousel-dots">
												{displayGroups.map((_, index) => (
													<button
														key={index}
														className={`carousel-dot ${
															index === currentGroupIndex ? "active" : ""
														}`}
														onClick={() => setCurrentGroupIndex(index)}
													/>
												))}
											</div>
										)}
									</>
								)}
							</div>
						</div>

						{/* Events Carousel */}
						<div className="carousel-container">
							<div className="carousel-header">
								<h3 className="carousel-title">
									<Calendar size={24} />
									{userEvents.length > 0 ? "Your Events" : "Upcoming Events"}
								</h3>
								{displayEvents.length > 1 && (
									<div className="carousel-controls">
										<button onClick={handleEventPrev} className="carousel-btn">
											<ChevronLeft size={20} />
										</button>
										<span className="carousel-indicator">
											{currentEventIndex + 1} of {displayEvents.length}
										</span>
										<button onClick={handleEventNext} className="carousel-btn">
											<ChevronRight size={20} />
										</button>
									</div>
								)}
							</div>

							<div className="carousel-content">
								{userEvents.length === 0 ? (
									<EmptyEventsState />
								) : (
									<>
										<div
											className="carousel-track"
											style={{
												transform: `translateX(-${currentEventIndex * 100}%)`,
											}}
										>
											{displayEvents.map((event) => (
												<div key={event.id} className="carousel-item">
													<Link
														to={`/events/${event.id}`}
														className="content-card glow-card"
													>
														<div className="card-image">
															<img src={event.image} alt={event.name} />
														</div>
														<div className="card-content">
															<h4 className="card-title">{event.name}</h4>
															<p className="card-description">
																{event.description}
															</p>
															<div className="card-meta">
																<div className="meta-item">
																	<Calendar size={16} />
																	<span>{formatDate(event.startDate)}</span>
																</div>
																<div className="meta-item">
																	<Clock size={16} />
																	<span>
																		{formatTime(event.startDate)} -{" "}
																		{formatTime(event.endDate)}
																	</span>
																</div>
																{event.venueInfo && event.venueInfo.address && (
																	<div className="meta-item">
																		<MapPin size={16} />
																		<span>
																			{event.venueInfo.address},{" "}
																			{event.venueInfo.city}
																		</span>
																	</div>
																)}
																<div className="meta-item">
																	<Users size={16} />
																	<span>
																		{event.numAttendees || 0}/
																		{event.capacity || "Unlimited"} attending
																	</span>
																</div>
																<div className="meta-item">
																	<UserIcon size={16} />
																	<span>{event.type} event</span>
																</div>
															</div>
															<div className="card-footer">
																<span className="group-name">
																	by {event.groupInfo.name}
																</span>
															</div>
														</div>
													</Link>
												</div>
											))}
										</div>

										{/* Progress indicators */}
										{displayEvents.length > 1 && (
											<div className="carousel-dots">
												{displayEvents.map((_, index) => (
													<button
														key={index}
														className={`carousel-dot ${
															index === currentEventIndex ? "active" : ""
														}`}
														onClick={() => setCurrentEventIndex(index)}
													/>
												))}
											</div>
										)}
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* 3D Doors Section */}
			<section className="doors-section">
				<div className="container">
					{/* <div className="section-header">
						<h2 className="section-title">Choose Your Path</h2>
						<p className="section-subtitle">
							Step through the doors to explore different aspects of your mental
							health journey
						</p>
					</div> */}
					<div className="section-header">
						<h2 className="section-title">Choose Your Path</h2>
					</div>
					<div className="connect-description" style={{ marginBottom: `55px` }}>
						<p className="section-subtitle">
							Step through the doors to explore different aspects of your mental
							health journey
						</p>
					</div>
					<div className="doors-container">
						<div className="door-wrapper">
							<Link to="/groups" className="door-card groups-door">
								<div className="door-frame">
									<div className="door-panel">
										<div className="door-handle"></div>
										<div className="door-content">
											<Users size={48} />
											<h3>Support Groups</h3>
											<p>Find your community</p>
										</div>
									</div>
								</div>
								<div className="door-glow groups-glow"></div>
							</Link>
						</div>

						<div className="door-wrapper">
							<Link to="/events" className="door-card events-door">
								<div className="door-frame">
									<div className="door-panel">
										<div className="door-handle"></div>
										<div className="door-content">
											<Calendar size={48} />
											<h3>Events</h3>
											<p>Join activities</p>
										</div>
									</div>
								</div>
								<div className="door-glow events-glow"></div>
							</Link>
						</div>

						<div className="door-wrapper">
							<Link to="/posts/create" className="door-card stories-door">
								<div className="door-frame">
									<div className="door-panel">
										<div className="door-handle"></div>
										<div className="door-content">
											<PenTool size={48} />
											<h3>Share Story</h3>
											<p>Tell your journey</p>
										</div>
									</div>
								</div>
								<div className="door-glow stories-glow"></div>
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default AuthHome;
