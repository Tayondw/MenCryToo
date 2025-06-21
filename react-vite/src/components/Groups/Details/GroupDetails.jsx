import { useLoaderData, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import OpenModalButton from "../../OpenModalButton";
import { useModal } from "../../../context-TSX/Modal";
import GroupImage from "../Images";
import DeleteGroup from "../CRUD/Delete";
import "./GroupDetails.css";

const GroupDetails = () => {
	const groupDetails = useLoaderData();
	const navigate = useNavigate();
	const sessionUser = useSelector((state) => state.session.user);
	const [activeSection, setActiveSection] = useState("Images"); // State to track the active section
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
	const renderContent = () => {
		switch (activeSection) {
			case "Images":
				return groupDetails.groupImage.length > 0 ? (
					<div id="second-half-main-group-details">
						<h3>
							Check out the group&apos;s images - click on an image to see its
							details
						</h3>
						<div id="group-details-images">
							{groupDetails.groupImage.map((image) => (
								<Link
									// to={`/groups/${groupDetails.id}/images/${image.id}`}
									key={image.id}
									className="box"
									style={{ cursor: `default` }}
								>
									<img src={image.groupImage} alt={image.name} />
								</Link>
							))}
						</div>
					</div>
				) : (
					<div id="crud-buttons-update-image">
						<p>
							Currently no images have been uploaded by the group organizer.
						</p>
						{(sessionUser && groupDetails.organizer.id !== sessionUser.id) ||
						!sessionUser ? (
							<div id="crud-buttons-delete">
								<p>
									You must be the group organizer to add images to this group
								</p>
								<OpenModalButton
									groupDetails={groupDetails}
									onClose={closeModal}
									className="button disabled"
									id="add-group-image"
									buttonText="Add Images"
									modalComponent={
										<GroupImage
											groupDetails={groupDetails}
											onClose={closeModal}
										/>
									}
								/>
							</div>
						) : (
							<div id="crud-buttons-delete">
								<OpenModalButton
									groupDetails={groupDetails}
									onClose={closeModal}
									className="button"
									id="add-group-image"
									buttonText="Add Images"
									modalComponent={
										<GroupImage
											groupDetails={groupDetails}
											onClose={closeModal}
										/>
									}
								/>
							</div>
						)}
					</div>
				);
			case "Meet the Organizer":
				return !groupDetails.organizer ? (
					<p>Currently no group organizer. Create a group!</p>
				) : (
					<Link
						to={`/users/${groupDetails.organizer.id}`}
						style={{
							textDecoration: `none`,
							color: `inherit`,
						}}
					>
						<div className="cards">
							<img
								src={groupDetails.organizer.profileImage}
								alt={groupDetails.organizer.username}
							/>
							<div id="display-style-direction">
								<div id="keep-in-style">
									<h2>
										{groupDetails.organizer.firstName}{" "}
										{groupDetails.organizer.lastName}
									</h2>
									<h3>{groupDetails.organizer.bio}</h3>
								</div>
								<ul className="stats">
									<li>
										<var>{groupDetails.organizer.username}</var>
										<label>Username</label>
									</li>
									<li>
										<var>{groupDetails.organizer.email}</var>
										<label>Email</label>
									</li>
								</ul>
							</div>
						</div>
					</Link>
				);
			case "Members":
				return groupDetails.members.length > 0 ? (
					<div className="members-list">
						{!sessionUser ? (
							<p>You must be a user in order to view members of this group</p>
						) : (
							<>
								{groupDetails.members.map((member) => (
									<Link
										to={`/users/${member.user.id}`}
										style={{
											textDecoration: "none",
											color: "inherit",
										}}
										key={member.user.id}
									>
										<div className="members-groups-cards">
											<img
												src={member.user.profileImage}
												alt={member.user.username}
											/>
											<div id="members-groups-display-style-direction">
												<div id="members-groups-keep-in-style">
													<h2>
														{member.user.firstName} {member.user.lastName}
													</h2>
												</div>
												<ul className="stats">
													<li>
														<var>{member.user.username}</var>
														<label>Username</label>
													</li>
													<li>
														<var>{member.user.email}</var>
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
						<p>No members in this group yet. Join to be the first member!</p>
						<button
							onClick={(event) => {
								event.preventDefault();
								fetch(`/api/groups/${groupDetails.id}/join-group`, {
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										group_id: groupDetails.id,
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
										window.location.href = `/groups/${groupDetails.id}`;
									})
									.catch((error) => {
										console.error(
											"There was a problem with the fetch operation:",
											error,
										);
									});
							}}
							name="intent"
							value="join-group"
							className="button"
							style={{ cursor: `pointer` }}
						>
							Join this group
						</button>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div id="group-details-background">
			<div id="groups-link-holder">
				<Link to="/groups" id="group-link">
					{"< "}Groups
				</Link>
				<Link to="/groups/new" id="group-link">
					Create Another Group{" >"}
				</Link>
			</div>

			{groupDetails && (
				<div id="each-groupDetail">
					<main id="top-each-groupDetail">
						<div id="top-group-details">
							<div id="groupDetailImage">
								<img src={groupDetails.image} alt={groupDetails.name} />
							</div>
							<div id="groupDetailInfo">
								<h2 id="groupDetailName" className="add-padding">
									{groupDetails.name}
								</h2>
								<h3>{groupDetails.about}</h3>
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
								{!sessionUser ? (
									<div id="join">
										<p>You must have an account in order to join this group</p>
										<button
											onClick={(event) => {
												event.preventDefault();
												// Redirect to signup page with the return URL
												navigate("/signup", {
													state: {
														from: `/groups/${groupDetails.id}`,
														groupId: groupDetails.id,
													},
												});
											}}
											className="button"
											style={{ cursor: "pointer" }}
										>
											Join this group
										</button>
									</div>
								) : (
									<>
										{sessionUser.id !== groupDetails.organizerId ? (
											// If the sessionUser is not the organizer
											<>
												{groupDetails.members.some(
													(member) => member.user.id === sessionUser.id,
												) ? (
													// If the sessionUser is already a member
													<div id="join">
														<button
															onClick={(event) => {
																event.preventDefault();
																fetch(
																	`/api/groups/${groupDetails.id}/leave-group/${sessionUser.id}`,
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
																		window.location.href = `/groups/${groupDetails.id}`;
																	})
																	.catch((error) => {
																		console.error(
																			"There was a problem with the fetch operation:",
																			error,
																		);
																	});
															}}
															name="intent"
															value="leave-group"
															style={{
																backgroundColor: "red",
																width: `250px`,
																cursor: `pointer`,
																borderRadius: `40px`,
																padding: `12px 25px`,
																fontSize: `1em`,
															}}
														>
															Leave group
														</button>
													</div>
												) : (
													// If the sessionUser is not a member
													<div id="join">
														<button
															onClick={(event) => {
																event.preventDefault();
																fetch(
																	`/api/groups/${groupDetails.id}/join-group`,
																	{
																		method: "POST",
																		headers: {
																			"Content-Type": "application/json",
																		},
																		body: JSON.stringify({
																			group_id: groupDetails.id,
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
																		window.location.href = `/groups/${groupDetails.id}`;
																	})
																	.catch((error) => {
																		console.error(
																			"There was a problem with the fetch operation:",
																			error,
																		);
																	});
															}}
															name="intent"
															value="join-group"
															className={"button"}
															style={{ cursor: `pointer` }}
														>
															Join this group
														</button>
													</div>
												)}
											</>
										) : null}
									</>
								)}
								{sessionUser && sessionUser.id === groupDetails.organizerId ? (
									<div id="crud-buttons">
										<div id="crud-buttons-create">
											<button
												className="button"
												onClick={() =>
													navigate(`/groups/${groupDetails.id}/events/new`)
												}
											>
												Create event
											</button>
										</div>
										<div id="crud-buttons-update">
											<button
												className="button"
												onClick={() =>
													navigate(`/groups/${groupDetails.id}/edit`)
												}
											>
												Update Group
											</button>
										</div>
										<div id="crud-buttons-update-image">
											<div id="crud-buttons-delete">
												<OpenModalButton
													groupDetails={groupDetails}
													onClose={closeModal}
													className="button"
													id="add-group-image"
													buttonText="Add Images"
													modalComponent={
														<GroupImage
															groupDetails={groupDetails}
															onClose={closeModal}
														/>
													}
												/>
											</div>
										</div>
										<div id="crud-buttons-delete">
											<OpenModalButton
												groupDetails={groupDetails}
												navigate={navigate}
												className="button"
												id="delete-group"
												buttonText="Delete Group"
												style={{
													backgroundColor: "red",
													color: `#dddddc`,
													boxShadow: `none`,
												}}
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
								{activeSection !== "Meet the Organizer" ? (
									<h1 onClick={() => setActiveSection("Meet the Organizer")}>
										MEET THE ORGANIZER
									</h1>
								) : (
									<h1
										onClick={() => setActiveSection("Meet the Organizer")}
										style={{ color: `var(--peach)` }}
									>
										MEET THE ORGANIZER
									</h1>
								)}
								{activeSection !== "Members" ? (
									<h1 onClick={() => setActiveSection("Members")}>MEMBERS</h1>
								) : (
									<h1
										onClick={() => setActiveSection("Members")}
										style={{ color: `var(--peach)` }}
									>
										MEMBERS
									</h1>
								)}
							</div>
							<div id="render-content">{renderContent()}</div>
						</div>
					</main>
					<aside id="body-page">
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
												<Link
													key={event.id}
													to={`/events/${event.id}`}
													style={{ textDecoration: `none`, color: `inherit` }}
													className="group-details-event-item "
												>
													<div className="group-details-event-cards">
														<img
															src={event.image}
															alt={event.name}
															className="event-image"
														/>
														<div className="event-item-dates">
															<p className="event-item-dates-p">
																Start Date: {event.startDate}
															</p>
															<h2 className="event-item-name-h4">
																{event.name}
															</h2>
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
																<p className="event-item-dates-venue">Online</p>
															)}
															<h3 className="event-desc-group">
																{event.description}
															</h3>
														</div>
													</div>
												</Link>
											))}
										</div>
									</>
								)}
							</div>
							{/* <hr width={500}/> */}
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
												<Link
													key={event.id}
													to={`/events/${event.id}`}
													style={{ textDecoration: `none`, color: `inherit` }}
												>
													<div className="group-details-past-event-cards">
														<img src={event.image} alt={event.name} />

														<div id="group-details-past-display-style-direction">
															<div id="group-details-past-keep-in-style">
																<h2>{event.name}</h2>
																<h3>{event.description}</h3>
															</div>
														</div>
													</div>
												</Link>
											))}
										</div>
									</>
								)}
							</div>
						</div>
					</aside>
				</div>
			)}
		</div>
	);
};

export default GroupDetails;
