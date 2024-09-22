import { useLoaderData, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import "./ProfileFeed.css";

const ProfileFeed = () => {
	const allProfiles = useLoaderData();
	const sessionUser = useSelector((state) => state.session.user);
	if (!sessionUser) window.location.href = "/";
	const sessionUserTags = sessionUser.usersTags.map((tag) => tag.id); // Get an array of the session user's tag IDs
	const findSimilarUsers = (users, sessionTags) => {
		// Function to find users with at least one matching tag
		return users.filter((user) => {
			const userTags = user.usersTags.map((tag) => tag.id); // Get the tag IDs for each user
			return userTags.some((tagId) => sessionTags.includes(tagId)); // Check if there is any common tag between the session user and the current user
		});
	};
	const similarUsers = findSimilarUsers(
		allProfiles.users_profile,
		sessionUserTags,
	); // Use the function to get users with at least one similar tag
	return (
		<div id="profile-feed-users">
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

				<Link to={`/users/${sessionUser.id}/profile/update`} className="nav-link">
					Update Profile{" >"}
				</Link>
			</div>
			<h3
				style={{
					fontSize: `80px`,
					padding: `3% 0px 4% 3%`,
					backgroundImage: `linear-gradient(35deg, #E08F2C, #223f5c)`,
					backgroundClip: `text`,
					WebkitTextFillColor: `transparent`,
				}}
			>
				SIMILAR TO YOU!
			</h3>
			{!sessionUser ? (
				<p>You must be a user in order to view attendees to this event</p>
			) : (
				<div id="profile-users">
					{!similarUsers.length ? (
						<p>Add some tags to your profile to find some similar users</p>
					) : (
						<>
							{similarUsers.map((user) => (
								<Link
									to={`users/${user.id}`}
									style={{
										textDecoration: "none",
										color: "inherit",
									}}
									key={user.id}
								>
									<div className="members-group-cards">
										<img src={user.profileImage} alt={user.username} />
										<div id="members-group-display-style-direction">
											<div id="members-group-keep-in-style">
												<h2>
													{user.firstName} {user.lastName}
												</h2>
											</div>
											<ul className="stats">
												<li>
													<var>{user.username}</var>
													<label>Username</label>
												</li>
												<li>
													<var>{user.email}</var>
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
			)}
		</div>
	);
};

export default ProfileFeed;
