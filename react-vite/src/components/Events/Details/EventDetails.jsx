import { useState } from "react";
import { Link } from "react-router-dom";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaRegClock } from "react-icons/fa";
import { GrLocationPin } from "react-icons/gr";
import OpenModalButton from "../../OpenModalButton";
import { useModal } from "../../../context/Modal";
import EventImage from "../Images";
import DeleteEvent from "../CRUD/Delete/DeleteEvent";
import "./EventDetails.css";

const EventDetails = () => {
	const eventDetails = useLoaderData();
	const sessionUser = useSelector((state) => state.session.user);
	const navigate = useNavigate();
	const [activeSection, setActiveSection] = useState("Images"); // State to track the active section
	const { closeModal } = useModal();
	if (!eventDetails) return <div>Event not found</div>;
	const currentDate = new Date();
	const renderContent = () => {
		switch (activeSection) {
			case "Images":
				return eventDetails.eventImage.length > 0 ? (
					<div id="second-half-main-group-details">
						<h3>
							Check out the event&apos;s images - click on an image to see its
							details
						</h3>
						<div id="group-details-images">
							{eventDetails.eventImage.map((image) => (
								<Link
									key={image.id}
									className="box"
									style={{ cursor: `default` }}
								>
									<img src={image.eventImage} alt={image.name} />
								</Link>
							))}
						</div>
					</div>
				) : (
					<div id="crud-buttons-update-image">
						<p>
							Currently no images have been uploaded by the group organizer.
						</p>
						{(sessionUser && eventDetails.organizer.id !== sessionUser.id) ||
						!sessionUser ? (
							<div id="events-deets-crud-buttons-delete">
								<p>
									You must be the group organizer to add images to this event
								</p>
								<OpenModalButton
									eventDetails={eventDetails}
									onClose={closeModal}
									className="button disabled"
									id="add-group-image"
									buttonText="Add Images"
									modalComponent={
										<EventImage
											eventDetails={eventDetails}
											onClose={closeModal}
										/>
									}
								/>
							</div>
						) : (
							<div id="crud-buttons-delete">
								<OpenModalButton
									eventDetails={eventDetails}
									onClose={closeModal}
									className="button"
									id="add-group-image"
									buttonText="Add Images"
									style={{ cursor: `pointer` }}
									modalComponent={
										<EventImage
											eventDetails={eventDetails}
											onClose={closeModal}
										/>
									}
								/>
							</div>
						)}
					</div>
				);
			case "Meet the Group":
				return !eventDetails.groupInfo ? (
					<p>Currently no group organizer. Create a group!</p>
				) : (
					<Link
						to={`/groups/${eventDetails.groupInfo.id}`}
						style={{
							textDecoration: `none`,
							color: `inherit`,
						}}
					>
						<div className="meet-group-cards">
							<img
								src={eventDetails.groupInfo.image}
								alt={eventDetails.groupInfo.name}
							/>
							<div id="meet-group-display-style-direction">
								<div id="meet-group-keep-in-style">
									<h2>{eventDetails.groupInfo.name}</h2>
									<h3>{eventDetails.groupInfo.about}</h3>
								</div>
								<ul className="stats">
									<li>
										<var>{eventDetails.groupInfo.city}</var>
										<label>City</label>
									</li>
									<li>
										<var>{eventDetails.groupInfo.state}</var>
										<label>State</label>
									</li>
									<li>
										<var>{eventDetails.groupInfo.type}</var>
										<label>Type</label>
									</li>
								</ul>
							</div>
						</div>
					</Link>
				);
			case "Attendees":
				return eventDetails.attendees.length > 0 ? (
					<div className="members-list">
						{!sessionUser ? (
							<p>You must be a user in order to view attendees to this event</p>
						) : (
							<>
								{eventDetails.attendees.map((attendee) => (
									<Link
										to={`/users/${attendee.user.id}`}
										style={{
											textDecoration: "none",
											color: "inherit",
										}}
										key={attendee.user.id}
									>
										<div className="members-group-cards">
											<img
												src={attendee.user.profileImage}
												alt={attendee.user.username}
											/>
											<div id="members-group-display-style-direction">
												<div id="members-group-keep-in-style">
													<h2>
														{attendee.user.firstName} {attendee.user.lastName}
													</h2>
												</div>
												<ul className="stats">
													<li>
														<var>{attendee.user.username}</var>
														<label>Username</label>
													</li>
													<li>
														<var>{attendee.user.email}</var>
														<label>Email</label>
													</li>
												</ul>
											</div>
										</div>
									</Link>
								))}
							</>
						)}
					</div>
				) : (
					<div id="join">
						<p>
							No attendees in this group yet. Attend to be the first attendee!
						</p>
						{new Date(eventDetails.startDate) < currentDate ? (
							<h3>Event Closed</h3>
						) : (
							<button
								onClick={(event) => {
									event.preventDefault();
									fetch(`/api/events/${eventDetails.id}/attend-event`, {
										method: "POST",
										headers: {
											"Content-Type": "application/json",
										},
										body: JSON.stringify({
											event_id: eventDetails.id,
											user_id: sessionUser.id,
										}),
									})
										.then((response) => {
											if (response.ok) {
												return response.json();
											}
											throw new Error("Network response was not ok.");
										})
										.then(() => {
											// Handle the redirect or update the UI as needed
											window.location.href = `/groups/${eventDetails.id}`;
										})
										.catch((error) => {
											console.error(
												"There was a problem with the fetch operation:",
												error,
											);
										});
								}}
								name="intent"
								value="attend-event"
								className="button"
								style={{ cursor: `pointer` }}
							>
								Attend Event
							</button>
						)}
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div id="events-details-page">
			<div id="events-details">
				<main>
					{"< "}
					<Link to="/events" id="event-link">
						Events
					</Link>
					<div id="event-section-1">
						<div id="events-details-image">
							<img
								src={eventDetails.image}
								alt={eventDetails?.name || "Event"}
							/>
						</div>
						<div id="mix-event-group">
							<div id="eventDetailInfo">
								<h2 id="eventDetailName" className="add-padding">
									{eventDetails.name}
								</h2>
								<h3 id="eventDetailDesc">{eventDetails.description}</h3>
							</div>
							<div id="event-event">
								<div id="events-details-date">
									<FaRegClock className="events-details-clock" />
									<div>
										<p>
											START{" "}
											<p style={{ color: "teal", paddingRight: `15px` }}>
												{" "}
												{new Date(eventDetails.startDate).toLocaleString()}
											</p>
											END{" "}
											<p style={{ color: "teal" }}>
												{new Date(eventDetails.endDate).toLocaleString()}
											</p>
										</p>
									</div>
								</div>
								<div id="events-details-location">
									<GrLocationPin className="events-details-location" />
									<div>
										{!eventDetails.venueInfo.address ? (
											<p>Currently no venue has been selected</p>
										) : (
											<p style={{ marginLeft: `5px` }}>
												{eventDetails.venueInfo.address}{" "}
												{eventDetails.venueInfo.city},{" "}
												{eventDetails.venueInfo.state}
											</p>
										)}
									</div>
								</div>
								<div id="event-details-type">
									<p>Type: {eventDetails.type}</p>
									<p>Capacity: {eventDetails.capacity}</p>
								</div>
							</div>
							<div id="events-update-delete">
								{new Date(eventDetails.startDate) < currentDate ? (
									<h3>Event Closed</h3>
								) : (
									<>
										{!sessionUser ? (
											<div id="join">
												<p>
													You must have an account in order to attend this event
												</p>
												<button
													onClick={(event) => {
														event.preventDefault();
														// Redirect to signup page with the return URL
														navigate("/signup", {
															state: {
																from: `/events/${eventDetails.id}`,
																eventId: eventDetails.id,
															},
														});
													}}
													className="button"
													style={{ cursor: "pointer" }}
												>
													Attend Event
												</button>
											</div>
										) : (
											<>
												{sessionUser.id !== eventDetails.organizer.id ? (
													// If the sessionUser is not the organizer
													<>
														{new Date(eventDetails.startDate) < currentDate ? (
															<h3>Event Closed</h3>
														) : (
															<>
																{eventDetails.attendees.some(
																	(attendee) =>
																		attendee.user.id === sessionUser.id,
																) ? (
																	// If the sessionUser is already an attendee
																	<div id="join">
																		<button
																			onClick={(event) => {
																				event.preventDefault();
																				fetch(
																					`/api/events/${eventDetails.id}/leave-event/${sessionUser.id}`,
																					{
																						method: "DELETE",
																					},
																				)
																					.then((response) => {
																						if (response.ok) {
																							return response.json();
																						}
																						throw new Error(
																							"Network response was not ok.",
																						);
																					})
																					.then(() => {
																						// Handle the redirect or update the UI as needed
																						window.location.href = `/events/${eventDetails.id}`;
																					})
																					.catch((error) => {
																						console.error(
																							"There was a problem with the fetch operation:",
																							error,
																						);
																					});
																			}}
																			name="intent"
																			value="leave-event"
																			style={{
																				backgroundColor: "red",
																				width: `250px`,
																				cursor: `pointer`,
																				borderRadius: `40px`,
																				padding: `12px 25px`,
																				fontSize: `1em`,
																			}}
																		>
																			Leave Event
																		</button>
																	</div>
																) : (
																	// If the sessionUser is not an attendee
																	<div id="join">
																		<button
																			onClick={(event) => {
																				event.preventDefault();
																				fetch(
																					`/api/events/${eventDetails.id}/attend-event`,
																					{
																						method: "POST",
																						headers: {
																							"Content-Type":
																								"application/json",
																						},
																						body: JSON.stringify({
																							event_id: eventDetails.id,
																							user_id: sessionUser.id,
																						}),
																					},
																				)
																					.then((response) => {
																						if (response.ok) {
																							return response.json();
																						}
																						throw new Error(
																							"Network response was not ok.",
																						);
																					})
																					.then(() => {
																						// Handle the redirect or update the UI as needed
																						window.location.href = `/events/${eventDetails.id}`;
																					})
																					.catch((error) => {
																						console.error(
																							"There was a problem with the fetch operation:",
																							error,
																						);
																					});
																			}}
																			name="intent"
																			value="attend-event"
																			className={"button"}
																			style={{ cursor: `pointer` }}
																		>
																			Attend Event
																		</button>
																	</div>
																)}
															</>
														)}
													</>
												) : null}
											</>
										)}
									</>
								)}

								{sessionUser &&
								eventDetails.organizer &&
								sessionUser.id === eventDetails.organizer.id ? (
									<>
										{new Date(eventDetails.startDate) < currentDate ? (
											null
										) : (
											<>
												<div id="crud-buttons-update">
													<button
														className="button"
														onClick={() => {
															navigate(
																`/groups/${eventDetails.groupId}/events/${eventDetails.id}`,
															);
														}}
													>
														Update Event
													</button>
												</div>
												<div id="crud-buttons-update-image">
													<OpenModalButton
														eventDetails={eventDetails}
														className="button"
														id="add-group-image"
														buttonText="Add Images"
														onClose={closeModal}
														modalComponent={
															<EventImage
																eventDetails={eventDetails}
																onClose={closeModal}
															/>
														}
													/>
												</div>
												<div id="crud-buttons-delete">
													<OpenModalButton
														eventDetails={eventDetails}
														className="button"
														id="delete-group"
														buttonText="Delete Event"
														style={{
															backgroundColor: `red`,
															color: `#dddddc`,
															cursor: `pointer`,
														}}
														modalComponent={
															<DeleteEvent eventDetails={eventDetails} />
														}
													/>
												</div>
											</>
										)}
									</>
								) : null}
							</div>
						</div>
					</div>
				</main>
				<aside id="event-body-page">
					<div id="events-section-details">
						<h3>Group Organizer</h3>
						<Link
							to={`/users/${eventDetails.organizer.id}`}
							style={{
								textDecoration: `none`,
								color: `inherit`,
							}}
						>
							<div className="event-details-card">
								<img
									className="event-details-card-img"
									src={eventDetails.organizer.profileImage}
									alt={eventDetails.organizer.username}
								/>
								<div id="event-display-style-direction">
									<div id="event-keep-in-style">
										<h2>
											{eventDetails.organizer.firstName}{" "}
											{eventDetails.organizer.lastName}
										</h2>
									</div>
									<ul className="stats">
										<li>
											<var>{eventDetails.organizer.username}</var>
											<label>Username</label>
										</li>
										<li>
											<var>{eventDetails.organizer.email}</var>
											<label>Email</label>
										</li>
									</ul>
								</div>
							</div>
						</Link>
					</div>
				</aside>
			</div>
			<div id="second-half-group-details">
				<div className="second-half-headers-groups">
					{activeSection !== "Images" ? (
						<h1 onClick={() => setActiveSection("Images")}>IMAGES</h1>
					) : (
						<h1
							onClick={() => setActiveSection("Images")}
							style={{ color: `var(--peach)` }}
						>
							IMAGES
						</h1>
					)}
					{activeSection !== "Meet the Group" ? (
						<h1 onClick={() => setActiveSection("Meet the Group")}>
							MEET THE GROUP
						</h1>
					) : (
						<h1
							onClick={() => setActiveSection("Meet the Group")}
							style={{ color: `var(--peach)` }}
						>
							MEET THE GROUP
						</h1>
					)}
					{activeSection !== "Attendees" ? (
						<h1 onClick={() => setActiveSection("Attendees")}>ATTENDEES</h1>
					) : (
						<h1
							onClick={() => setActiveSection("Attendees")}
							style={{ color: `var(--peach)` }}
						>
							ATTENDEES
						</h1>
					)}
				</div>
				<div id="render-content">{renderContent()}</div>
			</div>
		</div>
	);
};

export default EventDetails;
