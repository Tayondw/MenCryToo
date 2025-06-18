import React, { useState, useEffect } from "react";
import {
	Link,
	useLoaderData,
	useActionData,
	Form,
	useNavigation,
} from "react-router-dom";
import { Upload, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { User } from "../../../../types";
import "./UpdateProfile.css";

interface FormErrors {
	firstName?: string;
	lastName?: string;
	email?: string;
	username?: string;
	password?: string;
	confirmPassword?: string;
	bio?: string;
	profileImage?: string;
	userTags?: string;
	server?: string;
}

const UpdateProfile: React.FC = () => {
	const loaderData = useLoaderData() as { user: User } | null;
	const actionData = useActionData() as { errors?: FormErrors } | null;
	const navigation = useNavigation();

	const sessionUser = loaderData?.user;

	// Form state
	const [formData, setFormData] = useState({
		email: "",
		username: "",
		password: "",
		confirmPassword: "",
		firstName: "",
		lastName: "",
		bio: "",
		userTags: ["ANGER"] as string[],
	});

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [previewImage, setPreviewImage] = useState<string | null>(null);

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

	// Initialize form data from session user
	useEffect(() => {
		if (sessionUser) {
			setFormData({
				firstName: sessionUser.firstName || "",
				lastName: sessionUser.lastName || "",
				email: sessionUser.email || "",
				password: "",
				username: sessionUser.username || "",
				bio: sessionUser.bio || "",
				userTags: sessionUser.usersTags?.map((tag) => tag.name) || ["ANGER"],
				confirmPassword: "",
			});
		}
	}, [sessionUser]);

	const handleInputChange = (
		field: keyof typeof formData,
		value: string | string[],
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewImage(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const isSubmitting = navigation.state === "submitting";
	const errors = actionData?.errors || {};

	if (!sessionUser) {
		return (
			<div className="update-profile-container">
				<div className="update-profile-content">
					<p>Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="update-profile-container">
			<div className="update-profile-content">
				{/* Header */}
				<div className="profile-header">
					<Link to="/profile" className="back-link">
						<ArrowLeft size={20} />
						Back to Profile
					</Link>
					<h1 className="page-title">My Profile</h1>
				</div>

				<Form
					method="post"
					encType="multipart/form-data"
					className="profile-form"
				>
					<input type="hidden" name="intent" value="update-profile" />
					<input
						type="hidden"
						name="userId"
						value={sessionUser.id.toString()}
					/>

					{/* Profile Photo Section */}
					<div className="form-section">
						<div className="section-header">
							<div className="section-info">
								<h2 className="section-title">Profile Photo</h2>
								<p className="section-description">
									This image will be displayed on your profile
								</p>
							</div>
						</div>

						<div className="photo-upload-area">
							<div className="photo-container">
								<img
									src={previewImage || sessionUser.profileImage}
									alt="Profile"
									className="profile-photo"
								/>
							</div>

							<div className="upload-controls">
								<label htmlFor="profile-image" className="upload-btn">
									<Upload size={16} />
									Click to upload
								</label>
								<span className="upload-text">or drag and drop</span>
								<p className="upload-help">
									JPG, PNG, or GIF (Recommended size 1000x1000px)
								</p>
								<input
									id="profile-image"
									name="profileImage"
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									className="hidden-input"
								/>
							</div>
						</div>

						{errors.profileImage && (
							<div className="error-message">{errors.profileImage}</div>
						)}
					</div>

					{/* Personal Information Section */}
					<div className="form-section">
						<div className="section-header">
							<div className="section-info">
								<h2 className="section-title">Personal Information</h2>
								<p className="section-description">
									Update your personal details here.
								</p>
							</div>
						</div>

						<div className="form-grid">
							<div className="form-group">
								<label htmlFor="firstName">First Name</label>
								<input
									id="firstName"
									name="firstName"
									type="text"
									value={formData.firstName}
									onChange={(e) =>
										handleInputChange("firstName", e.target.value)
									}
									placeholder="Carter"
									className={errors.firstName ? "error" : ""}
								/>
								{errors.firstName && (
									<div className="error-message">{errors.firstName}</div>
								)}
							</div>

							<div className="form-group">
								<label htmlFor="lastName">Last Name</label>
								<input
									id="lastName"
									name="lastName"
									type="text"
									value={formData.lastName}
									onChange={(e) =>
										handleInputChange("lastName", e.target.value)
									}
									placeholder="Leadstream"
									className={errors.lastName ? "error" : ""}
								/>
								{errors.lastName && (
									<div className="error-message">{errors.lastName}</div>
								)}
							</div>

							<div className="form-group">
								<label htmlFor="email">Email</label>
								<input
									id="email"
									name="email"
									type="email"
									value={formData.email}
									onChange={(e) => handleInputChange("email", e.target.value)}
									placeholder="carter@domain.com"
									className={errors.email ? "error" : ""}
								/>
								{errors.email && (
									<div className="error-message">{errors.email}</div>
								)}
							</div>

							<div className="form-group">
								<label htmlFor="username">Username</label>
								<input
									id="username"
									name="username"
									type="text"
									value={formData.username}
									onChange={(e) =>
										handleInputChange("username", e.target.value)
									}
									placeholder="carter-leadstream"
									className={errors.username ? "error" : ""}
								/>
								{errors.username && (
									<div className="error-message">{errors.username}</div>
								)}
							</div>
						</div>
					</div>

					{/* Password Section */}
					<div className="form-section">
						<div className="section-header">
							<div className="section-info">
								<h2 className="section-title">Password</h2>
								<p className="section-description">
									Leave blank to keep current password
								</p>
							</div>
						</div>

						<div className="form-grid">
							<div className="form-group">
								<label htmlFor="password">New Password</label>
								<div className="password-input">
									<input
										id="password"
										name="password"
										type={showPassword ? "text" : "password"}
										value={formData.password}
										onChange={(e) =>
											handleInputChange("password", e.target.value)
										}
										placeholder="••••••••••••"
										className={`password-field ${
											errors.password ? "error" : ""
										}`}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="password-toggle"
									>
										{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
									</button>
								</div>
								{errors.password && (
									<div className="error-message">{errors.password}</div>
								)}
							</div>

							<div className="form-group">
								<label htmlFor="confirmPassword">Confirm Password</label>
								<div className="password-input">
									<input
										id="confirmPassword"
										name="confirmPassword"
										type={showConfirmPassword ? "text" : "password"}
										value={formData.confirmPassword}
										onChange={(e) =>
											handleInputChange("confirmPassword", e.target.value)
										}
										placeholder="••••••••••••"
										className={`password-field ${
											errors.confirmPassword ? "error" : ""
										}`}
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="password-toggle"
									>
										{showConfirmPassword ? (
											<EyeOff size={16} />
										) : (
											<Eye size={16} />
										)}
									</button>
								</div>
								{errors.confirmPassword && (
									<div className="error-message">{errors.confirmPassword}</div>
								)}
							</div>
						</div>
					</div>

					{/* Bio Section */}
					<div className="form-section">
						<div className="section-header">
							<div className="section-info">
								<h2 className="section-title">About You</h2>
								<p className="section-description">
									Tell us about yourself and why you're here
								</p>
							</div>
						</div>

						<div className="form-group">
							<label htmlFor="bio">Bio</label>
							<textarea
								id="bio"
								name="bio"
								value={formData.bio}
								onChange={(e) => handleInputChange("bio", e.target.value)}
								placeholder="Hi, my name is Demo User and I have anger management issues."
								rows={4}
								className={errors.bio ? "error" : ""}
							/>
							<div className="character-count">{formData.bio.length}/500</div>
							{errors.bio && <div className="error-message">{errors.bio}</div>}
						</div>
					</div>

					{/* Tags Section */}
					<div className="form-section">
						<div className="section-header">
							<div className="section-info">
								<h2 className="section-title">Your Tags</h2>
								<p className="section-description">
									Select topics that resonate with you. This helps connect you
									with similar users
								</p>
							</div>
						</div>

						<div className="tags-grid">
							{tagOptions.map((tag) => (
								<label key={tag} className="tag-checkbox">
									<input
										type="checkbox"
										name="userTags"
										value={tag}
										checked={formData.userTags.includes(tag)}
										onChange={(e) => {
											if (e.target.checked) {
												handleInputChange("userTags", [
													...formData.userTags,
													tag,
												]);
											} else {
												handleInputChange(
													"userTags",
													formData.userTags.filter((t) => t !== tag),
												);
											}
										}}
									/>
									<span className="checkmark"></span>
									<span className="tag-label">{tag}</span>
								</label>
							))}
						</div>

						{sessionUser.usersTags && sessionUser.usersTags.length > 0 && (
							<div className="current-tags">
								<h4>Your Current Tags</h4>
								<div className="current-tags-list">
									{sessionUser.usersTags.map((tag) => (
										<span key={tag.id} className="current-tag">
											{tag.name}
										</span>
									))}
								</div>
							</div>
						)}

						{errors.userTags && (
							<div className="error-message">{errors.userTags}</div>
						)}
					</div>

					{/* Server Error Display */}
					{errors.server && (
						<div className="form-section">
							<div
								className="error-message"
								style={{ textAlign: "center", fontSize: "1rem" }}
							>
								{errors.server}
							</div>
						</div>
					)}

					{/* Final Form Actions */}
					<div className="final-actions">
						<Link to="/profile" className="cancel-btn">
							Cancel
						</Link>
						<button
							type="submit"
							className="save-btn primary"
							disabled={isSubmitting}
						>
							{isSubmitting ? "Updating..." : "Update Profile"}
						</button>
					</div>
				</Form>
			</div>
		</div>
	);
};

export default UpdateProfile;
