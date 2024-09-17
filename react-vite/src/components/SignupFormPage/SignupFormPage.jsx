import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate, Form, Link } from "react-router-dom";
import { thunkAuthenticate } from "../../redux/session";

function SignupFormPage() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const sessionUser = useSelector((state) => state.session.user);
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [bio, setBio] = useState("");
	const [userTags, setUserTags] = useState(["ANGER"]);
	const [profileImage, setProfileImage] = useState(null);
	const [errors, setErrors] = useState({});
	const isDisabled = username.length < 3 || password.length < 8;

	useEffect(() => {
		dispatch(thunkAuthenticate());
	}, [dispatch]);

	if (sessionUser) return <Navigate to="/" replace={true} />;

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			return setErrors({
				confirmPassword:
					"Confirm Password field must be the same as the Password field",
			});
		}

		const error = {};
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (email.length > 50)
			error.email = "Email must be less than 50 characters";
		if (!emailRegex.test(email) || email.length <= 0)
			error.email = "Invalid email";
		if (username.length > 20)
			error.username =
				"Username too long! Come on, who ya tryna confuse? Yourself?";
		if (username.length < 3)
			error.username = "Username is too short! At least 3 characters man!";
		if (!username.length)
			error.username =
				"Now you know you need a username, I need 3 to 20 characters for you to signup!";
		if (password.length > 25) error.password = "Password is too long!";
		if (password.length < 8) error.password = "Password is too short!";
		if (password.length < 0) error.password = "Password is required";
		if (!firstName.length || firstName.length < 3 || firstName.length > 20)
			error.firstName = "First name must be between 3 and 20 characters";
		if (!lastName.length || lastName.length < 3 || lastName.length > 20)
			error.lastName = "Last name must be between 3 and 20 characters";
		if (!bio.length || bio.length < 50 || bio.length > 500)
			error.bio = "Please enter at least 50 characters describing yourself";
		if (!profileImage) error.profileImage = "Please add a profile image";
		if (!userTags)
			error.userTags = "Please select 1 or more tags that fit your description";
		if (Object.keys(error).length > 0) {
			return setErrors(error);
		}

		const formData = new FormData();
		formData.append("email", email);
		formData.append("username", username);
		formData.append("password", password);
		formData.append("firstName", firstName);
		formData.append("lastName", lastName);
		formData.append("bio", bio);
		formData.append("profileImage", profileImage);
		userTags.forEach((tag) => formData.append("userTags", tag));

		const response = await fetch("/api/auth/signup", {
			method: "POST",
			body: formData,
		});
		if (response.ok) {
                  await response.json();
                  dispatch(thunkAuthenticate())
                  navigate("/");
		} else {
			console.error("Error: ", error);
		}
	};

	return (
		<div id="new-group">
			{errors.server && <p>{errors.server}</p>}
			<img src="" alt="" />
			<Form
				onSubmit={handleSubmit}
				className="create-group"
				encType="multipart/form-data"
				type="file"
				method="post"
				action="/signup"
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
								value={firstName}
								onChange={(event) => setFirstName(event.target.value)}
								required
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
								value={lastName}
								onChange={(event) => setLastName(event.target.value)}
								required
							/>
						</div>
					</div>
					{errors?.lastName && (
						<p style={{ color: "red" }} className="errors">
							{errors.lastName}
						</p>
					)}
					<div id="set-email">
						<h2>What is your email?</h2>
						<div id="email-input">
							<input
								id="email-input-text"
								type="text"
								placeholder="Email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
							/>
						</div>
					</div>
					{errors?.email && (
						<p style={{ color: "red" }} className="errors">
							{errors.email}
						</p>
					)}
					<div id="set-username">
						<h2>What would you like to be your username?</h2>
						<div id="username-input">
							<input
								id="username-input-text"
								type="text"
								placeholder="Username"
								value={username}
								onChange={(event) => setUsername(event.target.value)}
								required
							/>
						</div>
					</div>
					{errors?.username && (
						<p style={{ color: "red" }} className="errors">
							{errors.username}
						</p>
					)}
					<div id="set-password">
						<h2>Password</h2>
						<div id="password-input">
							<input
								id="password-input-text"
								type="password"
								placeholder="Password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								required
							/>
						</div>
					</div>
					{errors?.password && (
						<p style={{ color: "red" }} className="errors">
							{errors.password}
						</p>
					)}
					<div id="set-confirm-password">
						<h2>Confirm Password</h2>
						<div id="password-input">
							<input
								id="confirm-password-input-text"
								type="password"
								placeholder="Confirm Password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								required
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
				<div id="create-group-image-upload">
					<h3 style={{ fontSize: `15px` }}>Upload an image</h3>
					<label htmlFor="file-upload" className="custom-file-upload">
						Choose an image
					</label>
					<input
						name="profileImage"
						type="file"
						accept="image/*"
						id="file-upload"
						onChange={(event) => setProfileImage(event.target.files[0])}
						// value={profileImage}
						// onChange={(event) => setProfileImage(event.target.value)}
					/>
					{/* <input type="hidden" name="profileImage" value={profileImage} /> */}
					{errors?.profileImage && (
						<p style={{ color: "red" }} className="errors">
							{errors.profileImage}
						</p>
					)}
				</div>
				<hr />
				<button
					id="create-group-submit"
					type="submit"
					style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
					disabled={isDisabled}
				>
					Sign Up
				</button>
				<Link to="/groups">
					<button id="update-group-cancel">Cancel</button>
				</Link>
			</Form>
		</div>
	);
}

export default SignupFormPage;
