import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Upload, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { RootState } from "../../../../types";
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
}

type FormFieldValue = string | string[] | File | null;

const UpdateProfile: React.FC = () => {
	const navigate = useNavigate();
	const sessionUser = useSelector((state: RootState) => state.session.user);

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
		profileImage: null as File | null,
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
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
		if (!sessionUser) {
			navigate("/");
			return;
		}

		setFormData({
			firstName: sessionUser.firstName || "",
			lastName: sessionUser.lastName || "",
			email: sessionUser.email || "",
			password: "",
			username: sessionUser.username || "",
			bio: sessionUser.bio || "",
			userTags: sessionUser.usersTags?.map((tag) => tag.name) || ["ANGER"],
			confirmPassword: "",
			profileImage: null,
		});
	}, [sessionUser, navigate]);

	const handleInputChange = (
		field: keyof typeof formData,
		value: FormFieldValue,
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setFormData((prev) => ({ ...prev, profileImage: file }));

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewImage(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const validateForm = (): boolean => {
		const newErrors: FormErrors = {};

		if (
			!formData.firstName ||
			formData.firstName.length < 3 ||
			formData.firstName.length > 20
		) {
			newErrors.firstName = "First name must be between 3 and 20 characters";
		}

		if (
			!formData.lastName ||
			formData.lastName.length < 3 ||
			formData.lastName.length > 20
		) {
			newErrors.lastName = "Last name must be between 3 and 20 characters";
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!formData.email || !emailRegex.test(formData.email)) {
			newErrors.email = "Please enter a valid email address";
		} else if (formData.email.length > 50) {
			newErrors.email = "Email must be less than 50 characters";
		}

		if (
			!formData.username ||
			formData.username.length < 3 ||
			formData.username.length > 20
		) {
			newErrors.username = "Username must be between 3 and 20 characters";
		}

		if (
			formData.password &&
			(formData.password.length < 8 || formData.password.length > 25)
		) {
			newErrors.password = "Password must be between 8 and 25 characters";
		}

		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		if (
			!formData.bio ||
			formData.bio.length < 50 ||
			formData.bio.length > 500
		) {
			newErrors.bio = "Bio must be between 50 and 500 characters";
		}

		if (formData.userTags.length === 0) {
			newErrors.userTags = "Please select at least one tag";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		setIsSubmitting(true);

		try {
			const submitFormData = new FormData();
			submitFormData.append("intent", "update-profile");
			submitFormData.append("userId", sessionUser?.id.toString() || "");
			submitFormData.append("firstName", formData.firstName);
			submitFormData.append("lastName", formData.lastName);
			submitFormData.append("email", formData.email);
			submitFormData.append("username", formData.username);
			submitFormData.append("bio", formData.bio);

			if (formData.password) {
				submitFormData.append("password", formData.password);
				submitFormData.append("confirmPassword", formData.confirmPassword);
			}

			formData.userTags.forEach((tag) => {
				submitFormData.append("userTags", tag);
			});

			if (formData.profileImage) {
				submitFormData.append("profileImage", formData.profileImage);
			}

			const response = await fetch(
				`/api/users/${sessionUser?.id}/profile/update`,
				{
					method: "POST",
					body: submitFormData,
				},
			);

			if (response.ok) {
				navigate("/profile");
			} else {
				const errorData = await response.json();
				setErrors(errorData);
			}
		} catch (error) {
			console.error("Error updating profile:", error);
			setErrors({ bio: "An error occurred while updating your profile" });
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!sessionUser) {
		return null;
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

				<form onSubmit={handleSubmit} className="profile-form">
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
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									className="hidden-input"
								/>
							</div>
						</div>

						<div className="section-actions">
							<button type="button" className="cancel-btn">
								Cancel
							</button>
							<button type="button" className="save-btn">
								Save
							</button>
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

						<div className="section-actions">
							<button type="button" className="cancel-btn">
								Cancel
							</button>
							<button type="button" className="save-btn">
								Save
							</button>
						</div>
					</div>

					{/* Password Section */}
					<div className="form-section">
						<div className="section-header">
							<div className="section-info">
								<h2 className="section-title">Password</h2>
								<p className="section-description">
									Enter your current password to make update
								</p>
							</div>
						</div>

						<div className="form-grid">
							<div className="form-group">
								<label htmlFor="currentPassword">Current Password</label>
								<div className="password-input">
									<input
										id="currentPassword"
										type="password"
										placeholder="Ltmp2024@#"
										className="password-field"
									/>
									<button type="button" className="password-toggle">
										<Eye size={16} />
									</button>
								</div>
							</div>

							<div className="form-group">
								<label htmlFor="password">New Password</label>
								<div className="password-input">
									<input
										id="password"
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

						<div className="section-actions">
							<button type="button" className="cancel-btn">
								Cancel
							</button>
							<button type="button" className="save-btn">
								Save
							</button>
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
								value={formData.bio}
								onChange={(e) => handleInputChange("bio", e.target.value)}
								placeholder="Hi, my name is Demo User and I have anger management issues."
								rows={4}
								className={errors.bio ? "error" : ""}
							/>
							<div className="character-count">{formData.bio.length}/500</div>
							{errors.bio && <div className="error-message">{errors.bio}</div>}
						</div>

						<div className="section-actions">
							<button type="button" className="cancel-btn">
								Cancel
							</button>
							<button type="button" className="save-btn">
								Save
							</button>
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

						<div className="section-actions">
							<button type="button" className="cancel-btn">
								Cancel
							</button>
							<button type="button" className="save-btn">
								Save
							</button>
						</div>
						{errors.userTags && (
							<div className="error-message">{errors.userTags}</div>
						)}
					</div>

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
				</form>
			</div>
		</div>
	);
};

export default UpdateProfile;
