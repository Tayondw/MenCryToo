import React, { useState, useEffect } from "react";
import {
	Link,
	useLoaderData,
	useActionData,
	Form,
	useNavigation,
} from "react-router-dom";
import { Upload, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { User, SignupFormErrors } from "../../../../types";

const UpdateProfile: React.FC = () => {
	const loaderData = useLoaderData() as { user: User } | null;
	const actionData = useActionData() as { errors?: SignupFormErrors } | null;
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
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<Link
						to="/profile"
						className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
					>
						<ArrowLeft size={20} />
						Back to Profile
					</Link>
					<h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
				</div>

				<Form method="post" encType="multipart/form-data" className="space-y-8">
					<input type="hidden" name="intent" value="update-profile" />
					<input
						type="hidden"
						name="userId"
						value={sessionUser.id.toString()}
					/>

					{/* Profile Photo Section */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="mb-6">
							<div>
								<h2 className="text-lg font-semibold text-gray-900 mb-1">
									Profile Photo
								</h2>
								<p className="text-sm text-gray-600">
									This image will be displayed on your profile
								</p>
							</div>
						</div>

						<div className="flex items-start gap-6">
							<div className="flex-shrink-0">
								<img
									src={previewImage || sessionUser.profileImage}
									alt="Profile"
									className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
								/>
							</div>

							<div className="flex-1">
								<label
									htmlFor="profile-image"
									className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
								>
									<Upload size={16} />
									Click to upload
								</label>
								<span className="ml-3 text-sm text-gray-500">
									or drag and drop
								</span>
								<p className="mt-2 text-xs text-gray-500">
									JPG, PNG, or GIF (Recommended size 1000x1000px)
								</p>
								<input
									id="profile-image"
									name="profileImage"
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									className="hidden"
								/>
							</div>
						</div>

						{errors.profileImage && (
							<div className="mt-2 text-sm text-red-600">
								{errors.profileImage}
							</div>
						)}
					</div>

					{/* Personal Information Section */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="mb-6">
							<div>
								<h2 className="text-lg font-semibold text-gray-900 mb-1">
									Personal Information
								</h2>
								<p className="text-sm text-gray-600">
									Update your personal details here.
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label
									htmlFor="firstName"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									First Name
								</label>
								<input
									id="firstName"
									name="firstName"
									type="text"
									value={formData.firstName}
									onChange={(e) =>
										handleInputChange("firstName", e.target.value)
									}
									placeholder="Carter"
									className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
										errors.firstName
											? "border-red-300 focus:ring-red-500 focus:border-red-500"
											: "border-gray-300"
									}`}
								/>
								{errors.firstName && (
									<div className="mt-1 text-sm text-red-600">
										{errors.firstName}
									</div>
								)}
							</div>

							<div>
								<label
									htmlFor="lastName"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Last Name
								</label>
								<input
									id="lastName"
									name="lastName"
									type="text"
									value={formData.lastName}
									onChange={(e) =>
										handleInputChange("lastName", e.target.value)
									}
									placeholder="Leadstream"
									className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
										errors.lastName
											? "border-red-300 focus:ring-red-500 focus:border-red-500"
											: "border-gray-300"
									}`}
								/>
								{errors.lastName && (
									<div className="mt-1 text-sm text-red-600">
										{errors.lastName}
									</div>
								)}
							</div>

							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Email
								</label>
								<input
									id="email"
									name="email"
									type="email"
									value={formData.email}
									onChange={(e) => handleInputChange("email", e.target.value)}
									placeholder="carter@domain.com"
									className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
										errors.email
											? "border-red-300 focus:ring-red-500 focus:border-red-500"
											: "border-gray-300"
									}`}
								/>
								{errors.email && (
									<div className="mt-1 text-sm text-red-600">
										{errors.email}
									</div>
								)}
							</div>

							<div>
								<label
									htmlFor="username"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Username
								</label>
								<input
									id="username"
									name="username"
									type="text"
									value={formData.username}
									onChange={(e) =>
										handleInputChange("username", e.target.value)
									}
									placeholder="carter-leadstream"
									className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
										errors.username
											? "border-red-300 focus:ring-red-500 focus:border-red-500"
											: "border-gray-300"
									}`}
								/>
								{errors.username && (
									<div className="mt-1 text-sm text-red-600">
										{errors.username}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Password Section */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="mb-6">
							<div>
								<h2 className="text-lg font-semibold text-gray-900 mb-1">
									Password
								</h2>
								<p className="text-sm text-gray-600">
									Leave blank to keep current password
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label
									htmlFor="password"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									New Password
								</label>
								<div className="relative">
									<input
										id="password"
										name="password"
										type={showPassword ? "text" : "password"}
										value={formData.password}
										onChange={(e) =>
											handleInputChange("password", e.target.value)
										}
										placeholder="••••••••••••"
										className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
											errors.password
												? "border-red-300 focus:ring-red-500 focus:border-red-500"
												: "border-gray-300"
										}`}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
									>
										{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
									</button>
								</div>
								{errors.password && (
									<div className="mt-1 text-sm text-red-600">
										{errors.password}
									</div>
								)}
							</div>

							<div>
								<label
									htmlFor="confirmPassword"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Confirm Password
								</label>
								<div className="relative">
									<input
										id="confirmPassword"
										name="confirmPassword"
										type={showConfirmPassword ? "text" : "password"}
										value={formData.confirmPassword}
										onChange={(e) =>
											handleInputChange("confirmPassword", e.target.value)
										}
										placeholder="••••••••••••"
										className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
											errors.confirmPassword
												? "border-red-300 focus:ring-red-500 focus:border-red-500"
												: "border-gray-300"
										}`}
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
									>
										{showConfirmPassword ? (
											<EyeOff size={16} />
										) : (
											<Eye size={16} />
										)}
									</button>
								</div>
								{errors.confirmPassword && (
									<div className="mt-1 text-sm text-red-600">
										{errors.confirmPassword}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Bio Section */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="mb-6">
							<div>
								<h2 className="text-lg font-semibold text-gray-900 mb-1">
									About You
								</h2>
								<p className="text-sm text-gray-600">
									Tell us about yourself and why you're here
								</p>
							</div>
						</div>

						<div>
							<label
								htmlFor="bio"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Bio
							</label>
							<textarea
								id="bio"
								name="bio"
								value={formData.bio}
								onChange={(e) => handleInputChange("bio", e.target.value)}
								placeholder="Hi, my name is Demo User and I have anger management issues."
								rows={4}
								className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
									errors.bio
										? "border-red-300 focus:ring-red-500 focus:border-red-500"
										: "border-gray-300"
								}`}
							/>
							<div className="mt-1 text-xs text-gray-500 text-right">
								{formData.bio.length}/500
							</div>
							{errors.bio && (
								<div className="mt-1 text-sm text-red-600">{errors.bio}</div>
							)}
						</div>
					</div>

					{/* Tags Section */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="mb-6">
							<div>
								<h2 className="text-lg font-semibold text-gray-900 mb-1">
									Your Tags
								</h2>
								<p className="text-sm text-gray-600">
									Select topics that resonate with you. This helps connect you
									with similar users
								</p>
							</div>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{tagOptions.map((tag) => (
								<label
									key={tag}
									className="relative flex items-center cursor-pointer"
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
										className="sr-only"
									/>
									<div
										className={`flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
											formData.userTags.includes(tag)
												? "bg-blue-50 border-blue-200 text-blue-700"
												: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
										}`}
									>
										{tag}
									</div>
								</label>
							))}
						</div>

						{sessionUser.usersTags && sessionUser.usersTags.length > 0 && (
							<div className="mt-6 pt-6 border-t border-gray-200">
								<h4 className="text-sm font-medium text-gray-900 mb-3">
									Your Current Tags
								</h4>
								<div className="flex flex-wrap gap-2">
									{sessionUser.usersTags.map((tag) => (
										<span
											key={tag.id}
											className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
										>
											{tag.name}
										</span>
									))}
								</div>
							</div>
						)}

						{errors.userTags && (
							<div className="mt-2 text-sm text-red-600">{errors.userTags}</div>
						)}
					</div>

					{/* Server Error Display */}
					{errors.server && (
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<div className="text-center text-base text-red-600">
								{errors.server}
							</div>
						</div>
					)}

					{/* Final Form Actions */}
					<div className="flex justify-end gap-4 pt-6">
						<Link
							to="/profile"
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
						>
							Cancel
						</Link>
						<button
							type="submit"
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
