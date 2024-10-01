import { useActionData, Form, Link, redirect } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "./UpdateProfile.css";

const UpdateProfile = () => {
	const errors = useActionData();
	const sessionUser = useSelector((state) => state.session.user);
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [bio, setBio] = useState("");
	const [userTags, setUserTags] = useState(["ANGER"]);

	// Ensure user is logged in
	useEffect(() => {
		if (!sessionUser) {
                  // return window.location.href("/");
                  redirect("/")
		}
	}, [sessionUser]);

	useEffect(() => {
		if (sessionUser) {
			setFirstName(sessionUser.firstName || "");
			setLastName(sessionUser.lastName || "");
			setEmail(sessionUser.email || "");
			setPassword(sessionUser.password || "");
			setUsername(sessionUser.username || "");
			setBio(sessionUser.bio || "");
			setUserTags(sessionUser.userTags || "");
		}
	}, [sessionUser]);

	return (
		<div id="new-group">
			<img
				src="https://mencrytoo.s3.amazonaws.com/signup.png"
				alt="signup"
				id="fit-image-content"
			/>
			<Form
				method="post"
				encType="multipart/form-data"
				type="file"
				action={`/users/${sessionUser?.id}/profile/update`}
                        className="create-group-form"
                        // style={{marginTop: `50px`}}
			>
				<div id="header">
					<h3>Update Profile</h3>
					<p>Update your profile information</p>
					<hr />
				</div>
				<div id="section-0-create">
					<div id="set-first-name">
						<h3 style={{ fontSize: `15px` }}>First Name</h3>
						<div id="first-name-input">
							<input
                                                id="first-name-input-text"
                                                name="firstName"
								type="text"
								placeholder="First Name"
								value={firstName}
								onChange={(event) => setFirstName(event.target.value)}
							/>
						</div>
					</div>
					{errors?.firstName && (
						<p style={{ color: "red" }} className="errors">
							{errors.firstName}
						</p>
					)}
					<div id="set-last-name">
						<h3 style={{ fontSize: `15px` }}>Last Name</h3>
						<div id="state-input">
							<input
                                                id="last-name-input-text"
                                                name="lastName"
								type="text"
								placeholder="Last Name"
								value={lastName}
								onChange={(event) => setLastName(event.target.value)}
							/>
						</div>
					</div>
					{errors?.lastName && (
						<p style={{ color: "red" }} className="errors">
							{errors.lastName}
						</p>
					)}
					<div id="set-email">
						<h3 style={{ fontSize: `15px` }}>Email</h3>
						<div id="email-input">
							<input
                                                id="email-input-text"
                                                name="email"
								type="text"
								placeholder="Email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
							/>
						</div>
					</div>
					{errors?.email && (
						<p style={{ color: "red" }} className="errors">
							{errors.email}
						</p>
					)}
					<div id="set-username">
						<h3 style={{ fontSize: `15px` }}>Username</h3>
						<div id="username-input">
							<input
								id="username-input-text"
								type="text"
                                                placeholder="Username"
                                                name="username"
								value={username}
								onChange={(event) => setUsername(event.target.value)}
							/>
						</div>
					</div>
					{errors?.username && (
						<p style={{ color: "red" }} className="errors">
							{errors.username}
						</p>
					)}
					<div id="set-password">
						<h3 style={{ fontSize: `15px` }}>Change Password</h3>
						<div id="password-input">
							<input
								id="password-input-text"
								type="password"
                                                placeholder="Password"
                                                name="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
						</div>
					</div>
					{errors?.password && (
						<p style={{ color: "red" }} className="errors">
							{errors.password}
						</p>
					)}
					<div id="set-confirm-password">
						<h3 style={{ fontSize: `15px` }}>Confirm Password</h3>
						<div id="password-input">
							<input
								id="confirm-password-input-text"
                                                type="password"
                                                name="confirmPassword"
								placeholder="Confirm Password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
							/>
						</div>
					</div>
					{errors?.confirmPassword && (
						<p style={{ color: "red" }} className="errors">
							{errors.confirmPassword}
						</p>
					)}
				</div>
				<hr />
				<div id="section-3-create">
					<div id="set-description">
						<h3 style={{ fontSize: `17px` }}>Describe why you are here</h3>
						<br />
						<div id="bio-input">
							<textarea
								name="bio"
								id="profile-desc-textarea"
								placeholder="Please write at least 50 characters"
								value={bio}
								onChange={(event) => setBio(event.target.value)}
							></textarea>
						</div>
					</div>
					{errors?.bio && (
						<p style={{ color: "red" }} className="errors">
							{errors.bio}
						</p>
					)}
				</div>
				<hr />
				<div id="event-status">
                              <h3 style={{ fontSize: `17px` }}>Select one or more tags - Update</h3>
                              <p>This will reset your current tags - you must have a tag to associate yourself with</p>
					<label>
						<select
                                          name="userTags"
                                          style={{width: `225px`}}
							id="tag-select"
							value={userTags}
							multiple={true}
							onChange={(event) => {
								const options = [...event.target.selectedOptions];
								const values = options.map((option) => option.value);
								setUserTags(values);
							}}
						>
							<option value="">(select one or more)</option>
							<option value="ANGER">ANGER</option>
							<option value="ANXIETY">ANXIETY</option>
							<option value="DEPRESSION">DEPRESSION</option>
							<option value="SUBSTANCE ABUSE">SUBSTANCE ABUSE</option>
							<option value="STRESS">STRESS</option>
							<option value="TRAUMA">TRAUMA</option>
							<option value="RELATIONSHIPS">RELATIONSHIPS</option>
							<option value="GRIEF">GRIEF</option>
							<option value="COMING OUT">COMING OUT</option>
							<option value="SUICIDAL THOUGHTS">SUICIDAL THOUGHTS</option>
						</select>
						<div
							style={{
								display: `flex`,
								flexWrap: `wrap`,
								flexDirection: `column`,
								width: `600px`,
							}}
						>
							<h3 style={{fontSize: `12px`}}>Your Current Tags</h3>
							<div style={{ display: `flex`, flexWrap: `wrap`, padding: 0}}>
								{sessionUser?.usersTags?.map((tag) => (
									<div key={tag?.id} style={{padding: 0}}>
										<h5
											style={{
												display: `flex`,
												fontSize: `12px`,
                                                                        paddingLeft: `9px`,
                                                                        paddingRight: `9px`,
                                                                        margin: 0,
												flexDirection: `row`,
												width: `fit-content`,
											}}
										>
											{tag?.name}
										</h5>
									</div>
								))}
							</div>
						</div>
					</label>

					{errors?.userTags && (
						<p style={{ color: "red" }} className="errors">
							{errors.userTags}
						</p>
					)}
				</div>
				<hr />
				<div id="create-group-image-upload">
					<h3 style={{ fontSize: `15px` }}>Change your image</h3>
					<label htmlFor="file-upload" className="custom-file-upload">
						Choose an image
					</label>
					<input
						name="profileImage"
						type="file"
						accept="image/*"
						id="file-upload"
					/>
					{errors?.profileImage && (
						<p style={{ color: "red" }} className="errors">
							{errors.profileImage}
						</p>
					)}
				</div>
				<hr />
				<div id="signup-section-6">
					<button
						id="create-group-submit"
						type="submit"
						name="intent"
						value="update-profile"
					>
						Update Profile
					</button>
					<Link to="/profile">
						<button id="update-group-cancel">Cancel</button>
					</Link>
					<input type="hidden" name="userId" value={sessionUser?.id} />
				</div>
			</Form>
		</div>
	);
};

export default UpdateProfile;
