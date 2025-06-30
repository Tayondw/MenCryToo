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
	ArrowLeft,
	Calendar,
	Clock,
	Users,
	MapPin,
	Info,
	Save,
	Upload,
} from "lucide-react";
import { RootState } from "../.././../../types";

interface FormErrors {
	name?: string;
	description?: string;
	type?: string;
	capacity?: string;
	startDate?: string;
	endDate?: string;
	image?: string;
}

interface EventDetails {
	id: number;
	name: string;
	description: string;
	image: string;
	type: string;
	capacity: number;
	startDate: string;
	endDate: string;
	groupId: number;
	organizer: {
		id: number;
	};
}

const UpdateEvent: React.FC = () => {
	const errors = useActionData() as FormErrors;
	const sessionUser = useSelector((state: RootState) => state.session.user);
	const navigate = useNavigate();
	const eventDetails = useLoaderData() as EventDetails;

	// Form state
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		type: "",
		capacity: "",
		startDate: "",
		endDate: "",
	});

	const [imageFile, setImageFile] = useState<File | null>(null);
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Character limits
	const NAME_MAX_LENGTH = 50;
	const NAME_MIN_LENGTH = 5;
	const DESCRIPTION_MAX_LENGTH = 150;
	const DESCRIPTION_MIN_LENGTH = 50;

	// Ensure user is logged in
	useEffect(() => {
		if (!sessionUser) {
			navigate("/");
		}
	}, [sessionUser, navigate]);

	// Ensure user is the event organizer
	useEffect(() => {
		if (sessionUser && eventDetails?.organizer?.id !== sessionUser.id) {
			navigate("/");
		}
	}, [eventDetails, sessionUser, navigate]);

	// Initialize form with event details
	useEffect(() => {
		if (eventDetails) {
			setFormData({
				name: eventDetails.name || "",
				description: eventDetails.description || "",
				type: eventDetails.type || "",
				capacity: eventDetails.capacity?.toString() || "",
				startDate: eventDetails.startDate || "",
				endDate: eventDetails.endDate || "",
			});
			setPreviewImage(eventDetails.image);
		}
	}, [eventDetails]);

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

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

	// Format date for datetime-local input
	const formatDateForInput = (dateString: string) => {
		if (!dateString) return "";

		const date = new Date(dateString);
		if (isNaN(date.getTime())) return "";

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");

		return `${year}-${month}-${day}T${hours}:${minutes}`;
	};

	// Handle form submission
	const handleSubmit = () => {
		setIsSubmitting(true);
		// Form will be handled by React Router action
	};

	// Calculate if form is valid
	const isFormValid =
		formData.name.length >= NAME_MIN_LENGTH &&
		formData.name.length <= NAME_MAX_LENGTH &&
		formData.description.length >= DESCRIPTION_MIN_LENGTH &&
		formData.description.length <= DESCRIPTION_MAX_LENGTH &&
		formData.type !== "" &&
		parseInt(formData.capacity) >= 2 &&
		parseInt(formData.capacity) <= 300 &&
		formData.startDate !== "" &&
		formData.endDate !== "";

	if (!sessionUser || !eventDetails) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
					<h1 className="text-2xl font-bold text-slate-900 mb-4">
						Please Log In
					</h1>
					<p className="text-slate-600 mb-6">
						You need to be logged in to update this event.
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
							to={`/events/${eventDetails.id}`}
							className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
						>
							<ArrowLeft size={20} />
							Back to Event
						</Link>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 py-12">
				<div className="grid md:grid-cols-2 gap-8 items-start">
					{/* Left Column - Image and Preview */}
					<div className="space-y-8">
						{/* Hero Image */}
						<div className="relative rounded-2xl overflow-hidden shadow-xl">
							<img
								src={eventDetails.image}
								alt={eventDetails.name}
								className="w-full h-auto object-cover rounded-2xl"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent flex items-end">
								<div className="p-8 text-white">
									<h2 className="text-3xl font-bold mb-2">Update Event</h2>
									<p className="text-slate-200">{eventDetails.name}</p>
								</div>
							</div>
						</div>

						{/* Event Preview */}
						<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
							<div className="p-6">
								<h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
									<Calendar size={18} className="text-orange-500" />
									Event Preview
								</h3>

								<div className="space-y-4">
									{previewImage && (
										<div className="rounded-xl overflow-hidden border border-slate-200">
											<img
												src={previewImage}
												alt="Preview"
												className="w-full h-48 object-cover"
											/>
										</div>
									)}

									<h4 className="font-semibold text-lg text-slate-800">
										{formData.name || eventDetails.name}
									</h4>

									<p className="text-slate-700 text-sm">
										{formData.description || eventDetails.description}
									</p>

									<div className="flex flex-wrap gap-4 text-sm text-slate-600">
										<div className="flex items-center gap-2">
											<Calendar size={16} className="text-orange-500" />
											<span>
												{new Date(
													formData.startDate || eventDetails.startDate,
												).toLocaleDateString()}{" "}
												-{" "}
												{new Date(
													formData.endDate || eventDetails.endDate,
												).toLocaleDateString()}
											</span>
										</div>

										<div className="flex items-center gap-2">
											<MapPin size={16} className="text-orange-500" />
											<span>
												{(formData.type || eventDetails.type) === "in-person"
													? "In Person"
													: "Online"}
											</span>
										</div>

										<div className="flex items-center gap-2">
											<Users size={16} className="text-orange-500" />
											<span>
												Capacity: {formData.capacity || eventDetails.capacity}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column - Form */}
					<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
						<div className="flex items-center gap-4 mb-8">
							<div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
								<Calendar size={24} className="text-white" />
							</div>
							<div>
								<h2 className="text-2xl font-bold text-slate-900">
									Update Event
								</h2>
								<p className="text-slate-600">
									Make changes to your event details
								</p>
							</div>
						</div>

						<Form
							method="post"
							action={`/groups/${eventDetails.groupId}/events/${eventDetails.id}`}
							encType="multipart/form-data"
							className="space-y-6"
							onSubmit={handleSubmit}
						>
							<input
								type="hidden"
								name="group_id"
								value={eventDetails.groupId}
							/>
							<input type="hidden" name="eventId" value={eventDetails.id} />
							<input type="hidden" name="intent" value="edit-event" />

							{/* Event Name */}
							<div className="space-y-2">
								<label
									htmlFor="name"
									className="block text-sm font-medium text-slate-700"
								>
									Event Name
								</label>
								<input
									id="name"
									name="name"
									type="text"
									value={formData.name}
									onChange={handleInputChange}
									placeholder="Give your event a clear, descriptive name"
									className={`w-full px-4 py-3 border ${
										errors?.name ? "border-red-300" : "border-slate-300"
									} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
									maxLength={NAME_MAX_LENGTH}
									required
								/>
								<div className="flex justify-between items-center text-xs">
									<div>
										{errors?.name ? (
											<p className="text-red-600">{errors.name}</p>
										) : (
											<p className="text-slate-500">
												{formData.name.length < NAME_MIN_LENGTH
													? `Please enter at least ${NAME_MIN_LENGTH} characters`
													: "Great! Your event name looks good"}
											</p>
										)}
									</div>
									<div
										className={`${
											formData.name.length > NAME_MAX_LENGTH - 10
												? "text-orange-500"
												: formData.name.length >= NAME_MIN_LENGTH
												? "text-green-500"
												: "text-slate-500"
										}`}
									>
										{formData.name.length}/{NAME_MAX_LENGTH}
									</div>
								</div>
							</div>

							{/* Event Type and Capacity */}
							<div className="grid md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<label
										htmlFor="type"
										className="block text-sm font-medium text-slate-700"
									>
										Event Type
									</label>
									<select
										id="type"
										name="type"
										value={formData.type}
										onChange={handleInputChange}
										className={`w-full px-4 py-3 border ${
											errors?.type ? "border-red-300" : "border-slate-300"
										} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
										required
									>
										<option value="">Select type</option>
										<option value="in-person">In Person</option>
										<option value="online">Online</option>
									</select>
									{errors?.type && (
										<p className="text-xs text-red-600">{errors.type}</p>
									)}
								</div>

								<div className="space-y-2">
									<label
										htmlFor="capacity"
										className="block text-sm font-medium text-slate-700"
									>
										Capacity
									</label>
									<input
										id="capacity"
										name="capacity"
										type="number"
										min="2"
										max="300"
										value={formData.capacity}
										onChange={handleInputChange}
										placeholder="How many people can attend?"
										className={`w-full px-4 py-3 border ${
											errors?.capacity ? "border-red-300" : "border-slate-300"
										} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
										required
									/>
									{errors?.capacity ? (
										<p className="text-xs text-red-600">{errors.capacity}</p>
									) : (
										<p className="text-xs text-slate-500">
											Minimum 2, maximum 300 attendees
										</p>
									)}
								</div>
							</div>

							{/* Event Dates */}
							<div className="space-y-4">
								<h3 className="text-md font-medium text-slate-800 flex items-center gap-2">
									<Clock size={16} className="text-orange-500" />
									Event Schedule
								</h3>

								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<label
											htmlFor="startDate"
											className="block text-sm font-medium text-slate-700"
										>
											Start Date & Time
										</label>
										<input
											id="startDate"
											name="startDate"
											type="datetime-local"
											value={formatDateForInput(formData.startDate)}
											onChange={handleInputChange}
											className={`w-full px-4 py-3 border ${
												errors?.startDate
													? "border-red-300"
													: "border-slate-300"
											} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
											required
										/>
										{errors?.startDate && (
											<p className="text-xs text-red-600">{errors.startDate}</p>
										)}
									</div>

									<div className="space-y-2">
										<label
											htmlFor="endDate"
											className="block text-sm font-medium text-slate-700"
										>
											End Date & Time
										</label>
										<input
											id="endDate"
											name="endDate"
											type="datetime-local"
											value={formatDateForInput(formData.endDate)}
											onChange={handleInputChange}
											className={`w-full px-4 py-3 border ${
												errors?.endDate ? "border-red-300" : "border-slate-300"
											} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
											required
										/>
										{errors?.endDate && (
											<p className="text-xs text-red-600">{errors.endDate}</p>
										)}
									</div>
								</div>
							</div>

							{/* Event Description */}
							<div className="space-y-2">
								<label
									htmlFor="description"
									className="block text-sm font-medium text-slate-700"
								>
									Event Description
								</label>
								<textarea
									id="description"
									name="description"
									value={formData.description}
									onChange={handleInputChange}
									placeholder="Describe your event in detail. What can attendees expect?"
									rows={5}
									className={`w-full px-4 py-3 border ${
										errors?.description ? "border-red-300" : "border-slate-300"
									} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none`}
									maxLength={DESCRIPTION_MAX_LENGTH}
									required
								/>
								<div className="flex justify-between items-center text-xs">
									<div>
										{errors?.description ? (
											<p className="text-red-600">{errors.description}</p>
										) : (
											<p className="text-slate-500">
												{formData.description.length < DESCRIPTION_MIN_LENGTH
													? `Please write at least ${DESCRIPTION_MIN_LENGTH} characters`
													: "Great! Your description looks good"}
											</p>
										)}
									</div>
									<div
										className={`${
											formData.description.length > DESCRIPTION_MAX_LENGTH - 30
												? "text-orange-500"
												: formData.description.length >= DESCRIPTION_MIN_LENGTH
												? "text-green-500"
												: "text-slate-500"
										}`}
									>
										{formData.description.length}/{DESCRIPTION_MAX_LENGTH}
									</div>
								</div>
							</div>

							{/* Image Upload */}
							<div className="space-y-2">
								<label
									htmlFor="image"
									className="block text-sm font-medium text-slate-700"
								>
									Event Image (Optional)
								</label>

								<div className="flex items-center gap-4 mb-2">
									<div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 flex-shrink-0">
										<img
											src={previewImage || eventDetails.image}
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
									<p className="text-xs text-red-600">{errors.image}</p>
								)}
							</div>

							{/* Guidelines */}
							<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<Info size={16} className="text-orange-500" />
									<h4 className="font-medium text-slate-800">
										Event Guidelines
									</h4>
								</div>
								<ul className="text-sm text-slate-700 space-y-1 pl-6 list-disc">
									<li>
										Provide clear details about the event location and time
									</li>
									<li>Set realistic capacity limits based on your venue</li>
									<li>
										Include any special instructions or requirements for
										attendees
									</li>
									<li>Consider accessibility needs for all participants</li>
								</ul>
							</div>

							{/* Form Actions */}
							<div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-end">
								<Link
									to={`/events/${eventDetails.id}`}
									className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 text-center font-medium"
								>
									Cancel
								</Link>
								<button
									type="submit"
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
											<Save size={18} />
											Update Event
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

export default UpdateEvent;
