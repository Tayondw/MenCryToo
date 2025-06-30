import React, { useState, useEffect } from "react";
import {
	useActionData,
	Form,
	useNavigate,
	useLoaderData,
	Link,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
	Users,
	MapPin,
	FileText,
	Image as ImageIcon,
	Globe,
	ArrowLeft,
	Upload,
	Info,
	Check,
} from "lucide-react";
import { RootState } from "../../../../types";

interface FormErrors {
	name?: string;
	about?: string;
	type?: string;
	city?: string;
	state?: string;
	image?: string;
}

interface GroupDetails {
	id: number;
	name: string;
	about: string;
	type: string;
	city: string;
	state: string;
	image: string;
	organizerId: number;
}

const UpdateGroup: React.FC = () => {
	const groupDetails = useLoaderData() as GroupDetails;
	const errors = useActionData() as FormErrors;
	const sessionUser = useSelector((state: RootState) => state.session.user);
	const navigate = useNavigate();

	// Form state
	const [name, setName] = useState("");
	const [about, setAbout] = useState("");
	const [type, setType] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Character limits
	const ABOUT_MAX_LENGTH = 150;
	const ABOUT_MIN_LENGTH = 20;
	const NAME_MAX_LENGTH = 50;
	const NAME_MIN_LENGTH = 3;

	// Ensure user is logged in
	useEffect(() => {
		if (!sessionUser) navigate("/");
	}, [sessionUser, navigate]);

	// Ensure user is the group owner
	useEffect(() => {
		if (sessionUser && groupDetails.organizerId !== sessionUser.id)
			navigate("/");
	}, [groupDetails, sessionUser, navigate]);

	// Initialize form with group details
	useEffect(() => {
		if (groupDetails) {
			setCity(groupDetails.city || "");
			setState(groupDetails.state || "");
			setName(groupDetails.name || "");
			setAbout(groupDetails.about || "");
			setType(groupDetails.type || "");
			setPreviewImage(groupDetails.image || null);
		}
	}, [groupDetails]);

	// Handle image selection
	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setImageFile(file);

			// Create preview URL
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewImage(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	// Handle form submission
	const handleSubmit = () => {
		setIsSubmitting(true);
		// Form will be handled by React Router action
	};

	// Calculate if form is valid
	const isFormValid =
		name.length >= NAME_MIN_LENGTH &&
		name.length <= NAME_MAX_LENGTH &&
		about.length >= ABOUT_MIN_LENGTH &&
		about.length <= ABOUT_MAX_LENGTH &&
		type !== "" &&
		city.length >= 3 &&
		city.length <= 30 &&
		state.length === 2;

	if (!sessionUser) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
					<h1 className="text-2xl font-bold text-slate-900 mb-4">
						Please Log In
					</h1>
					<p className="text-slate-600 mb-6">
						You need to be logged in to update a group.
					</p>
					<div className="flex gap-4 justify-center">
						<Link
							to="/login"
							className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
						>
							Log In
						</Link>
						<Link
							to="/"
							className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200"
						>
							Go Home
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
			{/* Header */}
			<div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<Link
							to={`/groups/${groupDetails.id}`}
							className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
						>
							<ArrowLeft size={20} />
							Back to Group
						</Link>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 py-12">
				<div className="grid md:grid-cols-2 gap-8 items-start">
					{/* Left Column - Image and Preview */}
					<div className="space-y-8">
						{/* Current Group Image */}
						<div className="relative rounded-2xl overflow-hidden shadow-xl">
							<img
								src={groupDetails.image}
								alt={groupDetails.name}
								className="w-full h-auto object-cover rounded-2xl"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent flex items-end">
								<div className="p-8 text-white">
									<h2 className="text-3xl font-bold mb-2">Update Your Group</h2>
									<p className="text-slate-200">
										Refine your community's information
									</p>
								</div>
							</div>
						</div>

						{/* Group Preview */}
						<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
							<div className="p-6">
								<h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
									<Users size={18} className="text-orange-500" />
									Group Preview
								</h3>

								<div className="space-y-4">
									<div className="rounded-xl overflow-hidden border border-slate-200">
										<img
											src={previewImage || groupDetails.image}
											alt="Preview"
											className="w-full h-48 object-cover"
										/>
									</div>

									<h4 className="font-semibold text-lg text-slate-800">
										{name || groupDetails.name}
									</h4>

									<p className="text-slate-700 text-sm">
										{about || groupDetails.about}
									</p>

									<div className="flex items-center gap-2 text-slate-600 text-sm">
										<MapPin size={16} className="text-orange-500" />
										<span>
											{city || groupDetails.city}
											{(city || groupDetails.city) &&
												(state || groupDetails.state) &&
												", "}
											{state || groupDetails.state}
										</span>
									</div>

									<div className="flex items-center gap-2 text-slate-600 text-sm">
										<Globe size={16} className="text-orange-500" />
										<span>
											{(type || groupDetails.type) === "in-person"
												? "In Person"
												: "Online"}{" "}
											Group
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column - Form */}
					<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
						<div className="flex items-center gap-4 mb-8">
							<div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
								<Users size={24} className="text-white" />
							</div>
							<div>
								<h2 className="text-2xl font-bold text-slate-900">
									Update Group
								</h2>
								<p className="text-slate-600">
									Refine your group's information to better serve your community
								</p>
							</div>
						</div>

						<Form
							method="post"
							action={`/groups/${groupDetails.id}/edit`}
							encType="multipart/form-data"
							className="space-y-6"
							onSubmit={handleSubmit}
						>
							<input type="hidden" name="organizer_id" value={sessionUser.id} />
							<input type="hidden" name="id" value={groupDetails.id} />

							{/* Location Section */}
							<div className="space-y-4">
								<div className="flex items-center gap-2 mb-2">
									<MapPin size={20} className="text-orange-500" />
									<h3 className="text-lg font-semibold text-slate-900">
										Location
									</h3>
								</div>
								<p className="text-slate-600 text-sm mb-4">
									Groups meet locally, in person, and online. We'll connect you
									with people in your area.
								</p>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<label
											htmlFor="city"
											className="block text-sm font-medium text-slate-700"
										>
											City
										</label>
										<input
											id="city"
											name="city"
											type="text"
											value={city}
											onChange={(e) => setCity(e.target.value)}
											placeholder="Enter city name"
											className={`w-full px-4 py-3 border ${
												errors?.city ? "border-red-300" : "border-slate-300"
											} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
										/>
										{errors?.city && (
											<p className="text-red-600 text-sm">{errors.city}</p>
										)}
									</div>

									<div className="space-y-2">
										<label
											htmlFor="state"
											className="block text-sm font-medium text-slate-700"
										>
											State
										</label>
										<input
											id="state"
											name="state"
											type="text"
											value={state}
											onChange={(e) => setState(e.target.value.toUpperCase())}
											placeholder="CA"
											maxLength={2}
											className={`w-full px-4 py-3 border ${
												errors?.state ? "border-red-300" : "border-slate-300"
											} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors uppercase`}
										/>
										{errors?.state && (
											<p className="text-red-600 text-sm">{errors.state}</p>
										)}
										<p className="text-xs text-slate-500">
											Please use the two-letter state code (e.g., CA, NY)
										</p>
									</div>
								</div>
							</div>

							{/* Group Name Section */}
							<div className="space-y-4 pt-4 border-t border-slate-200">
								<div className="flex items-center gap-2 mb-2">
									<Users size={20} className="text-orange-500" />
									<h3 className="text-lg font-semibold text-slate-900">
										Group Name
									</h3>
								</div>
								<p className="text-slate-600 text-sm mb-4">
									Choose a name that will give people a clear idea of what the
									group is about.
								</p>

								<div className="space-y-2">
									<label
										htmlFor="name"
										className="block text-sm font-medium text-slate-700"
									>
										Group Name
									</label>
									<input
										id="name"
										name="name"
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="e.g., Anxiety Support Circle"
										className={`w-full px-4 py-3 border ${
											errors?.name ? "border-red-300" : "border-slate-300"
										} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
										maxLength={NAME_MAX_LENGTH}
									/>
									<div className="flex justify-between items-center text-xs">
										<div>
											{errors?.name ? (
												<p className="text-red-600">{errors.name}</p>
											) : (
												<p className="text-slate-500">
													{name.length < NAME_MIN_LENGTH
														? `Please enter at least ${NAME_MIN_LENGTH} characters`
														: "Great! Your group name looks good"}
												</p>
											)}
										</div>
										<div
											className={`${
												name.length > NAME_MAX_LENGTH - 10
													? "text-orange-500"
													: name.length >= NAME_MIN_LENGTH
													? "text-green-500"
													: "text-slate-500"
											}`}
										>
											{name.length}/{NAME_MAX_LENGTH}
										</div>
									</div>
								</div>
							</div>

							{/* Description Section */}
							<div className="space-y-4 pt-4 border-t border-slate-200">
								<div className="flex items-center gap-2 mb-2">
									<FileText size={20} className="text-orange-500" />
									<h3 className="text-lg font-semibold text-slate-900">
										Description
									</h3>
								</div>
								<p className="text-slate-600 text-sm mb-4">
									Describe the purpose of your group, who should join, and what
									you'll do at your events.
								</p>

								<div className="space-y-2">
									<label
										htmlFor="about"
										className="block text-sm font-medium text-slate-700"
									>
										Group Description
									</label>
									<textarea
										id="about"
										name="about"
										value={about}
										onChange={(e) => setAbout(e.target.value)}
										placeholder="Please write at least 20 characters describing your group..."
										rows={5}
										className={`w-full px-4 py-3 border ${
											errors?.about ? "border-red-300" : "border-slate-300"
										} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none`}
										maxLength={ABOUT_MAX_LENGTH}
									/>
									<div className="flex justify-between items-center text-xs">
										<div>
											{errors?.about ? (
												<p className="text-red-600">{errors.about}</p>
											) : (
												<p className="text-slate-500">
													{about.length < ABOUT_MIN_LENGTH
														? `Please write at least ${ABOUT_MIN_LENGTH} characters`
														: "Great! Your description looks good"}
												</p>
											)}
										</div>
										<div
											className={`${
												about.length > ABOUT_MAX_LENGTH - 30
													? "text-orange-500"
													: about.length >= ABOUT_MIN_LENGTH
													? "text-green-500"
													: "text-slate-500"
											}`}
										>
											{about.length}/{ABOUT_MAX_LENGTH}
										</div>
									</div>
								</div>
							</div>

							{/* Image Upload Section */}
							<div className="space-y-4 pt-4 border-t border-slate-200">
								<div className="flex items-center gap-2 mb-2">
									<ImageIcon size={20} className="text-orange-500" />
									<h3 className="text-lg font-semibold text-slate-900">
										Group Image
									</h3>
								</div>
								<p className="text-slate-600 text-sm mb-4">
									Upload a new image for your group or keep the current one.
								</p>

								<div className="flex items-center gap-4 mb-2">
									<div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 flex-shrink-0">
										<img
											src={previewImage || groupDetails.image}
											alt="Current"
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="flex-1">
										<p className="text-sm text-slate-700 font-medium">
											Current Image
										</p>
										<p className="text-xs text-slate-500">
											Upload a new image to replace it (optional)
										</p>
									</div>
								</div>

								<div
									onClick={() =>
										document.getElementById("image-upload")?.click()
									}
									className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
								>
									<Upload size={24} className="mx-auto text-slate-400 mb-2" />
									<p className="text-sm font-medium text-slate-700 mb-1">
										Click to upload a new image
									</p>
									<p className="text-xs text-slate-500">
										PNG, JPG, or GIF (max 5MB)
									</p>
								</div>

								<input
									id="image-upload"
									name="image"
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									className="hidden"
								/>

								{errors?.image && (
									<p className="text-red-600 text-xs">{errors.image}</p>
								)}
							</div>

							{/* Group Type Section */}
							<div className="space-y-4 pt-4 border-t border-slate-200">
								<div className="flex items-center gap-2 mb-2">
									<Globe size={20} className="text-orange-500" />
									<h3 className="text-lg font-semibold text-slate-900">
										Group Type
									</h3>
								</div>
								<p className="text-slate-600 text-sm mb-4">
									Let people know if your group will meet in person or online.
								</p>

								<div className="space-y-2">
									<label
										htmlFor="type"
										className="block text-sm font-medium text-slate-700"
									>
										Is this an in-person or online group?
									</label>
									<select
										id="type"
										name="type"
										value={type}
										onChange={(e) => setType(e.target.value)}
										className={`w-full px-4 py-3 border ${
											errors?.type ? "border-red-300" : "border-slate-300"
										} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
									>
										<option value="">Select one</option>
										<option value="in-person">In Person</option>
										<option value="online">Online</option>
									</select>
									{errors?.type && (
										<p className="text-red-600 text-sm">{errors.type}</p>
									)}
								</div>
							</div>

							{/* Guidelines */}
							<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<Info size={16} className="text-orange-500" />
									<h4 className="font-medium text-slate-800">Update Tips</h4>
								</div>
								<ul className="text-sm text-slate-700 space-y-1 pl-6 list-disc">
									<li>Keep your group name clear and descriptive</li>
									<li>
										Ensure your description accurately reflects your group's
										purpose
									</li>
									<li>Consider updating your image to keep your group fresh</li>
									<li>Double-check your location information for accuracy</li>
								</ul>
							</div>

							{/* Form Actions */}
							<div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-end">
								<Link
									to={`/groups/${groupDetails.id}`}
									className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 text-center font-medium"
								>
									Cancel
								</Link>
								<button
									type="submit"
									name="intent"
									value="edit-group"
									disabled={!isFormValid || isSubmitting}
									className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
										isFormValid && !isSubmitting
											? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg"
											: "bg-slate-300 text-slate-500 cursor-not-allowed"
									} transition-all duration-200`}
								>
									{isSubmitting ? (
										<>
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											Updating...
										</>
									) : (
										<>
											<Check size={18} />
											Update Group
										</>
									)}
								</button>
							</div>
						</Form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UpdateGroup;
