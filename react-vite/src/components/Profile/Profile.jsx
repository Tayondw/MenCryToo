import { useLoaderData, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import OpenModalButton from "../OpenModalButton";
import AddTag from "../Tags/AddTag";
import DeleteProfile from "./CRUD/Delete";
import { BiSolidPencil } from "react-icons/bi";
import "./Profile.css";

const Profile = () => {
	const sessionUser = useSelector((state) => state.session.user);
	const userDetails = useLoaderData();
	const navigate = useNavigate();
	console.log(userDetails);

	const userTags = userDetails.usersTags;
	const userPosts = userDetails.posts;
	const userGroups = userDetails.userMembership;
	const userEvents = userDetails.userAttendances;

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
						Currently no posts available. You will see something after you make
						a post
					</p>
				);
			case "groups":
				return userGroups.length > 0 ? (
					userGroups.map((group) => (
						<Link
							to={`/groups/${group.groupId}`}
							key={group.groupId}
							style={{ textDecoration: `none`, color: `inherit` }}
						>
							<div id="second-half-groups" className="second-half-cards">
								<img src={group.image[0].image} alt={group.name} />
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
						Currently no groups available. You will see something after you join
						a group
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
								<img src={event.image[0].image} alt={event.name} />
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
					<p>
						Currently no events available. You will see something after you add
						an event
					</p>
				);
			default:
				return null;
		}
	};

	return (
		<div id="user-profile-page">
			<main id="user-profile-basic">
				<div id="user-profile-img-wdetails">
					<div id="user-profile-image">
						<img src={userDetails.profileImage} alt={userDetails.username} />
						<Link to={`/users/${sessionUser.id}/profile/update`}>
							<BiSolidPencil id="photo-plus" />
						</Link>
					</div>
					<div id="user-profile-details">
						<div>
							<h3>{userDetails.username}</h3>
						</div>
						<ul id="profile-stats">
							<li>
								<var>{userDetails.firstName}</var>
								<label>First Name</label>
							</li>
							<li>
								<var>{userDetails.lastName}</var>
								<label>Last Name</label>
							</li>
							<li>
								<var>{userDetails.email}</var>
								<label>Email</label>
							</li>
						</ul>
						<div id="profile-home-edit-profile">
							<Link to={`/users/${sessionUser.id}/profile/update`}>
								<button className="button" id="profile-home-edit-profile-button">
									Edit Profile
								</button>
							</Link>
							<div id="crud-buttons-delete">
								<OpenModalButton
									userDetails={userDetails}
									navigate={navigate}
									className="group-delete-button button"
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
										fontSize: `16px`,
										fontWeight: 600,
                                                            letterSpacing: `2px`,
                                                            height: `45px`
									}}
									modalComponent={
										<DeleteProfile
											userDetails={userDetails}
											navigate={navigate}
										/>
									}
								/>
							</div>
						</div>
					</div>
				</div>
				<div id="second-half-profile">
					<div className="second-half-headers">
						<h1 onClick={() => setActiveSection("posts")}>POSTS</h1>
						<h1 onClick={() => setActiveSection("groups")}>GROUPS</h1>
						<h1 onClick={() => setActiveSection("events")}>EVENTS</h1>
					</div>
					<div id="left-second-half-content">{renderContent()}</div>
				</div>
			</main>
			<aside id="aside-content">
				<div id="tag-content">
					<div>
						<h1>TAGS</h1>
					</div>
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
				<div id="similar-to-you-button">
					<h1>SIMILAR TO YOU</h1>
					<Link to="/profile-feed">
						<button className="button">SIMILAR TO YOU</button>
					</Link>
				</div>
			</aside>
		</div>
	);
};

export default Profile;
