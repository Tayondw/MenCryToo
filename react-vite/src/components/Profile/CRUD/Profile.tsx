import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
	Heart,
	MessageCircle,
      Edit3,
      Expand,
	Users,
	Calendar,
	MapPin,
} from "lucide-react";
import { thunkAuthenticate } from "../../../store/session";
import { RootState, Post, AppDispatch } from "../../../types";
import PostMenu from "../../Posts/PostMenu-TSX/PostMenu";
import "./Profile2.css";

const Profile: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const sessionUser = useSelector((state: RootState) => state.session.user);
	const [activeMainSection, setActiveMainSection] = useState<
		"posts" | "groups" | "events"
	>("posts");
	const [activeAsideSection, setActiveAsideSection] = useState<
		"tags" | "similar"
	>("tags");

	// Authenticate user on component mount
	useEffect(() => {
		if (!sessionUser) {
			dispatch(thunkAuthenticate());
		}
	}, [dispatch, sessionUser]);

	// Navigate to home if no user after authentication attempt
	useEffect(() => {
		if (sessionUser === null) {
			navigate("/");
		}
	}, [sessionUser, navigate]);

	// Memoized user-related values
	const userTags = useMemo(() => sessionUser?.usersTags ?? [], [sessionUser]);
	const userPosts = useMemo(() => sessionUser?.posts ?? [], [sessionUser]);
	const userGroups = useMemo(() => sessionUser?.group ?? [], [sessionUser]);
	const userEvents = useMemo(() => sessionUser?.events ?? [], [sessionUser]);
	const userComments = useMemo(
		() => sessionUser?.userComments ?? [],
		[sessionUser],
	);

	const sortedUserPosts = userPosts?.sort(
		(a: Post, b: Post) =>
			new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);

	const formatTimeAgo = (dateString: string) => {
		const now = new Date();
		const postDate = new Date(dateString);
		const diffInDays = Math.floor(
			(now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		return `${diffInDays}d ago`;
	};

	const renderContent = useCallback(() => {
		switch (activeMainSection) {
			case "posts":
				return userPosts.length > 0 ? (
					<div className="content-grid">
						{sortedUserPosts?.map((post: Post) => (
							<article key={post.id} className="post-card">
								<div className="post-header">
									<div className="post-user-info">
										<img
											src={sessionUser?.profileImage}
											alt={sessionUser?.username}
											className="post-avatar"
										/>
										<span className="post-username">
											{sessionUser?.username}
										</span>
									</div>
									<h3 className="post-title">{post?.title}</h3>
									<button className="post-menu-btn">
										<PostMenu navigate={navigate} post={post} />
									</button>
								</div>
								<div className="post-image-container">
									<img
										src={post?.image}
										alt={post?.title}
										className="post-image"
									/>
								</div>
								<div className="post-content">
									<div className="post-stats">
										<div className="stat-item">
											<Heart size={18} />
											<span>{post?.likes}</span>
										</div>
										<div className="stat-item">
											<MessageCircle size={18} />
											<span>{userComments?.length}</span>
										</div>
									</div>
									<div className="post-caption">
										<span className="caption-username">
											{sessionUser?.username}
										</span>
										<span className="caption-separator">•</span>
										<span className="caption-time">
											{formatTimeAgo(post?.updatedAt)}
										</span>
										<span className="caption-separator">•</span>
										<p className="caption-text">{post?.caption}</p>
									</div>
								</div>
							</article>
						))}
					</div>
				) : (
					<div className="empty-state">
						<p>
							Currently no posts available. You will see something after you
							make a post
						</p>
					</div>
				);

			case "groups":
				return userGroups?.length > 0 ? (
					<div className="content-grid">
						{userGroups?.map((group) => (
							<Link
								to={`/groups/${group?.id}`}
								key={group?.id}
								className="card-link"
							>
								<article className="content-card">
									<img
										src={group?.image}
										alt={group?.name}
										className="card-image"
									/>
									<div className="card-content">
										<div className="card-header">
											<h2 className="card-title">{group?.name}</h2>
											<p className="card-description">{group?.about}</p>
										</div>
										<ul className="card-stats">
											<li className="stat-item">
												<Users size={16} />
												<span className="stat-value">{group?.numMembers}</span>
												<span className="stat-label">Members</span>
											</li>
											<li className="stat-item">
												<Calendar size={16} />
												<span className="stat-value">
													{group?.events?.length}
												</span>
												<span className="stat-label">Events</span>
											</li>
                                                                  <li className="stat-item">
                                                                        <MapPin size={16} />
												<span className="stat-value">{group?.type}</span>
												<span className="stat-label">Type</span>
											</li>
										</ul>
									</div>
								</article>
							</Link>
						))}
					</div>
				) : (
					<div className="empty-state">
						<p>
							Currently no groups available. You will see something after you
							join a group
						</p>
					</div>
				);

			case "events":
				return userEvents?.length > 0 ? (
					<div className="content-grid">
						{userEvents?.map((event) => (
							<Link
								key={event?.id}
								to={`/events/${event?.id}`}
								className="card-link"
							>
								<article className="content-card">
									<img
										src={event?.image}
										alt={event?.name}
										className="card-image"
									/>
									<div className="card-content">
										<div className="card-header">
											<h2 className="card-title">{event?.name}</h2>
											<p className="card-description">{event?.description}</p>
										</div>
										<ul className="card-stats">
											<li className="stat-item">
												<Users size={16} />
												<span className="stat-value">
													{event?.numAttendees}
												</span>
												<span className="stat-label">Attendees</span>
											</li>
                                                                  <li className="stat-item">
                                                                        <Expand size={16} />
												<span className="stat-value">{event?.capacity}</span>
												<span className="stat-label">Capacity</span>
											</li>
											<li className="stat-item">
												<MapPin size={16} />
												<span className="stat-value">{event?.type}</span>
												<span className="stat-label">Type</span>
											</li>
											<li className="stat-item">
												<Calendar size={16} />
												<span className="stat-value">
													{new Date(event?.startDate).toLocaleDateString()}
												</span>
												<span className="stat-label">Start Date</span>
											</li>
										</ul>
									</div>
								</article>
							</Link>
						))}
					</div>
				) : (
					<div className="empty-state">
						<p>
							Currently no events available. You will see something after you
							add an event
						</p>
					</div>
				);

			default:
				return null;
		}
	}, [
		activeMainSection,
		userPosts,
		userGroups,
		userEvents,
		sessionUser,
		userComments,
            sortedUserPosts,
            navigate
	]);

	const renderTagContent = useCallback(() => {
		switch (activeAsideSection) {
			case "tags":
				return userTags?.length > 0 ? (
					<div className="tags-content">
						<div className="tags-grid">
							{userTags?.map((tag) => (
								<div key={tag?.id} className="tag-item">
									<span className="tag-badge">{tag?.name}</span>
								</div>
							))}
						</div>
						<button className="add-tags-btn">Add Tags</button>
					</div>
				) : (
					<div className="empty-state">
						<p>Currently no tags available.</p>
					</div>
				);

			case "similar":
				return (
					<div className="similar-users-content">
						<h3 className="similar-users-title">
							Find users similar to you based on your tags
						</h3>
						<Link to="/profile-feed">
							<button className="similar-users-btn">SIMILAR TO YOU</button>
						</Link>
					</div>
				);

			default:
				return null;
		}
	}, [activeAsideSection, userTags]);

	return (
		<div className="profile-container">
			<nav className="profile-nav">
				<Link to="/posts-feed" className="nav-link">
					← Posts
				</Link>
				<Link to="/posts/create" className="nav-link">
					Create a Post →
				</Link>
			</nav>

			<div className="profile-layout">
				<main className="profile-main">
					<section className="profile-header">
						<div className="profile-info">
							<div className="profile-avatar-section">
								<div className="avatar-container">
									<img
										src={sessionUser?.profileImage}
										alt={sessionUser?.username}
										className="profile-avatar"
									/>
									<Link
										to={`/users/${sessionUser?.id}/profile/update`}
										className="edit-avatar-btn"
									>
										<Edit3 size={24} />
									</Link>
								</div>
							</div>

							<div className="profile-details">
								<h1 className="profile-username">{sessionUser?.username}</h1>
								<p className="profile-bio">{sessionUser?.bio}</p>

								<ul className="profile-stats">
									<li className="profile-stat">
										<span className="stat-value">{sessionUser?.firstName}</span>
										<span className="stat-label">First Name</span>
									</li>
									<li className="profile-stat">
										<span className="stat-value">{sessionUser?.lastName}</span>
										<span className="stat-label">Last Name</span>
									</li>
									<li className="profile-stat">
										<span className="stat-value">{sessionUser?.email}</span>
										<span className="stat-label">Email</span>
									</li>
								</ul>

								<div className="profile-actions">
									<Link to={`/users/${sessionUser?.id}/profile/update`}>
										<button className="edit-profile-btn">Edit Profile</button>
									</Link>
									<button className="delete-profile-btn">Delete Profile</button>
								</div>
							</div>
						</div>
					</section>

					<section className="profile-content">
						<nav className="content-nav">
							{(["posts", "groups", "events"] as const).map((section) => (
								<button
									key={section}
									onClick={() => setActiveMainSection(section)}
									className={`content-nav-btn ${
										activeMainSection === section ? "active" : ""
									}`}
								>
									{section.toUpperCase()}
								</button>
							))}
						</nav>

						<div className="content-area">{renderContent()}</div>
					</section>
				</main>

				<aside className="profile-sidebar">
					<nav className="sidebar-nav">
						<button
							onClick={() => setActiveAsideSection("tags")}
							className={`sidebar-nav-btn ${
								activeAsideSection === "tags" ? "active" : ""
							}`}
						>
							YOUR TAGS
						</button>
						<button
							onClick={() => setActiveAsideSection("similar")}
							className={`sidebar-nav-btn ${
								activeAsideSection === "similar" ? "active" : ""
							}`}
						>
							SIMILAR TO YOU
						</button>
					</nav>

					<div className="sidebar-content">{renderTagContent()}</div>
				</aside>
			</div>
		</div>
	);
};

export default Profile;
