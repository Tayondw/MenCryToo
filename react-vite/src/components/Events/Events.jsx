import { useLoaderData, Link } from "react-router-dom";
import "./Events.css";

const Events = () => {
	const { allEvents } = useLoaderData();
      if (!allEvents || !allEvents.events) return <p>No events available.</p>;
	const formatDate = (startDate) => {
		const date = new Date(startDate);
		const year = date.getUTCFullYear();
		const month = String(date.getUTCMonth() + 1).padStart(2, "0");
		const day = String(date.getUTCDate()).padStart(2, "0");
		const hours = String(date.getUTCHours()).padStart(2, "0");
		const minutes = String(date.getUTCMinutes()).padStart(2, "0");
		const seconds = String(date.getUTCSeconds()).padStart(2, "0");
		return `${year}-${month}-${day} • ${hours}:${minutes}:${seconds}`;
	};
	const formatEventDate = allEvents.events.map((event) => {
		return {
			...event,
			formattedDate: formatDate(event.startDate),
		};
	});
	const currentDate = new Date();
	const upcomingEvents = formatEventDate
		.filter((event) => new Date(event.startDate) >= currentDate)
		.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
	const pastEvents = formatEventDate
		.filter((event) => new Date(event.startDate) < currentDate)
		.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
	const sortedEvents = [...upcomingEvents, ...pastEvents];

	return (
		<div id="events-body">
			<div id="groups-link-holder">
				<Link to="/groups" id="group-link">
					{"< "}Groups
				</Link>
			</div>
			<div id="events-body-header">
				<h3>See what each group does to help each other</h3>
			</div>
			<div id="events">
				{allEvents.events.length > 0 ? (
					sortedEvents.map((event, index) => (
						<Link
							key={event.id}
							to={`/events/${event.id}`}
							style={{ textDecoration: `none`, color: `inherit` }}
						>
							<div className="event-cards" key={index}>
								<img src={event.image} alt={event.name} />

								<div id="display-style-direction">
									<div id="keep-in-style">
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
						Currently no events available. You will see something after you add
						an event
					</p>
				)}
			</div>
		</div>
	);
};

export default Events;
