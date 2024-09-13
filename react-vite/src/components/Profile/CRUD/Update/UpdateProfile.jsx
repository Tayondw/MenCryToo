import {
	useActionData,
	Form,
	useNavigate,
	useLoaderData,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Footer from "../../../Footer";
import "./UpdateProfile.css";

const UpdateProfile = () => {
	const errors = useActionData();
	const sessionUser = useSelector((state) => state.session.user);
	const navigate = useNavigate();
	const userDetails = useLoaderData();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [bio, setBio] = useState("");
	const [userTags, setUserTags] = useState(["ANGER"]);
	// const [profileImage, setProfileImage] = useState(userDetails.profileImage);

	// console.log("user loader data", userDetails);

	// Ensure user is logged in
	useEffect(() => {
		if (!sessionUser) {
			navigate("/");
		}
	}, [sessionUser, navigate]);

	useEffect(() => {
		if (userDetails) {
			setFirstName(userDetails.firstName || "");
			setLastName(userDetails.lastName || "");
			setBio(userDetails.bio || "");
			setUserTags(userDetails.userTags || "");
			// setProfileImage(userDetails.profileImage || "");
		}
	}, [userDetails]);

	return (
		<div id="create-group">
                  {sessionUser ? (
                        <>
                          <Form
					method="post"
					encType="multipart/form-data"
					type="file"
					action={`/users/${sessionUser.id}/profile/update`}
					className="create-group"
				>
					<div id="header">
						<h1>Create a Profile</h1>
						<h2>
							We&apos;ll walk you through a few steps to build your presence on
							the site
						</h2>
						<hr />
					</div>
					<div id="section-1-create">
						<div id="set-first-name">
							<h2>What is your first name?</h2>
							<div id="first-name-input">
								<input
									id="first-name-input-text"
									type="text"
									placeholder="First Name"
									name="firstName"
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
							<h2>What is your last name?</h2>
							<div id="state-input">
								<input
									id="last-name-input-text"
									type="text"
									placeholder="Last Name"
									name="lastName"
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
					</div>
					<hr />
					<div id="section-3-create">
						<div id="set-description">
							<h2>Describe why you are are.</h2>
							<div className="caption">
								<p>
									People will see this when we promote you, but you&apos;ll be
									able to add to it later, too.
									<br />
									<br />
									1. What are you here for?
									<br />
									2. What group do you want to join?
									<br />
									3. What do you hope to gain out of this?
								</p>
							</div>
							<div id="bio-input">
								<textarea
									name="bio"
									id="group-name-textarea"
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
					<div id="event-status">
						<label>
							Select the one or more tags that best describes you
							<select
								name="userTags"
								id="event-privacy-select"
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
						</label>
						{errors?.userTags && (
							<p style={{ color: "red" }} className="errors">
								{errors.userTags}
							</p>
						)}
					</div>
					<hr />
					<input
						name="currentProfileImage"
						type="hidden"
						value={userDetails.profileImage || ""}
					/>
					<input name="profileImage" type="file" accept="image/*" />
					{errors?.profileImage && (
						<p style={{ color: "red" }} className="errors">
							{errors.profileImage}
						</p>
					)}
					<hr />
					<div id="section-5-create">
						<button
							id="create-group-submit"
							type="submit"
							name="intent"
							value="update-profile"
						>
							Update Profile
						</button>
						<input type="hidden" name="userId" value={sessionUser.id} />
					</div>
                        </Form>
                        {/* {userDetails.profileImage && <img src={userDetails?.profileImage} alt="Group" />}     */}
                        </>
				
			) : (
				<h1>Please log in to update your profile!</h1>
			)}
			<Footer />
		</div>
	);
};

export default UpdateProfile;
