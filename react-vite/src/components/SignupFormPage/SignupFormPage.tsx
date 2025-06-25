import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
	Navigate,
	Form,
	Link,
	useLocation,
	useActionData,
	useNavigation,
} from "react-router-dom";
import {
	Eye,
	EyeOff,
	Upload,
	User,
	Mail,
	FileText,
	Tag,
	ArrowLeft,
	Check,
} from "lucide-react";
import OpenModalMenuItem from "../Navigation/OpenModalMenuItem/OpenModalMenuItem";
import LoginFormModal from "../LoginFormModal";
import { RootState } from "../../types";

interface LocationState {
	from?: string;
	groupId?: string;
	eventId?: string;
}

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

const SignupFormPage: React.FC = () => {
	const location = useLocation();
	const navigation = useNavigation();
	const actionData = useActionData() as { errors?: FormErrors } | null;
	const sessionUser = useSelector((state: RootState) => state.session.user);

	// Form state - only for UI, not submission logic
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

	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [showConfirmPassword, setShowConfirmPassword] =
		useState<boolean>(false);
	const [previewImage, setPreviewImage] = useState<string | null>(null);

	const isSubmitting = navigation.state === "submitting";
	const isDisabled =
		formData.username.length < 3 || formData.password.length < 8;

	const locationState = location.state as LocationState | null;
	const from = locationState?.from || "/";

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

	if (sessionUser) return <Navigate to={from} replace={true} />;

	const handleInputChange = (
		field: keyof typeof formData,
		value: string | string[],
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewImage(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const errors = actionData?.errors || {};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
			{/* Back Button */}
			<Link
				to="/"
				className="fixed top-28 left-8 z-20 inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-slate-600 hover:text-slate-900 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 max-xl:relative max-xl:top-16 lg:fixed lg:top-28"
			>
				<ArrowLeft size={20} />
				Back to Home
			</Link>

			<div className="grid lg:grid-cols-2 min-h-screen">
				{/* Left Side - Hero Content and Image */}
				<div
					className="relative flex flex-col bg-slate-800 text-white lg:sticky lg:top-0 lg:h-screen lg:self-start overflow-hidden min-h-full"
					style={{
						backgroundImage:
							'url("https://mencrytoo.s3.amazonaws.com/MENCRYTOO3.jpg")',
						backgroundSize: "cover",
						backgroundPosition: "center",
						backgroundRepeat: "no-repeat",
					}}
				>
					{/* Overlay for better text readability */}
					<div className="absolute inset-0 bg-slate-900/60"></div>

					{/* Content - Now with sticky positioning and smooth scroll behavior */}
					<div className="fixed top-0 left-0 z-10 w-1/2 h-screen flex flex-col justify-center items-center text-center px-8 overflow-y-auto max-xl:relative max-xl:items-center max-xl:justify-center max-xl:text-center max-xl:left-36 lg:fixed lg:left-0">
						<div className="max-w-lg space-y-6 transform transition-all duration-300 ease-in-out py-16">
							<h1 className="text-4xl lg:text-5xl font-bold text-orange-400 drop-shadow-lg animate-pulse">
								MEN CRY TOO
							</h1>
							<p className="text-xl lg:text-2xl font-semibold text-slate-200">
								IT'S OKAY TO CRY
							</p>
							<p className="text-lg text-slate-300 leading-relaxed">
								Take control of your mental health. Join a supportive community
								where vulnerability is strength and healing begins with
								connection.
							</p>

							{/* Feature List with enhanced animations */}
							<div className="space-y-4 text-left">
								<div className="flex items-center gap-3 transform hover:translate-x-2 transition-transform duration-200">
									<div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
										<Check size={14} className="text-white font-bold" />
									</div>
									<span className="text-slate-200">
										Safe and supportive environment
									</span>
								</div>
								<div className="flex items-center gap-3 transform hover:translate-x-2 transition-transform duration-200 delay-75">
									<div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
										<Check size={14} className="text-white font-bold" />
									</div>
									<span className="text-slate-200">
										Connect with similar experiences
									</span>
								</div>
								<div className="flex items-center gap-3 transform hover:translate-x-2 transition-transform duration-200 delay-150">
									<div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
										<Check size={14} className="text-white font-bold" />
									</div>
									<span className="text-slate-200">
										Professional guidance available
									</span>
								</div>
							</div>

							{/* Progress indicator for form completion */}
							<div className="mt-8 pt-6 border-t border-slate-600/50">
								<p className="text-sm text-slate-400 mb-2">
									Join thousands of men on their healing journey
								</p>
								<div className="flex items-center gap-2 mb-56">
									<div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
										<div
											className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
											style={{
												width: `${Math.min(
													100,
													(formData.firstName ? 15 : 0) +
														(formData.lastName ? 15 : 0) +
														(formData.email ? 15 : 0) +
														(formData.username ? 15 : 0) +
														(formData.password ? 15 : 0) +
														(formData.bio.length >= 50 ? 15 : 0) +
														(previewImage ? 10 : 0),
												)}%`,
											}}
										/>
									</div>
									<span className="text-xs text-slate-400 min-w-[3rem]">
										{Math.min(
											100,
											(formData.firstName ? 15 : 0) +
												(formData.lastName ? 15 : 0) +
												(formData.email ? 15 : 0) +
												(formData.username ? 15 : 0) +
												(formData.password ? 15 : 0) +
												(formData.bio.length >= 50 ? 15 : 0) +
												(previewImage ? 10 : 0),
										)}
										%
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Right Side - Form */}
				<div className="bg-white overflow-y-auto flex items-start justify-center p-4 lg:p-8">
					<div className="w-full max-w-2xl py-8">
						<div className="text-center mb-8">
							<h2 className="text-3xl font-bold text-slate-900 mb-2">
								Create Your Profile
							</h2>
							<p className="text-slate-600">
								We'll walk you through a few steps to build your presence on the
								site
							</p>
						</div>

						{errors.server && (
							<div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center font-medium">
								{errors.server}
							</div>
						)}

						<Form
							method="post"
							encType="multipart/form-data"
							className="space-y-8"
						>
							{/* Hidden fields for location state */}
							{locationState?.groupId && (
								<input
									type="hidden"
									name="groupId"
									value={locationState.groupId}
								/>
							)}
							{locationState?.eventId && (
								<input
									type="hidden"
									name="eventId"
									value={locationState.eventId}
								/>
							)}
							{locationState?.from && (
								<input type="hidden" name="from" value={locationState.from} />
							)}

							{/* Personal Information Section */}
							<div className="bg-slate-50 rounded-xl p-6 border border-slate-200 transform hover:shadow-lg transition-shadow duration-200">
								<div className="flex items-center gap-3 mb-6">
									<User size={20} className="text-orange-500" />
									<h3 className="text-lg font-semibold text-slate-900">
										Personal Information
									</h3>
								</div>

								<div className="grid md:grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="firstName"
											className="block text-sm font-medium text-slate-700 mb-2"
										>
											First Name
										</label>
										<input
											id="firstName"
											name="firstName"
											type="text"
											placeholder="Enter your first name"
											value={formData.firstName}
											onChange={(e) =>
												handleInputChange("firstName", e.target.value)
											}
											className={`w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 ${
												errors.firstName
													? "border-red-300 focus:border-red-500"
													: "border-slate-300 focus:border-orange-500 focus:shadow-md"
											} focus:outline-none`}
											required
										/>
										{errors.firstName && (
											<p className="mt-1 text-sm text-red-600">
												{errors.firstName}
											</p>
										)}
									</div>

									<div>
										<label
											htmlFor="lastName"
											className="block text-sm font-medium text-slate-700 mb-2"
										>
											Last Name
										</label>
										<input
											id="lastName"
											name="lastName"
											type="text"
											placeholder="Enter your last name"
											value={formData.lastName}
											onChange={(e) =>
												handleInputChange("lastName", e.target.value)
											}
											className={`w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 ${
												errors.lastName
													? "border-red-300 focus:border-red-500"
													: "border-slate-300 focus:border-orange-500 focus:shadow-md"
											} focus:outline-none`}
											required
										/>
										{errors.lastName && (
											<p className="mt-1 text-sm text-red-600">
												{errors.lastName}
											</p>
										)}
									</div>
								</div>
							</div>

							{/* Account Information Section */}
							<div className="bg-slate-50 rounded-xl p-6 border border-slate-200 transform hover:shadow-lg transition-shadow duration-200">
								<div className="flex items-center gap-3 mb-6">
									<Mail size={20} className="text-orange-500" />
									<h3 className="text-lg font-semibold text-slate-900">
										Account Information
									</h3>
								</div>

								<div className="space-y-4">
									<div>
										<label
											htmlFor="email"
											className="block text-sm font-medium text-slate-700 mb-2"
										>
											Email Address
										</label>
										<input
											id="email"
											name="email"
											type="email"
											placeholder="Enter your email address"
											value={formData.email}
											onChange={(e) =>
												handleInputChange("email", e.target.value)
											}
											className={`w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 ${
												errors.email
													? "border-red-300 focus:border-red-500"
													: "border-slate-300 focus:border-orange-500 focus:shadow-md"
											} focus:outline-none`}
											required
										/>
										{errors.email && (
											<p className="mt-1 text-sm text-red-600">
												{errors.email}
											</p>
										)}
									</div>

									<div>
										<label
											htmlFor="username"
											className="block text-sm font-medium text-slate-700 mb-2"
										>
											Username
										</label>
										<input
											id="username"
											name="username"
											type="text"
											placeholder="Choose a username"
											value={formData.username}
											onChange={(e) =>
												handleInputChange("username", e.target.value)
											}
											className={`w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 ${
												errors.username
													? "border-red-300 focus:border-red-500"
													: "border-slate-300 focus:border-orange-500 focus:shadow-md"
											} focus:outline-none`}
											required
										/>
										{errors.username && (
											<p className="mt-1 text-sm text-red-600">
												{errors.username}
											</p>
										)}
									</div>

									<div className="grid md:grid-cols-2 gap-4">
										<div>
											<label
												htmlFor="password"
												className="block text-sm font-medium text-slate-700 mb-2"
											>
												Password
											</label>
											<div className="relative">
												<input
													id="password"
													name="password"
													type={showPassword ? "text" : "password"}
													placeholder="Create a password"
													value={formData.password}
													onChange={(e) =>
														handleInputChange("password", e.target.value)
													}
													className={`w-full px-3 py-2 pr-10 border-2 rounded-lg transition-all duration-200 ${
														errors.password
															? "border-red-300 focus:border-red-500"
															: "border-slate-300 focus:border-orange-500 focus:shadow-md"
													} focus:outline-none`}
													required
												/>
												<button
													type="button"
													className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
												<p className="mt-1 text-sm text-red-600">
													{errors.password}
												</p>
											)}
										</div>

										<div>
											<label
												htmlFor="confirmPassword"
												className="block text-sm font-medium text-slate-700 mb-2"
											>
												Confirm Password
											</label>
											<div className="relative">
												<input
													id="confirmPassword"
													name="confirmPassword"
													type={showConfirmPassword ? "text" : "password"}
													placeholder="Confirm your password"
													value={formData.confirmPassword}
													onChange={(e) =>
														handleInputChange("confirmPassword", e.target.value)
													}
													className={`w-full px-3 py-2 pr-10 border-2 rounded-lg transition-all duration-200 ${
														errors.confirmPassword
															? "border-red-300 focus:border-red-500"
															: "border-slate-300 focus:border-orange-500 focus:shadow-md"
													} focus:outline-none`}
													required
												/>
												<button
													type="button"
													className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
												<p className="mt-1 text-sm text-red-600">
													{errors.confirmPassword}
												</p>
											)}
										</div>
									</div>
								</div>
							</div>

							{/* About You Section */}
							<div className="bg-slate-50 rounded-xl p-6 border border-slate-200 transform hover:shadow-lg transition-shadow duration-200">
								<div className="flex items-center gap-3 mb-6">
									<FileText size={20} className="text-orange-500" />
									<h3 className="text-lg font-semibold text-slate-900">
										About You
									</h3>
								</div>

								<div>
									<label
										htmlFor="bio"
										className="block text-sm font-medium text-slate-700 mb-2"
									>
										Tell us why you're here
									</label>
									<textarea
										id="bio"
										name="bio"
										placeholder="Please write at least 50 characters describing yourself and why you're joining our community..."
										value={formData.bio}
										onChange={(e) => handleInputChange("bio", e.target.value)}
										className={`w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 resize-vertical min-h-[100px] ${
											errors.bio
												? "border-red-300 focus:border-red-500"
												: "border-slate-300 focus:border-orange-500 focus:shadow-md"
										} focus:outline-none`}
										rows={4}
									/>
									<div className="flex justify-between items-center mt-2">
										{errors.bio && (
											<p className="text-sm text-red-600">{errors.bio}</p>
										)}
										<div
											className={`text-sm ml-auto transition-colors ${
												formData.bio.length >= 50
													? "text-green-600"
													: "text-slate-500"
											}`}
										>
											{formData.bio.length}/500 characters
										</div>
									</div>
								</div>
							</div>

							{/* Tags Section */}
							<div className="bg-slate-50 rounded-xl p-6 border border-slate-200 transform hover:shadow-lg transition-shadow duration-200">
								<div className="flex items-center gap-3 mb-6">
									<Tag size={20} className="text-orange-500" />
									<h3 className="text-lg font-semibold text-slate-900">
										Your Interests
									</h3>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-4">
										Select topics that resonate with you
									</label>
									<div className="grid md:grid-cols-2 gap-3">
										{tagOptions.map((tag) => (
											<label
												key={tag}
												className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 hover:shadow-sm"
											>
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
													className="hidden"
												/>
												<div
													className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
														formData.userTags.includes(tag)
															? "bg-orange-500 border-orange-500 scale-110"
															: "border-slate-300"
													}`}
												>
													{formData.userTags.includes(tag) && (
														<Check size={12} className="text-white" />
													)}
												</div>
												<span className="text-sm font-medium text-slate-700">
													{tag}
												</span>
											</label>
										))}
									</div>
									{errors.userTags && (
										<p className="mt-2 text-sm text-red-600">
											{errors.userTags}
										</p>
									)}
								</div>
							</div>

							{/* Profile Image Section */}
							<div className="bg-slate-50 rounded-xl p-6 border border-slate-200 transform hover:shadow-lg transition-shadow duration-200">
								<div className="flex items-center gap-3 mb-6">
									<Upload size={20} className="text-orange-500" />
									<h3 className="text-lg font-semibold text-slate-900">
										Profile Picture
									</h3>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700 mb-4">
										Upload your profile image
									</label>
									{previewImage ? (
										<div className="flex flex-col items-center space-y-4">
											<img
												src={previewImage}
												alt="Preview"
												className="w-32 h-32 rounded-full object-cover border-4 border-slate-200 shadow-lg"
											/>
											<button
												type="button"
												className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
												onClick={() =>
													document.getElementById("file-upload")?.click()
												}
											>
												Change Image
											</button>
										</div>
									) : (
										<div
											className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 hover:shadow-sm"
											onClick={() =>
												document.getElementById("file-upload")?.click()
											}
										>
											<Upload
												size={32}
												className="mx-auto text-slate-400 mb-2"
											/>
											<p className="font-medium text-slate-700">
												Click to upload or drag and drop
											</p>
											<span className="text-sm text-slate-500">
												JPG, PNG or GIF (max 5MB)
											</span>
										</div>
									)}
									<input
										id="file-upload"
										name="profileImage"
										type="file"
										accept="image/*"
										onChange={handleImageChange}
										className="hidden"
									/>
									{errors.profileImage && (
										<p className="mt-2 text-sm text-red-600">
											{errors.profileImage}
										</p>
									)}
								</div>
							</div>

							{/* Form Actions */}
							<div className="flex flex-col sm:flex-row gap-4 justify-end">
								<Link
									to="/"
									className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 text-center font-medium hover:shadow-md"
								>
									Cancel
								</Link>
								<button
									type="submit"
									className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
										isDisabled || isSubmitting
											? "bg-slate-300 text-slate-500 cursor-not-allowed"
											: "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:-translate-y-0.5"
									}`}
									disabled={isDisabled || isSubmitting}
								>
									{isSubmitting ? "Creating Account..." : "Create Account"}
								</button>
							</div>

							{/* Login Link */}
							<div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-200">
								<p className="text-slate-600">Already have an account?</p>
								<OpenModalMenuItem
									itemText="Log in here"
									className="text-orange-500 hover:text-orange-600 font-medium cursor-pointer transition-colors"
									modalComponent={<LoginFormModal />}
								/>
							</div>
						</Form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SignupFormPage;
