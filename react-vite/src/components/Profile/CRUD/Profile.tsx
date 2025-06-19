import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useLoaderData } from "react-router-dom";
import {
	Heart,
	MessageCircle,
	Users,
	Calendar,
	MapPin,
	Expand,
	Edit3,
} from "lucide-react";
import { User, Post, Group, Event, Tag } from "../../../types";
import PostMenu from "../../Posts/PostMenu-TSX/PostMenu";
import DeleteProfile from "../CRUD-TSX/Delete/DeleteProfile";
import "./Profile2.css";

// Mock data for demonstration when no backend data is available
const mockUser: User = {
	id: 1,
	username: "johndoe",
	firstName: "John",
	lastName: "Doe",
	email: "john.doe@example.com",
	bio: "Passionate developer and community builder",
	profileImage:
		"https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
	usersTags: [
		{ id: 1, name: "React" },
		{ id: 2, name: "JavaScript" },
		{ id: 3, name: "Web Development" },
		{ id: 4, name: "UI/UX" },
	],
	posts: [
		{
			id: 1,
			title: "Building Modern Web Apps",
			caption:
				"Just finished working on an amazing React project with some incredible features!",
			image:
				"https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800",
			likes: 42,
			updatedAt: "2024-01-15T10:30:00Z",
		},
		{
			id: 2,
			title: "Design Systems",
			caption: "Exploring the world of design systems and component libraries.",
			image:
				"https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
			likes: 28,
			updatedAt: "2024-01-10T14:20:00Z",
		},
	],
	group: [
		{
			id: 1,
			name: "React Developers",
			about: "A community for React enthusiasts",
			image:
				"https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400",
			numMembers: 1250,
			events: [
				{
					id: 1,
					name: "Event 1",
					description: "",
					image: "",
					numAttendees: 0,
					capacity: 0,
					type: "",
					startDate: "",
					endDate: "",
				},
				{
					id: 2,
					name: "Event 2",
					description: "",
					image: "",
					numAttendees: 0,
					capacity: 0,
					type: "",
					startDate: "",
					endDate: "",
				},
			],
			type: "Public",
		},
	],
	events: [
		{
			id: 1,
			name: "React Conference 2024",
			description: "Annual React developers conference",
			image:
				"https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=400",
			numAttendees: 150,
			capacity: 200,
			type: "Conference",
			startDate: "2024-03-15T09:00:00Z",
			endDate: "2024-03-15T18:00:00Z",
		},
	],
	userComments: [
		{ id: 1, content: "Great post!" },
		{ id: 2, content: "Thanks for sharing!" },
	],
};

