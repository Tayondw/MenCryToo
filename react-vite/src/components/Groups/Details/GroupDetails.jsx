import { useLoaderData, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import OpenModalButton from "../../OpenModalButton";
import { useModal } from "../../../context/Modal";
import GroupImage from "../Images";
import EditGroupImage from "../Images/EditGroupImage";
import DeleteGroup from "../CRUD/Delete";
import Footer from "../../Footer";
import "./GroupDetails.css";

const GroupDetails = () => {
	const groupDetails = useLoaderData();
	const navigate = useNavigate();
	const sessionUser = useSelector((state) => state.session.user);
	const { closeModal } = useModal();

	useEffect(() => {
		if (!groupDetails.id) navigate("/groups");
	}, [groupDetails, navigate]);

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

	const upcomingEvents = groupDetails?.events.filter(
		(event) => new Date(event.startDate) >= today,
	);
	const pastEvents = groupDetails?.events.filter(
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
		<>
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
								<img src={groupDetails.image} alt={groupDetails.name} />
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
										{`${groupDetails.events.length} events • `}
										{groupDetails.type === "online" ? "online" : "in-person"}
									</p>
								) : (
									<p id="groupDetailPrivacy" className="add-padding">
										{`${groupDetails.events.length} event • `}
										{groupDetails.type === "online" ? "online" : "in-person"}
									</p>
								)}
								{groupDetails.organizer.firstName &&
								groupDetails.organizer.lastName ? (
									<p id="groupDetailOrganizer">
										Organized by{" "}
										{`${groupDetails.organizer.firstName} ${groupDetails.organizer.lastName}`}
									</p>
								) : (
									<p>Currently there is no organizer for this group</p>
								)}

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
													navigate(`/groups/${groupDetails.id}/events/new`)
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
														onClose={closeModal}
														className="group-image-button"
														id="add-group-image"
														buttonText="Add Group Image"
														style={{
															backgroundColor: "gray",
															color: `#FAF5E4`,
														}}
														modalComponent={
															<GroupImage
																groupDetails={groupDetails}
																onClose={closeModal}
															/>
														}
													/>
												</div>
											) : (
												groupDetails.groupImage.map((groupImage) => (
													<div id="crud-buttons-delete" key={groupImage.id}>
														<OpenModalButton
															groupDetails={groupDetails}
															groupImageId={groupImage.id}
															onClose={closeModal}
															className="group-image-button"
															id="add-group-image"
															buttonText="Update Group Image"
															style={{
																backgroundColor: "gray",
																color: `#FAF5E4`,
															}}
															modalComponent={
																<EditGroupImage
																	groupDetails={groupDetails}
																	groupImageId={groupImage.id}
																	onClose={closeModal}
																/>
															}
														/>
													</div>
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
							<div id="events-section">
								<div id="upcoming-events">
									{!upcomingEvents.length ? (
										<h3 className="groupDetail-h3">No Upcoming Events</h3>
									) : (
										<>
											<h3 className="groupDetail-h3">
												Upcoming Events ({upcomingEvents.length})
											</h3>
											<div id="event-list-upcoming" className="event-list">
												{formattedUpcomingEvents.map((event) => (
													<div key={event.id} className="event-card">
														<div
															className="event-item"
															onClick={() => navigate(`/events/${event.id}`)}
														>
															<img
																src={event.image}
																alt={event.name}
																className="event-image"
															/>

															<div className="event-item-dates">
																<p className="event-item-dates-p">
																	{event.startDate}
																</p>
																<h4 className="event-item-name-h4">
																	{event.name}
																</h4>
																{event?.venueInfo ? (
																	<p className="event-item-dates-venue">
																		{event.venueInfo.city ? (
																			<p>
																				{event.venueInfo.city},{" "}
																				{event.venueInfo.state}
																			</p>
																		) : (
																			<p>Currently there is no venue </p>
																		)}
																	</p>
																) : (
																	<p className="event-item-dates-venue">
																		Online
																	</p>
																)}
															</div>
														</div>
														<div className="event-desc-group">
															{event.description}
														</div>
													</div>
												))}
											</div>
										</>
									)}
								</div>
								<div id="past-events">
									{!pastEvents.length ? (
										<h3 className="groupDetail-h3">No Past Events</h3>
									) : (
										<>
											<h3 className="groupDetail-h3">
												Past Events ({pastEvents.length})
											</h3>
											<div id="event-list-past" className="event-list">
												{formattedPastEvents.map((event) => (
													<div key={event.id} className="event-card">
														<div
															className="event-item"
															onClick={() => navigate(`/events/${event.id}`)}
														>
															{event.eventImage.map((eventImage) => (
																<img
																	src={eventImage.eventImage}
																	alt={event.name}
																	key={eventImage.id}
																	className="event-image"
																/>
															))}
															<div className="event-item-dates">
																<p className="event-item-dates-p">
																	{event.startDate}
																</p>
																<h4 className="event-item-name-h4">
																	{event.name}
																</h4>
																{event?.venueInfo ? (
																	<p className="event-item-dates-venue">
																		{`${event.venueInfo.city}, ${event.venueInfo.state}`}
																	</p>
																) : (
																	<p className="event-item-dates-venue">
																		Online
																	</p>
																)}
															</div>
														</div>
														<div className="event-desc-group">
															{event.description}
														</div>
													</div>
												))}
											</div>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
			<Footer />
		</>
	);
};

export default GroupDetails;
