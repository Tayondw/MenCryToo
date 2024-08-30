import { useLoaderData, Link } from "react-router-dom";
import { useState } from "react";
import { useSelector } from "react-redux";
import { HeroSection } from "../NotAuthHome/NotAuthHome";
import NotAuthHome from "../NotAuthHome/NotAuthHome";
import "./AuthHome.css";

const AuthHome = () => {
	const { allGroups } = useLoaderData();
	const { allEvents } = useLoaderData();
	const sessionUser = useSelector((state) => state.session.user);
	const [currentGroupIndex, setGroupCurrentIndex] = useState(0);
	const [currentEventIndex, setEventCurrentIndex] = useState(0);

	const groups = allGroups.groups.find(
		(group) => group.organizer.id === sessionUser.id,
	);
	const events = allEvents.events.find(
		(event) => event.attendees.user_id === sessionUser.id,
	);

	// add logic in return that if there are no groups or events the render create an event or create a group

	const handleGroupPrevClick = () => {
		setGroupCurrentIndex(
			currentGroupIndex > 0
				? currentGroupIndex - 1
				: allGroups.groups.length - 1,
		);
	};

	const handleGroupNextClick = () => {
		setGroupCurrentIndex(
			currentGroupIndex < allGroups.groups.length - 1
				? currentGroupIndex + 1
				: 0,
		);
	};

	const handleEventPrevClick = () => {
		setEventCurrentIndex(
			currentEventIndex > 0
				? currentEventIndex - 1
				: allEvents.events.length - 1,
		);
	};

	const handleEventNextClick = () => {
		setEventCurrentIndex(
			currentEventIndex < allEvents.events.length - 1
				? currentEventIndex + 1
				: 0,
		);
	};

	return (
		<div id="auth-home">
			{sessionUser ? (
				<>
					<div id="auth-hero-section">
						<HeroSection />
					</div>
					<div id="create-profile">
						<div id="create-profile-header">
							<h2>CONNECT WITH OTHERS</h2>
							<h4>
								A better way to connect with others is to create a profile and
								let others get to know who you are and allow you to better find
								others who are like you
							</h4>
						</div>
						<div id="create-profile-button">
							<Link to={`/users/${sessionUser.id}/profile/create`}>
								<button className="button">CREATE PROFILE</button>
							</Link>
						</div>
					</div>
					<div id="auth-groups-events">
						<div id="auth-groups-carousel">
							{allGroups.groups.map((group) => (
								<div
									id="each-group-carousel"
									key={group.id}
									className={`group-mencrytoo-carousel-item ${
										group.id === allGroups.groups[currentGroupIndex].id
											? "active"
											: ""
									}`}
									style={{
										display:
											group.id === allGroups.groups[currentGroupIndex].id
												? "flex"
												: "none",
									}}
								>
									<h1>GROUPS</h1>
									<div id="group-carousel">
										{group.groupImage.map((image) => (
											<img
												src={image.groupImage}
												key={image.id}
												alt={`${group.name} group image`}
												width={200}
												height={200}
												className="group-carousel-image"
											/>
										))}
										<div className="group-content-carousel">
											<h3>{group.name}</h3>
											<p>{group.about}</p>
											<p>
												Base Location: {group.city}, {group.state}
											</p>
											<p>This group typically meets {group.type}</p>
										</div>
									</div>

									<div id="group-carousel-navigation">
										<button
											className="event-nav-button prev"
											onClick={handleGroupPrevClick}
										>
											◀
										</button>
										<span className="event-nav-indicator">{`${
											currentGroupIndex + 1
										} of ${allGroups.groups.length}`}</span>
										<button
											className="event-nav-button next"
											onClick={handleGroupNextClick}
										>
											▶
										</button>
									</div>
								</div>
							))}
						</div>
						<div id="auth-events-carousel">
							{allEvents.events.map((event) => (
								<div
									id="each-event-carousel"
									key={event.id}
									className={`event-mencrytoo-carousel-item ${
										event.id === allEvents.events[currentEventIndex].id
											? "active"
											: ""
									}`}
									style={{
										display:
											event.id === allEvents.events[currentEventIndex].id
												? "flex"
												: "none",
									}}
								>
									<h1>EVENTS</h1>
									<div id="event-carousel">
										{event.eventImage.map((image) => (
											<img
												src={image.eventImage}
												alt={`${event.name} event image`}
												key={image.id}
												width={200}
												height={200}
												className="event-carousel-image"
											/>
										))}
										<div className="event-content-carousel">
											<h3>{event.name}</h3>
											<p>{event.description}</p>
											<p>
												Location: {event.venueInfo.address}{" "}
												{event.venueInfo.city}, {event.venueInfo.state}
											</p>
											<p>Belongs to: {event.groupInfo.name}</p>
											<p>This event typically meets {event.type}</p>
											<p>Start: {event.startDate}</p>
											<p>End: {event.endDate}</p>
										</div>
									</div>

									<div id="event-carousel-navigation">
										<button
											className="event-nav-button prev"
											onClick={handleEventPrevClick}
										>
											◀
										</button>
										<span className="event-nav-indicator">{`${
											currentEventIndex + 1
										} of ${allEvents.events.length}`}</span>
										<button
											className="event-nav-button next"
											onClick={handleEventNextClick}
										>
											▶
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				</>
			) : (
				<NotAuthHome />
			)}
		</div>
	);
};
export default AuthHome;
