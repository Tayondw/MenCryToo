import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	Navigate,
	useNavigate,
	Form,
	Link,
	useLocation,
} from "react-router-dom";
import { thunkAuthenticate } from "../../redux/session";
import {
	Eye,
	EyeOff,
	Upload,
	User,
	Mail,
	Lock,
	FileText,
	Tag,
	ArrowLeft,
} from "lucide-react";
import OpenModalMenuItem from "../Navigation/OpenModalMenuItem";
import LoginFormModal from "../LoginFormModal";
// import "./SignupFormPage.css";

function SignupFormPage() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const sessionUser = useSelector((state) => state.session.user);

	// Form state
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
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [previewImage, setPreviewImage] = useState(null);

	const isDisabled = username.length < 3 || password.length < 8;

	const from = location.state?.from || "/";
	const groupId = location.state?.groupId;
	const eventId = location.state?.eventId;

	const tagOptions = [
		"ANGER",
		"ANXIETY",
		"DEPRESSION",
		"SUBSTANCE ABUSE",
		"STRESS",
		"TRAUMA",
		"RELATIONSHIPS",
		"GRIEF",
		"COMING OUT",
		"SUICIDAL THOUGHTS",
	];

	useEffect(() => {
		dispatch(thunkAuthenticate());
	}, [dispatch]);

	if (sessionUser) return <Navigate to={from} replace={true} />;

	const handleImageChange = (event) => {
		const file = event.target.files[0];
		setProfileImage(file);

		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewImage(e.target.result);
			};
			reader.readAsDataURL(file);
		}
	};

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
			const data = await response.json();
			dispatch(thunkAuthenticate());

			if (groupId) {
				await fetch(`/api/groups/${groupId}/join-group`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ group_id: groupId, user_id: data.id }),
				});
			}

			if (eventId) {
				await fetch(`/api/events/${eventId}/attend-event`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ event_id: eventId, user_id: data.id }),
				});
			}

			navigate(from);
		} else {
			console.error("Error: ", error);
		}
	};

	return (
		<div className="signup-container">
			{/* Back Button */}
			<Link to="/" className="back-button">
				<ArrowLeft size={20} />
				Back to Home
			</Link>

			<div className="signup-content">
				{/* Left Side - Image and Content */}
				<div className="signup-left-section">
					{/* Hero Content */}
					<div className="hero-content">
						<h2 className="hero-title">Join Our Community</h2>
						<p className="hero-subtitle">
							Take the first step towards better mental health and connect with
							others who understand your journey.
						</p>
						<div className="feature-list">
							<div className="feature-item">
								<div className="feature-icon">✓</div>
								<span>Safe and supportive environment</span>
							</div>
							<div className="feature-item">
								<div className="feature-icon">✓</div>
								<span>Connect with similar experiences</span>
							</div>
							<div className="feature-item">
								<div className="feature-icon">✓</div>
								<span>Professional guidance available</span>
							</div>
						</div>
					</div>

					{/* Image Section */}
					<div className="signup-image-section">
						<img
							src="https://mencrytoo.s3.amazonaws.com/signup.png"
							alt="Men supporting each other"
							className="signup-hero-image"
						/>
					</div>
				</div>

				{/* Right Side - Form */}
				<div className="signup-form-section">
					<div className="form-container">
						<div className="form-header">
							<h1 className="form-title">Create Your Profile</h1>
							<p className="form-subtitle">
								We'll walk you through a few steps to build your presence on the
								site
							</p>
						</div>

						{errors.server && (
							<div className="error-banner">{errors.server}</div>
						)}

						<Form
							onSubmit={handleSubmit}
							className="signup-form"
							encType="multipart/form-data"
						>
							{/* Personal Information Section */}
							<div className="form-section">
								<div className="section-header">
									<User size={20} />
									<h3>Personal Information</h3>
								</div>

								<div className="form-grid">
									<div className="form-group">
										<label htmlFor="firstName">First Name</label>
										<input
											id="firstName"
											type="text"
											placeholder="Enter your first name"
											value={firstName}
											onChange={(e) => setFirstName(e.target.value)}
											className={errors.firstName ? "error" : ""}
											required
										/>
										{errors.firstName && (
											<span className="error-text">{errors.firstName}</span>
										)}
									</div>

									<div className="form-group">
										<label htmlFor="lastName">Last Name</label>
										<input
											id="lastName"
											type="text"
											placeholder="Enter your last name"
											value={lastName}
											onChange={(e) => setLastName(e.target.value)}
											className={errors.lastName ? "error" : ""}
											required
										/>
										{errors.lastName && (
											<span className="error-text">{errors.lastName}</span>
										)}
									</div>
								</div>
							</div>

							{/* Account Information Section */}
							<div className="form-section">
								<div className="section-header">
									<Mail size={20} />
									<h3>Account Information</h3>
								</div>

								<div className="form-group">
									<label htmlFor="email">Email Address</label>
									<input
										id="email"
										type="email"
										placeholder="Enter your email address"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className={errors.email ? "error" : ""}
										required
									/>
									{errors.email && (
										<span className="error-text">{errors.email}</span>
									)}
								</div>

								<div className="form-group">
									<label htmlFor="username">Username</label>
									<input
										id="username"
										type="text"
										placeholder="Choose a username"
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										className={errors.username ? "error" : ""}
										required
									/>
									{errors.username && (
										<span className="error-text">{errors.username}</span>
									)}
								</div>

								<div className="form-grid">
									<div className="form-group">
										<label htmlFor="password">Password</label>
										<div className="password-input">
											<input
												id="password"
												type={showPassword ? "text" : "password"}
												placeholder="Create a password"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												className={errors.password ? "error" : ""}
												required
											/>
											<button
												type="button"
												className="password-toggle"
												onClick={() => setShowPassword(!showPassword)}
											>
												{showPassword ? (
													<EyeOff size={18} />
												) : (
													<Eye size={18} />
												)}
											</button>
										</div>
										{errors.password && (
											<span className="error-text">{errors.password}</span>
										)}
									</div>

									<div className="form-group">
										<label htmlFor="confirmPassword">Confirm Password</label>
										<div className="password-input">
											<input
												id="confirmPassword"
												type={showConfirmPassword ? "text" : "password"}
												placeholder="Confirm your password"
												value={confirmPassword}
												onChange={(e) => setConfirmPassword(e.target.value)}
												className={errors.confirmPassword ? "error" : ""}
												required
											/>
											<button
												type="button"
												className="password-toggle"
												onClick={() =>
													setShowConfirmPassword(!showConfirmPassword)
												}
											>
												{showConfirmPassword ? (
													<EyeOff size={18} />
												) : (
													<Eye size={18} />
												)}
											</button>
										</div>
										{errors.confirmPassword && (
											<span className="error-text">
												{errors.confirmPassword}
											</span>
										)}
									</div>
								</div>
							</div>

							{/* About You Section */}
							<div className="form-section">
								<div className="section-header">
									<FileText size={20} />
									<h3>About You</h3>
								</div>

								<div className="form-group">
									<label htmlFor="bio">Tell us why you're here</label>
									<textarea
										id="bio"
										placeholder="Please write at least 50 characters describing yourself and why you're joining our community..."
										value={bio}
										onChange={(e) => setBio(e.target.value)}
										className={errors.bio ? "error" : ""}
										rows={4}
									/>
									<div className="character-count">
										{bio.length}/500 characters
									</div>
									{errors.bio && (
										<span className="error-text">{errors.bio}</span>
									)}
								</div>
							</div>

							{/* Tags Section */}
							<div className="form-section">
								<div className="section-header">
									<Tag size={20} />
									<h3>Your Interests</h3>
								</div>

								<div className="form-group">
									<label>Select topics that resonate with you</label>
									<div className="tags-grid">
										{tagOptions.map((tag) => (
											<label key={tag} className="tag-checkbox">
												<input
													type="checkbox"
													value={tag}
													checked={userTags.includes(tag)}
													onChange={(e) => {
														if (e.target.checked) {
															setUserTags([...userTags, tag]);
														} else {
															setUserTags(userTags.filter((t) => t !== tag));
														}
													}}
												/>
												<span className="checkmark"></span>
												<span className="tag-label">{tag}</span>
											</label>
										))}
									</div>
									{errors.userTags && (
										<span className="error-text">{errors.userTags}</span>
									)}
								</div>
							</div>

							{/* Profile Image Section */}
							<div className="form-section">
								<div className="section-header">
									<Upload size={20} />
									<h3>Profile Picture</h3>
								</div>

								<div className="form-group">
									<label>Upload your profile image</label>
									<div className="image-upload-area">
										{previewImage ? (
											<div className="image-preview">
												<img
													src={previewImage}
													alt="Preview"
													className="preview-image"
												/>
												<button
													type="button"
													className="change-image-btn"
													onClick={() =>
														document.getElementById("file-upload").click()
													}
												>
													Change Image
												</button>
											</div>
										) : (
											<div
												className="upload-placeholder"
												onClick={() =>
													document.getElementById("file-upload").click()
												}
											>
												<Upload size={32} />
												<p>Click to upload or drag and drop</p>
												<span>JPG, PNG or GIF (max 5MB)</span>
											</div>
										)}
										<input
											id="file-upload"
											type="file"
											accept="image/*"
											onChange={handleImageChange}
											style={{ display: "none" }}
										/>
									</div>
									{errors.profileImage && (
										<span className="error-text">{errors.profileImage}</span>
									)}
								</div>
							</div>

							{/* Form Actions */}
							<div className="form-actions">
								<Link to="/" className="cancel-btn">
									Cancel
								</Link>
								<button
									type="submit"
									className={`submit-btn ${isDisabled ? "disabled" : ""}`}
									disabled={isDisabled}
								>
									Create Account
								</button>
							</div>

							{/* Login Link */}
							<div className="login-link">
								<p>Already have an account?</p>
								<OpenModalMenuItem
									itemText="Log in here"
									className="login-modal-trigger"
									modalComponent={<LoginFormModal navigate={navigate} />}
								/>
							</div>
						</Form>
					</div>
				</div>
			</div>
		</div>
	);
}

export default SignupFormPage;
