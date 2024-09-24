import { useLoaderData, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaHeart, FaComments } from "react-icons/fa6";
import "./Posts.css";

const Posts = () => {
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
	// console.log(similarUsers);
      const posts = similarUsers.flatMap((user) => user.posts);
      const comments = similarUsers.map((user) => user.userComments);
      // console.log("posts", posts);
      
	return (
		<div id="post-feed-users">
			<div
				className="create-group-link"
				style={{
					display: `flex`,
					justifyContent: `space-between`,
					width: `100%`,
				}}
			>
				<Link to="/profile" className="nav-link">
					{"< "}Profile
				</Link>

				<Link
					to={`/users/${sessionUser.id}/profile/update`}
					className="nav-link"
				>
					Update Profile{" >"}
				</Link>
			</div>
			<h3
				style={{
					fontSize: `70px`,
					padding: `3% 0px 4% 3%`,
					backgroundImage: `linear-gradient(35deg, #E08F2C, #223f5c)`,
					backgroundClip: `text`,
					WebkitTextFillColor: `transparent`,
				}}
			>
				POSTS FROM USERS SIMILAR TO YOU!
			</h3>
			{!sessionUser ? (
				<p>You must be a user in order to view attendees to this event</p>
			) : (
				<div id="post-users">
					{!similarUsers.length ? (
						<p>Add some tags to your profile to find some similar users</p>
					) : (
						<>
							{posts.map((post) => (
								<div
									key={post.id}
									// id="second-half-posts"
									// className="post-second-half-cards"
								>
									{post?.user?.id !== sessionUser.id ? (
										<div
											id="second-half-posts"
											className="post-second-half-cards"
                                                                  key={post.id}
                                                                  style={{marginBottom: `30px;`}}
										>
											<div id="post-header-div">
												<div id="space-between">
													<div id="post-header-detail">
														<img src={post?.user?.profileImage} alt="" />
														<p>{post?.user?.username}</p>
													</div>
													<div id="post-title">
														<p>{post?.title}</p>
													</div>
												</div>
												<img src={post?.image} alt={post?.title} />
											</div>
											<div id="posts-display-style-direction">
												<div className="stats">
													<div>
														<var>
															<FaHeart />
														</var>
														<label>{post?.likes}</label>
													</div>
													<div>
														<var>
															<FaComments />
														</var>
														<label>{comments?.length}</label>
													</div>
												</div>
												<div className="post-caption">
													<p>{post?.user?.username}</p>
													<p style={{ color: `var(--light-gray)` }}>•</p>
													<p style={{ color: `var(--light-gray)` }}>
														{new Date().getDate() -
															new Date(post?.updatedAt).getDate()}
														d ago
													</p>
													<p style={{ color: `var(--light-gray)` }}>•</p>
													<p>{post?.caption}</p>
												</div>
											</div>
										</div>
									) : null}
								</div>
							))}
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default Posts;
