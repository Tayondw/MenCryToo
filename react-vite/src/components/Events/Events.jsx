import { useLoaderData, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Footer from "../Footer";
import "./Events.css";

const Events = () => {
	const { allEvents } = useLoaderData();
	const sessionUser = useSelector((state) => state.session.user);
      if (!allEvents || !allEvents.events) return <p>No events available.</p>;
      
      console.log(allEvents.events);
      
	
	return (
		<div id="events-body">
			<div id="groups-link-holder">
				<Link to="/groups" id="group-link">
					{"< "}Groups
				</Link>
				{sessionUser   ? (
					<Link to="/events/new" id="group-link">
						Create An Event{" >"}
					</Link>
				) : (
					<Link className="disabled" to="/events/new">
						Create An Event{" >"}
					</Link>
				)}
			</div>
			<div id="events-body-header">
				<h3>See what each group does to help each other</h3>
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
			<Footer />
		</div>
	);
};

export default Events;
