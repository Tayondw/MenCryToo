import { useLoaderData, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";
import { HeroSection } from "../NotAuthHome/NotAuthHome";
import OpenModalButton from "../../OpenModalButton";
import AddTag from "../../Tags/AddTag";
import "./ProfileHome.css";

const ProfileHome = () => {
	const sessionUser = useSelector((state) => state.session.user);
	const { allProfiles } = useLoaderData();
	const userProfile = allProfiles.users_profile.find(
		(profile) => profile.id === sessionUser.id,
	);
	const userTags = userProfile.usersTags;
	const userPosts = userProfile.posts;
	const userGroups = userProfile.userMembership;
	const userEvents = userProfile.userAttendances;
	const [currentPostIndex, setPostCurrentIndex] = useState(0);
	const [currentGroupIndex, setGroupCurrentIndex] = useState(0);
	const [currentEventIndex, setEventCurrentIndex] = useState(0);

	const handlePostPrevClick = () => {
		setPostCurrentIndex(
			currentPostIndex > 0 ? currentPostIndex - 1 : userPosts.length - 1,
		);
	};

	const handlePostNextClick = () => {
		setPostCurrentIndex(
			currentPostIndex < userPosts.length - 1 ? currentPostIndex + 1 : 0,
		);
	};

	const handleGroupPrevClick = () => {
		setGroupCurrentIndex(
			currentGroupIndex > 0 ? currentGroupIndex - 1 : userGroups.length - 1,
		);
	};

	const handleGroupNextClick = () => {
		setGroupCurrentIndex(
			currentGroupIndex < userGroups.length - 1 ? currentGroupIndex + 1 : 0,
		);
	};

	const handleEventPrevClick = () => {
		setEventCurrentIndex(
			currentEventIndex > 0 ? currentEventIndex - 1 : userEvents.length - 1,
		);
	};

	const handleEventNextClick = () => {
		setEventCurrentIndex(
			currentEventIndex < userEvents.length - 1 ? currentEventIndex + 1 : 0,
		);
	};
	console.log("users tags", userTags);

	console.log("user profile", userProfile);

	console.log("profiles", allProfiles);

	return (
		<div id="profile-home">
			<div id="profile-hero-section">
				<HeroSection />
			</div>
			<div id="profile-home-main-aside">
				<main id="profile-home-main">
					<div id="users-tags-grid">
						<div id="users-tags" className="div-block-2">
							<h1 id="user-tags-header">Here are your tags</h1>
							{userTags.map((tag) => (
								<div id="each-tag" key={tag.id}>
									<Link to={`/tags/${tag.id}/${tag.name}`} className="w-button" id="each-profile-tag">
										{tag.name}
									</Link>
								</div>
							))}
						</div>
						<div id="add-tags-div" className="div-block-2">
							<h1>You can add more tags too!</h1>
							<div id="add-tags-button">
								<OpenModalButton
                                                      buttonText="Add Tags"
                                                      className="w-button"
									// style={{
									// 	background: `#e08f2c`,
									// 	width: `170px`,
									// 	cursor: `pointer`,
									// 	borderRadius: `4px`,
									// 	color: `#fff`,
									// 	textAlign: `center`,
									// 	letterSpacing: `2px`,
									// 	textTransform: `uppercase`,
									// 	marginLeft: `10px`,
									// 	marginRight: `10px`,
									// 	padding: `12px 30px`,
									// 	fontSize: `16px`,
									// 	fontWeight: 600,
									// 	lineHeight: `21px`,
									// 	textDecoration: `none`,
									// 	transition: `background-color 0.3s`,
									// 	display: `inline-block`,
                                                      //       border: 0,
                                                      //       font: `Open Sans, sans-serif`
									// }}
									modalComponent={<AddTag />}
								/>
							</div>
						</div>
					</div>
					<div id="posts-groups-events-grid">
						<div id="profile-home-posts">
							<div id="auth-profile-posts-carousel">
								{userPosts &&
									userPosts.map((post) => (
										<div
											id="each-post-carousel"
											key={post.id}
											className={`post-mencrytoo-carousel-item ${
												post.id === userPosts[currentPostIndex].id
													? "active"
													: ""
											}`}
											style={{
												display:
													post.id === userPosts[currentPostIndex].id
														? "flex"
														: "none",
											}}
										>
											<h1>POSTS</h1>
											<div id="post-carousel">
												<img
													src={post.image}
													alt={post.title}
													width={200}
													height={200}
													className="post-carousel-image"
												/>

												<div className="post-content-carousel">
													<h3>Title: {post.title}</h3>
													<p>Caption: {post.caption}</p>
													<p>Likes: {post.likes}</p>
												</div>
											</div>

											<div id="post-carousel-navigation">
												<button
													className="event-nav-button prev"
													onClick={handlePostPrevClick}
												>
													◀
												</button>
												<span className="event-nav-indicator">{`${
													currentPostIndex + 1
												} of ${userPosts.length}`}</span>
												<button
													className="event-nav-button next"
													onClick={handlePostNextClick}
												>
													▶
												</button>
											</div>
										</div>
									))}
							</div>
						</div>
						<div id="profile-home-groups">
							<div id="auth-profile-groups-carousel">
								{userGroups &&
									userGroups.map((group) => (
										<div
											id="each-profile-group-carousel"
											key={group.id}
											className={`group-mencrytoo-carousel-item ${
												group.id === userGroups[currentGroupIndex].id
													? "active"
													: ""
											}`}
											style={{
												display:
													group.id === userGroups[currentGroupIndex].id
														? "flex"
														: "none",
											}}
										>
											<h1>GROUPS</h1>
											<div id="profile-group-carousel">
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
												} of ${userGroups.length}`}</span>
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
						</div>
						<div id="profile-home-events">
							<div id="auth-profile-events-carousel">
								{userEvents &&
									userEvents.map((event) => (
										<div
											id="each-profile-event-carousel"
											key={event.id}
											className={`event-mencrytoo-carousel-item ${
												event.id === userEvents[currentEventIndex].id
													? "active"
													: ""
											}`}
											style={{
												display:
													event.id === userEvents[currentEventIndex].id
														? "flex"
														: "none",
											}}
										>
											<h1>EVENTS</h1>
											<div id="profile-event-carousel">
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
												} of ${userEvents.length}`}</span>
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
					</div>
				</main>
				<aside id="profile-side-bar">
					<div id="profile-sidebar-info">
						<div>
							<img src={userProfile.profileImage} alt={userProfile.username} />
						</div>
						<div>
							<h5>{userProfile.username}</h5>
							<h4>First Name: {userProfile.firstName}</h4>
							<h4>Last Name: {userProfile.lastName}</h4>
							<h4>Email: {userProfile.email}</h4>
						</div>
						<div id="profile-home-edit-profile">
							<Link to={`/users/${sessionUser.id}/profile/update`}>
								<button id="profile-home-edit-profile-button">
									Edit Profile
								</button>
							</Link>
						</div>
					</div>
				</aside>
			</div>
		</div>
	);
};

export default ProfileHome;
