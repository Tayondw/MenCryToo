import { useLoaderData, Link } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { useState } from "react";
import Footer from "../Footer";
import "./Events.css";

const Events = () => {
	const { allEvents } = useLoaderData();
	// const sessionUser = useSelector((state) => state.session.user);
	// const [currentIndex, setCurrentIndex] = useState(0);

	if (!allEvents || !allEvents.events) {
		return <p>No events available.</p>;
	}

	// const handlePrevClick = () => {
	// 	setCurrentIndex(
	// 		currentIndex > 0 ? currentIndex - 1 : allEvents.events.length - 1,
	// 	);
	// };

	// const handleNextClick = () => {
	// 	setCurrentIndex(
	// 		currentIndex < allEvents.events.length - 1 ? currentIndex + 1 : 0,
	// 	);
	// };

	return (
		<div id="events-body">
			<div id="events-body-header">
				<h1>See what each group does to help each other</h1>
                  </div>
                  <div id="events">

                  
			{allEvents.events.length > 0 ? (
				allEvents.events.map((event) => (
					<Link
						key={event.id}
						to={`/events/${event.id}`}
						style={{ textDecoration: `none`, color: `inherit` }}
					>
						<div className="event-cards">
							<img src={event.eventImage[0].eventImage} alt={event.name} />
							<div id="display-style-direction">
								<div>
									<h2>{event.name}</h2>
									<h3>{event.description}</h3>
								</div>
								<ul className="event-stats">
									<li>
										<var>{event.numAttendees}</var>
										<label>Attendees</label>
									</li>
									<li>
										<var>{event.capacity}</var>
										<label>Capacity</label>
									</li>
									<li>
										<var>{event.type}</var>
										<label>Type</label>
									</li>
									<li>
										<var>{new Date(event.startDate).toLocaleString()}</var>
										<label>Start Date</label>
									</li>
									<li>
										<var>{new Date(event.endDate).toLocaleString()}</var>
										<label>End Date</label>
									</li>
								</ul>
							</div>
						</div>
					</Link>
				))
			) : (
				<p>
					Currently no events available. You will see something after you add an
					event
				</p>
                        )}
                  </div>
			{/* <div id="events">
				<h1>See what each group does to help each other</h1>
				{allEvents.events.map((event) => (
					<div
						id="each-event"
						key={event.id}
						className={`mencrytoo-carousel-item ${
							event.id === allEvents.events[currentIndex].id ? "active" : ""
						}`}
						style={{
							display:
								event.id === allEvents.events[currentIndex].id
									? "flex"
									: "none",
						}}
					>
						<Link
							to={`/events/${event.id}`}
							style={{ textDecoration: `none`, color: `inherit` }}
						>
							{event.eventImage.map((image) => (
								<img
									src={image.eventImage}
									alt={`${event.name} event image`}
									key={image.id}
									width={300}
									height={200}
									className="carousel-image"
								/>
							))}
							<div className="event-content">
								<h3>{event.name}</h3>
								<p>{event.description}</p>
								<p>
									Location: {event.venueInfo.address} {event.venueInfo.city},{" "}
									{event.venueInfo.state}
								</p>
								<p>Belongs to: {event.groupInfo.name}</p>
								<p>This event typically meets {event.type}</p>
								<p>Start: {event.startDate}</p>
								<p>End: {event.endDate}</p>
							</div>

							{sessionUser && sessionUser.profileImage && (
								<>
									<div>
										<p>See where the events like to go:</p>
										{event.venues &&
											event.venues.map((venue) => (
												<div id="venue-event" key={venue.id}>
													{venue.address} {venue.city}, {venue.state}{" "}
													{venue.zipCode}
												</div>
											))}
									</div>
									<div>
										<p>
											Meet the organizer: {event.organizer.firstName}{" "}
											{event.organizer.lastName}
										</p>
										<p>Contact: {event.organizer.email}</p>
										<p>Bio: {event.organizer.bio}</p>
										{event.organizerInfo.profileImage && (
											<img src={event.organizer.profileImage} alt="Organizer" />
										)}
									</div>
								</>
							)}
						</Link>

						<div id="carousel-navigation">
							<button className="nav-button prev" onClick={handlePrevClick}>
								◀
							</button>
							<span className="nav-indicator">{`${currentIndex + 1} of ${
								allEvents.events.length
							}`}</span>
							<button className="nav-button next" onClick={handleNextClick}>
								▶
							</button>
						</div>
					</div>
				))}
			</div> */}
			<Footer />
		</div>
	);
};

export default Events;
