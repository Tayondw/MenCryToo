import { useLoaderData, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import OpenModalButton from "../../OpenModalButton";
import GroupImage from "../Images";
import DeleteGroup from "../CRUD/Delete";
import "./GroupDetails.css";

const GroupDetails = () => {
	const groupDetails = useLoaderData();
	const navigate = useNavigate();
	const sessionUser = useSelector((state) => state.session.user);

	const today = new Date();
	const formatDate = (startDate) => {
		const date = new Date(startDate);

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");

		return `${year}-${month}-${day} • ${hours}:${minutes}`;
	};

	const upcomingEvents = groupDetails.events.filter(
		(event) => new Date(event.startDate) >= today,
	);
	const pastEvents = groupDetails.events.filter(
		(event) => new Date(event.startDate) < today,
	);

	upcomingEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
	pastEvents.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

	const formatEventDate = (events) =>
		events.map((event) => ({
			...event,
			startDate: formatDate(event.startDate),
		}));

	const formattedUpcomingEvents = formatEventDate(upcomingEvents);
	const formattedPastEvents = formatEventDate(pastEvents);

	console.log("group details", groupDetails);

	return (
		<div id="groups-details">
			<div id="groups-link-holder">
				{"< "}
				<Link to="/groups" id="group-link">
					Groups
				</Link>
			</div>

			{groupDetails && (
				<div id="each-groupDetail">
					<div id="top-each-groupDetail">
						<div id="groupDetailImage">
							{groupDetails.groupImage.map((groupImage) => (
								<img
									src={groupImage.groupImage}
									alt={groupDetails.name}
									key={groupImage.id}
								/>
							))}
						</div>
						<div id="groupDetailInfo">
							<h2 id="groupDetailName" className="add-padding">
								{groupDetails.name}
							</h2>
							<h4
								id="groupDetailLocation"
								className="add-padding"
							>{`${groupDetails.city}, ${groupDetails.state}`}</h4>
							{groupDetails.events.length > 1 ? (
								<p id="groupDetailPrivacy" className="add-padding">
									{`${groupDetails.events.length} events • `}{" "}
									{groupDetails.type ? "online" : "in-person"}
								</p>
							) : (
								<p id="groupDetailPrivacy" className="add-padding">
									{`${groupDetails.events.length} event • `}
									{groupDetails.type ? "online" : "in-person"}
								</p>
							)}
							<p id="groupDetailOrganizer">
								Organized by{" "}
								{`${groupDetails.organizer.firstName} ${groupDetails.organizer.lastName}`}
							</p>
							{!sessionUser ||
							sessionUser.id === groupDetails.organizerId ? null : (
								<div id="join">
									<button
										className="revoke"
										onClick={(event) => {
											event.preventDefault();
											alert("Feature Coming Soon...");
										}}
										style={{
											backgroundColor: "red",
											width: `250px`,
											cursor: `pointer`,
											borderRadius: `40px`,
											padding: `12px 25px`,
											fontSize: `1em`,
										}}
									>
										Join this group
									</button>
								</div>
							)}
							{sessionUser && sessionUser.id === groupDetails.organizerId ? (
								<div id="crud-buttons">
									<div id="crud-buttons-create">
										<button
											onClick={() =>
												navigate(`/groups/${groupDetails.id}/events`)
											}
											style={{ backgroundColor: `gray`, color: `#FAF5E4` }}
										>
											Create event
										</button>
									</div>
									<div id="crud-buttons-update">
										<button
											onClick={() =>
												navigate(`/groups/${groupDetails.id}/edit`)
											}
											style={{ backgroundColor: `gray`, color: `#FAF5E4` }}
										>
											Update
										</button>
									</div>
									<div id="crud-buttons-update-image">
										{!groupDetails.groupImage.length ? (
											<div id="crud-buttons-delete">
												<OpenModalButton
													groupDetails={groupDetails}
													className="group-image-button"
													id="add-group-image"
													buttonText="Add Group Image"
													style={{ backgroundColor: "gray", color: `#FAF5E4` }}
													modalComponent={
														<GroupImage groupDetails={groupDetails} />
													}
												/>
											</div>
										) : (
											groupDetails.groupImage.map((groupImage) => (
												<button
													key={groupImage.id}
													onClick={() =>
														navigate(
															`/groups/${groupDetails.id}/images/${groupImage.id}/edit`,
														)
													}
													style={{ backgroundColor: `gray`, color: `#FAF5E4` }}
												>
													Update Image
												</button>
											))
										)}
									</div>
									<div id="crud-buttons-delete">
										<OpenModalButton
											groupDetails={groupDetails}
											navigate={navigate}
											className="group-delete-button"
											id="delete-group"
											buttonText="Delete"
											style={{ backgroundColor: "gray", color: `#FAF5E4` }}
											modalComponent={
												<DeleteGroup
													groupDetails={groupDetails}
													navigate={navigate}
												/>
											}
										/>
									</div>
								</div>
							) : null}
						</div>
					</div>
					<div id="body-page">
						<div id="organizer">
							<h3 className="groupDetail-h3">Organizer</h3>
							<p className="groupDetail-desc-p">{`${groupDetails.organizer.firstName} ${groupDetails.organizer.lastName}`}</p>
						</div>
						<div id="groupDetail-about">
							<h3 className="groupDetail-h3">What we&apos;re about</h3>
							<p className="groupDetail-desc-p"> {groupDetails.about}</p>
						</div>
						<div id="events-section">
							<div id="upcoming-events">
								{!upcomingEvents.length ? (
									<h3 className="groupDetail-h3">No Upcoming Events</h3>
								) : (
									<div id="event-list-upcoming">
										<h3 className="groupDetail-h3">
											Upcoming Events ({upcomingEvents.length})
										</h3>
										{formattedUpcomingEvents.map((event) => (
											<div id="all-event-item" key={event.id}>
												<div
													className="event-item"
													onClick={() => navigate(`/events/${event.id}`)}
												>
													{event.eventImage.map((eventImage) => (
														<img
															src={eventImage.eventImage}
															alt={event.name}
															key={eventImage.id}
														/>
													))}
													<div className="event-item-dates">
														<p className="event-item-dates-p">
															{event.startDate}
														</p>
														<h4 className="event-item-name-h4">{event.name}</h4>
														{event.venueInfo ? (
															<p className="event-item-dates-venue">{`${event.venueInfo.city}, ${event.venueInfo.state}`}</p>
														) : (
															<p className="event-item-dates-venue">Online</p>
														)}
													</div>
												</div>
												<div className="event-desc-group">
													{event.description}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
							<div id="past-events">
								{!pastEvents.length ? (
									<h3 className="groupDetail-h3">No Past Events</h3>
								) : (
									<div id="event-list-past">
										<h3 className="groupDetail-h3">
											Past Events ({pastEvents.length})
										</h3>
										{formattedPastEvents.map((event) => (
											<>
												<div
													key={event.id}
													className="event-item"
													onClick={() => navigate(`/events/${event.id}`)}
												>
													{event.eventImage.map((eventImage) => (
														<img
															src={eventImage.eventImage}
															alt={event.name}
															key={eventImage.id}
														/>
													))}
													<div className="event-item-dates">
														<p className="event-item-dates-p">
															{event.startDate}
														</p>
														<h4 className="event-item-name-h4">{event.name}</h4>
														{event.venueInfo ? (
															<p className="event-item-dates-venue">{`${event.venueInfo.city}, ${event.venueInfo.state}`}</p>
														) : (
															<p className="event-item-dates-venue">Online</p>
														)}
													</div>
												</div>
												<div className="event-desc-group">
													{event.description}
												</div>
											</>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default GroupDetails;
