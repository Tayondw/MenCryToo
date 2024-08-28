import { useLoaderData, Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";
import "./Events.css";

const Events = () => {
	const { allEvents } = useLoaderData();
	const sessionUser = useSelector((state) => state.session.user);
	const [currentIndex, setCurrentIndex] = useState(0);

	console.log("this is events", allEvents.events);

	if (!allEvents || !allEvents.events) {
		return <p>No events available.</p>;
	}

	const handlePrevClick = () => {
		setCurrentIndex(
			currentIndex > 0 ? currentIndex - 1 : allEvents.events.length - 1,
		);
	};

	const handleNextClick = () => {
		setCurrentIndex(
			currentIndex < allEvents.events.length - 1 ? currentIndex + 1 : 0,
		);
	};

	return (
		<div id="events">
			<h1>See where you fit in!</h1>
			{allEvents.events.map((event) => (
				<div
					id="each-event"
					key={event.id}
					className={`mencrytoo-carousel-item ${
						event.id === allEvents.events[currentIndex].id ? "active" : ""
					}`}
					style={{
						display:
							event.id === allEvents.events[currentIndex].id ? "flex" : "none",
					}}
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
						<p>{event.about}</p>
						<p>
							Base Location: {event.city}, {event.state}
						</p>
						<p>This event typically meets {event.type}</p>
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
								<p>Bio: {event.organizer.bio}</p>
								{event.organizer.profileImage && (
									<img src={event.organizer.profileImage} alt="Organizer" />
								)}
							</div>
						</>
					)}
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
		</div>
	);
};

export default Events;