const Profile: React.FC = () => {
	// Get data from React Router loader
	const loaderData = useLoaderData() as { user: User } | null;

	// Use loader data or fallback to mock data
	const currentUser = loaderData?.user || mockUser;

	useEffect(() => {
		if (!currentUser) window.location.href = "/";
	}, [currentUser]);

	const [activeMainSection, setActiveMainSection] = useState<
		"posts" | "groups" | "events"
	>("posts");
	const [activeAsideSection, setActiveAsideSection] = useState<
		"tags" | "similar"
	>("tags");
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	// Memoized user-related values with proper null checks and default arrays
	const userTags = useMemo(() => currentUser?.usersTags ?? [], [currentUser]);
	const userPosts = useMemo(() => currentUser?.posts ?? [], [currentUser]);
	const userGroups = useMemo(() => currentUser?.group ?? [], [currentUser]);
	const userEvents = useMemo(() => currentUser?.events ?? [], [currentUser]);
	const userComments = useMemo(
		() => currentUser?.userComments ?? [],
		[currentUser],
	);

	const sortedUserPosts = useMemo(() => {
		return [...userPosts].sort(
			(a: Post, b: Post) =>
				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		);
	}, [userPosts]);

	const formatTimeAgo = (dateString: string) => {
		const now = new Date();
		const postDate = new Date(dateString);
		const diffInDays = Math.floor(
			(now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		return `${diffInDays}d ago`;
	};

	const handleDeleteProfile = useCallback(() => {
		setShowDeleteModal(true);
	}, []);

	const closeDeleteModal = useCallback(() => {
		setShowDeleteModal(false);
	}, []);

	const confirmDeleteProfile = useCallback(() => {
		setShowDeleteModal(false);
		// The DeleteProfile component handles the actual deletion
	}, []);

	const renderContent = useCallback(() => {
		switch (activeMainSection) {
			case "posts":
				return userPosts.length > 0 ? (
					<div className="content-grid">
						{sortedUserPosts.map((post: Post) => (
							<article key={post.id} className="post-card">
								<div className="post-header">
									<div className="post-user-info">
										<img
											src={currentUser?.profileImage}
											alt={currentUser?.username}
											className="post-avatar"
										/>
										<span className="post-username">
											{currentUser?.username}
										</span>
									</div>
									<h3 className="post-title">{post?.title}</h3>
									<div className="post-menu-btn">
										<PostMenu navigate={() => {}} post={post} />
									</div>
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
											<span>{userComments.length}</span>
										</div>
									</div>
									<div className="post-caption">
										<span className="caption-username">
											{currentUser?.username}
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
				return userGroups.length > 0 ? (
					<div className="content-grid">
						{userGroups.map((group: Group) => (
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
													{group?.events?.length || 0}
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
				return userEvents.length > 0 ? (
					<div className="content-grid">
						{userEvents.map((event: Event) => (
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
		currentUser,
		userComments,
		sortedUserPosts,
	]);

	const renderTagContent = useCallback(() => {
		switch (activeAsideSection) {
			case "tags":
				return userTags.length > 0 ? (
					<div className="tags-content">
						<div className="tags-grid">
							{userTags.map((tag: Tag) => (
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
										src={currentUser?.profileImage}
										alt={currentUser?.username}
										className="profile-avatar"
									/>
									<Link
										to={`/users/${currentUser?.id}/profile/update`}
										className="edit-avatar-btn"
									>
										<Edit3 size={24} />
									</Link>
								</div>
							</div>

							<div className="profile-details">
								<h1 className="profile-username">{currentUser?.username}</h1>
								<p className="profile-bio">{currentUser?.bio}</p>

								<ul className="profile-stats">
									<li className="profile-stat">
										<span className="stat-value">{currentUser?.firstName}</span>
										<span className="stat-label">First Name</span>
									</li>
									<li className="profile-stat">
										<span className="stat-value">{currentUser?.lastName}</span>
										<span className="stat-label">Last Name</span>
									</li>
									<li className="profile-stat">
										<span className="stat-value">{currentUser?.email}</span>
										<span className="stat-label">Email</span>
									</li>
								</ul>

								<div className="profile-actions">
									<Link to={`/users/${currentUser?.id}/profile/update`}>
										<button className="edit-profile-btn">Edit Profile</button>
									</Link>
									<button
										className="delete-profile-btn"
										onClick={handleDeleteProfile}
									>
										Delete Profile
									</button>
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

				{/* Desktop Sidebar - Hidden on mobile */}
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

				{/* Mobile Tags Section - Only visible on mobile */}
				<section className="mobile-tags-section">
					<div className="mobile-tags-header">
						<h2 className="mobile-tags-title">Your Profile Tags</h2>
						<p className="mobile-tags-subtitle">
							Manage your interests and find similar users
						</p>
					</div>

					<nav className="mobile-tags-nav">
						<button
							onClick={() => setActiveAsideSection("tags")}
							className={`mobile-tags-nav-btn ${
								activeAsideSection === "tags" ? "active" : ""
							}`}
						>
							YOUR TAGS
						</button>
						<button
							onClick={() => setActiveAsideSection("similar")}
							className={`mobile-tags-nav-btn ${
								activeAsideSection === "similar" ? "active" : ""
							}`}
						>
							SIMILAR TO YOU
						</button>
					</nav>

					<div className="mobile-tags-content">{renderTagContent()}</div>
				</section>
			</div>

			{/* Delete Profile Modal */}
			{showDeleteModal && (
				<div className="modal-overlay">
					<div className="delete-modal-container">
						<DeleteProfile
							user={currentUser}
							onClose={closeDeleteModal}
							onConfirm={confirmDeleteProfile}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default Profile;
