import { useLoaderData, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Footer from "../Footer";
import OpenModalButton from "../OpenModalButton";
import AddTag from "../Tags/AddTag";
import DeleteProfile from "./CRUD/Delete";
import "./Profile.css";

const Profile = () => {
	const sessionUser = useSelector((state) => state.session.user);
	const { allProfiles } = useLoaderData();
	const navigate = useNavigate();
	const userProfile = allProfiles.users_profile.find(
		(profile) => profile.id === sessionUser.id,
	);
	const userTags = userProfile.usersTags;
	const userPosts = userProfile.posts;
	const userGroups = userProfile.userMembership;
	const userEvents = userProfile.userAttendances;

	const [activeSection, setActiveSection] = useState("posts"); // State to track the active section

	useEffect(() => {
		if (!sessionUser || (sessionUser && !sessionUser.profileImage))
			navigate("/");
	}, [sessionUser, navigate]);

	const renderContent = () => {
		switch (activeSection) {
			case "posts":
				return userPosts.length > 0 ? (
					userPosts.map((post) => (
						<Link
							key={post.id}
							to={`/posts/${post.id}`}
							style={{ textDecoration: `none`, color: `inherit` }}
						>
							<div id="second-half-posts" className="second-half-cards">
								<img src={post.image} alt={post.title} />
								<div id="display-style-direction">
									<div>
										<h2>{post.title}</h2>
										<h3>{post.caption}</h3>
									</div>
									<ul className="stats">
										<li>
											<var>{post.likes}</var>
											<label>Likes</label>
										</li>
										<li>
											<var>0</var>
											<label>Comments</label>
										</li>
										<li>
											<var>0</var>
											<label>Shares</label>
										</li>
									</ul>
								</div>
							</div>
						</Link>
					))
				) : (
					<p>
						Currently no posts available. You will see something after you make a post
					</p>
				);
			case "groups":
				return userGroups.length > 0 ? (
					userGroups.map((group) => (
						<Link
							to={`/groups/${group.id}`}
							key={group.id}
							style={{ textDecoration: `none`, color: `inherit` }}
						>
							<div id="second-half-groups" className="second-half-cards">
								<img src={group.groupImage[0].groupImage} alt={group.name} />
								<div id="display-style-direction">
									<div>
										<h2>{group.name}</h2>
										<h3>{group.about}</h3>
									</div>
									<ul className="stats">
										<li>
											<var>{group.numMembers}</var>
											<label>Members</label>
										</li>
										<li>
											<var>{group.events.length}</var>
											<label>Events</label>
										</li>
										<li>
											<var>{group.type}</var>
											<label>Type</label>
										</li>
									</ul>
								</div>
							</div>
						</Link>
					))
				) : (
					<p>
						Currently no groups available. You will see something after you join a group
					</p>
				);
			case "events":
				return userEvents.length > 0 ? (
					userEvents.map((event) => (
						<Link
							key={event.id}
							to={`/events/${event.id}`}
							style={{ textDecoration: `none`, color: `inherit` }}
						>
							<div id="second-half-events" className="second-half-cards">
								<img src={event.eventImage[0].eventImage} alt={event.name} />
								<div id="display-style-direction">
									<div>
										<h2>{event.name}</h2>
										<h3>{event.description}</h3>
									</div>
									<ul className="stats">
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
					<p>Currently no events available. You will see something after you add an event</p>
				);
			default:
				return null;
		}
	};

	return (
		<div id="user-profile-page">
			<div id="user-profile-basic">
				<div id="user-profile-img-wdetails">
					<div id="user-profile-image">
						<img src={userProfile.profileImage} alt={userProfile.username} />
					</div>
					<div>
						<div id="user-profile-details">
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
							<div id="crud-buttons-delete">
								<OpenModalButton
									userProfile={userProfile}
									navigate={navigate}
									className="group-delete-button"
									id="delete-group"
									buttonText="Delete Profile"
									style={{
										backgroundColor: "red",
										color: `#dddddc`,
										textDecoration: `none`,
										borderRadius: `4px`,
										border: `none`,
										padding: `12px 30px`,
										lineHeight: 1,
										cursor: `pointer`,
										textTransform: `uppercase`,
										boxSizing: `border-box`,
										transition: `background-color 0.3s`,
										fontSize: `12px`,
										fontWeight: 600,
										letterSpacing: `2px`,
									}}
									modalComponent={
										<DeleteProfile
											userProfile={userProfile}
											navigate={navigate}
										/>
									}
								/>
							</div>
						</div>
					</div>
				</div>
				<div id="second-half-profile">
					<div id="left-second-half">
						<div className="second-half-headers">
							<h1 onClick={() => setActiveSection("posts")}>POSTS</h1>
							<h1 onClick={() => setActiveSection("groups")}>GROUPS</h1>
							<h1 onClick={() => setActiveSection("events")}>EVENTS</h1>
						</div>
						<div id="left-second-half-content">{renderContent()}</div>
					</div>
					<div id="right-second-half">
						<div className="second-half-headers">
							<h1>TAGS</h1>
							<h1>SIMILAR TO YOU</h1>
						</div>
						<div id="right-second-half-content">
							<div id="user-profile-tags">
								<div id="users-tags-grid">
									<div id="users-tags" className="div-block-2">
										<h1 id="user-tags-header">Here are your tags</h1>
										{userTags.map((tag) => (
											<div id="each-tag" key={tag.id}>
												<Link
													to={`/tags/${tag.id}/${tag.name}`}
													className="w-button"
													id="each-profile-tag"
												>
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
												modalComponent={<AddTag />}
											/>
										</div>
									</div>
								</div>
							</div>
							<div id="become-a-partner-userprofile">
								<h1>
									SOON YOU CAN BECOME A PARTNER - WE WILL RENDER THIS LATER
								</h1>
							</div>
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default Profile;
