import { Link, useLoaderData } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";

const ProfileDetails = () => {
	const userDetails = useLoaderData();
	const sessionUser = useSelector((state) => state.session.user);
	const [activeMainSection, setActiveMainSection] = useState("posts"); // State to track the main active section
	const [activeAsideSection, setActiveAsideSection] = useState("tags"); // State to track the aside active section
	// UseEffect to navigate on logout immediately
	useEffect(() => {
		if (!sessionUser) {
			window.location.href = "/"; // Immediate navigation when sessionUser becomes null
		}
	}, [sessionUser]);
	const userTags = useMemo(() => userDetails?.usersTags, [userDetails]);
	const userPosts = useMemo(() => userDetails?.posts, [userDetails]);
	const userGroups = useMemo(() => userDetails?.group, [userDetails]);
	const userEvents = useMemo(() => userDetails?.events, [userDetails]);
	const renderContent = useCallback(() => {
		switch (activeMainSection) {
			case "posts":
				return userPosts?.length > 0 ? (
					userPosts?.map((post) => (
						<Link
							key={post.id}
							to={`/posts/${post?.id}`}
							style={{ textDecoration: `none`, color: `inherit` }}
						>
							<div id="second-half-posts" className="second-half-cards">
								<img src={post?.image} alt={post?.title} />
								<div id="display-style-direction">
									<div>
										<h2>{post?.title}</h2>
										<h3>{post?.caption}</h3>
									</div>
									<ul className="stats">
										<li>
											<var>{post?.likes}</var>
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
					<p>Currently no posts available.</p>
				);
			case "groups":
				return userGroups?.length > 0 ? (
					userGroups?.map((group) => (
						<Link
							to={`/groups/${group?.id}`}
							key={group?.id}
							style={{ textDecoration: `none`, color: `inherit` }}
						>
							<div id="second-half-groups" className="second-half-cards">
								<img src={group?.image} alt={group?.name} />
								<div id="display-style-direction">
									<div>
										<h2>{group?.name}</h2>
										<h3>{group?.about}</h3>
									</div>
									<ul className="stats">
										<li>
											<var>{group?.numMembers}</var>
											<label>Members</label>
										</li>
										<li>
											<var>{group?.events?.length}</var>
											<label>Events</label>
										</li>
										<li>
											<var>{group?.type}</var>
											<label>Type</label>
										</li>
									</ul>
								</div>
							</div>
						</Link>
					))
				) : (
					<p>Currently no groups available.</p>
				);
			case "events":
				return userEvents?.length > 0 ? (
					userEvents?.map((event) => (
						<Link
							key={event?.id}
							to={`/events/${event?.id}`}
							style={{ textDecoration: `none`, color: `inherit` }}
						>
							<div id="second-half-events" className="second-half-cards">
								<img src={event?.image} alt={event?.name} />
								<div id="display-style-direction">
									<div>
										<h2>{event?.name}</h2>
										<h3>{event?.description}</h3>
									</div>
									<ul className="stats">
										<li>
											<var>{event?.numAttendees}</var>
											<label>Attendees</label>
										</li>
										<li>
											<var>{event?.capacity}</var>
											<label>Capacity</label>
										</li>
										<li>
											<var>{event?.type}</var>
											<label>Type</label>
										</li>
										<li>
											<var>{new Date(event?.startDate).toLocaleString()}</var>
											<label>Start Date</label>
										</li>
										<li>
											<var>{new Date(event?.endDate).toLocaleString()}</var>
											<label>End Date</label>
										</li>
									</ul>
								</div>
							</div>
						</Link>
					))
				) : (
					<p>Currently no events available.</p>
				);
			default:
				return null;
		}
	}, [activeMainSection, userPosts, userGroups, userEvents]);
	const renderTagContent = useCallback(() => {
		switch (activeAsideSection) {
			case "tags":
				return userTags?.length > 0 ? (
					<div id="tag-content">
						{userTags?.map((tag) => (
							<div id="each-tag" key={tag?.id}>
								<button
									className="button"
									id="each-profile-tag"
									style={{ cursor: `default` }}
								>
									{tag?.name}
								</button>
							</div>
						))}
					</div>
				) : (
					<p>Currently no tags available.</p>
				);
			case "similar to you":
				return (
					<Link to="/profile-feed">
						<button className="button" style={{ cursor: `pointer` }}>
							SIMILAR TO YOU
						</button>
					</Link>
				);
			default:
				return null;
		}
	}, [activeAsideSection, userTags]);
	return (
		<div
			style={{
				background: `linear-gradient(-140deg, #e08f2c, #dddddc, #223f5c)`,
			}}
		>
			<div
				className="create-group-link"
				style={{
					display: `flex`,
					justifyContent: `space-between`,
					width: `100%`,
				}}
			>
				<Link to="/posts" className="nav-link">
					{"< "}Posts
				</Link>

				<Link
					to="/posts/create"
					className="nav-link"
				>
					Create a Post{" >"}
				</Link>
			</div>
			<div id="user-profile-page">
				<main
					id="user-profile-basic"
					style={{
						display: `grid`,
						gridTemplateRows: `1fr`,
						rowGap: `80px`,
					}}
				>
					<div
						id="user-profile-img-wdetails"
						style={{
							display: `grid`,
							gridTemplateColumns: `1fr 2fr`,
							alignContent: `flex-start`,
						}}
					>
						<div id="user-profile-image">
							<img
								src={userDetails?.profileImage}
								alt={userDetails?.username}
							/>
						</div>
						<div
							id="user-profile-details"
							style={{
								display: `flex`,
								flexDirection: `column`,
								justifyContent: `space-evenly`,
								alignItems: `center`,
								gap: `25px`,
							}}
						>
							<div>
								<h3>{userDetails?.username}</h3>
							</div>
							<div
								style={{
									display: `flex`,
									justifyContent: `center`,
									alignItems: `center`,
								}}
							>
								<h4 style={{ margin: `0 2%` }}>{userDetails?.bio}</h4>
							</div>
							<ul id="profile-stats" style={{ margin: 0 }}>
								<li>
									<var>{userDetails?.firstName}</var>
									<label>First Name</label>
								</li>
								<li>
									<var>{userDetails?.lastName}</var>
									<label>Last Name</label>
								</li>
								<li>
									<var>{userDetails?.email}</var>
									<label>Email</label>
								</li>
							</ul>
						</div>
					</div>
					<div id="second-half-profile">
						<div className="second-half-headers" style={{ margin: `0 2%` }}>
							{activeMainSection !== "posts" ? (
								<h1 onClick={() => setActiveMainSection("posts")}>POSTS</h1>
							) : (
								<h1
									onClick={() => setActiveMainSection("posts")}
									style={{ color: `var(--peach)` }}
								>
									POSTS
								</h1>
							)}
							{activeMainSection !== "groups" ? (
								<h1 onClick={() => setActiveMainSection("groups")}>GROUPS</h1>
							) : (
								<h1
									onClick={() => setActiveMainSection("groups")}
									style={{ color: `var(--peach)` }}
								>
									GROUPS
								</h1>
							)}
							{activeMainSection !== "events" ? (
								<h1 onClick={() => setActiveMainSection("events")}>EVENTS</h1>
							) : (
								<h1
									onClick={() => setActiveMainSection("events")}
									style={{ color: `var(--peach)` }}
								>
									EVENTS
								</h1>
							)}
						</div>
						<div id="left-second-half-content">{renderContent()}</div>
					</div>
				</main>
				<aside id="aside-content">
					<div className="second-half-headers">
						{activeAsideSection !== "tags" ? (
							<h1 onClick={() => setActiveAsideSection("tags")}>YOUR TAGS</h1>
						) : (
							<h1
								onClick={() => setActiveAsideSection("tags")}
								style={{ color: `var(--deep-blue)` }}
							>
								YOUR TAGS
							</h1>
						)}
						{activeAsideSection !== "similar to you" ? (
							<h1 onClick={() => setActiveAsideSection("similar to you")}>
								SIMILAR TO YOU
							</h1>
						) : (
							<h1
								onClick={() => setActiveAsideSection("similar to you")}
								style={{ color: `var(--deep-blue)` }}
							>
								SIMILAR TO YOU
							</h1>
						)}
					</div>
					<div id="users-tags">{renderTagContent()}</div>
				</aside>
			</div>
		</div>
	);
};

export default ProfileDetails;
