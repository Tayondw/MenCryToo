import React, { useState, useEffect } from "react";
import {
	useSubmit,
	useNavigation,
	useActionData,
	useRevalidator,
} from "react-router-dom";
import {
	X,
	Upload,
	Image,
	Calendar,
	Trash2,
	Plus,
	Eye,
	Download,
	CheckCircle,
	AlertCircle,
} from "lucide-react";

interface EventImage {
	id: number;
	eventImage: string;
	name?: string;
}

interface EventDetails {
	id: number;
	name: string;
	groupId: number;
	groupInfo: {
		organizerId: number;
	};
	eventImage: EventImage[];
}

interface EventImagesProps {
	eventDetails: EventDetails;
	currentUserId: number;
	onClose: () => void;
}

interface ActionData {
	success?: boolean;
	error?: string;
	message?: string;
	image?: EventImage;
}

const EventImages: React.FC<EventImagesProps> = ({
	eventDetails,
	currentUserId,
	onClose,
}) => {
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"upload" | "gallery">("gallery");
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const submit = useSubmit();
	const navigation = useNavigation();
	const actionData = useActionData() as ActionData;
	const revalidator = useRevalidator();

	const isUploading =
		navigation.state === "submitting" &&
		navigation.formData?.get("intent") === "add-event-image";
	const isDeleting =
		navigation.state === "submitting" &&
		navigation.formData?.get("intent") === "delete-event-image";

	const isOrganizer = eventDetails?.groupInfo?.organizerId === currentUserId;
	const eventImages = eventDetails?.eventImage || [];

	// Handle action results
	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				setSuccessMessage(
					actionData.message || "Operation completed successfully!",
				);
				setError(null);

				// Clear form state on successful upload
				if (navigation.formData?.get("intent") === "add-event-image") {
					clearSelection();
                              setActiveTab("gallery");
                              
				}
                        onClose();

				// Revalidate to get fresh data
				revalidator.revalidate();

				// Clear success message after 3 seconds
				setTimeout(() => setSuccessMessage(null), 3000);
			} else if (actionData.error) {
				setError(actionData.error);
				setSuccessMessage(null);
			}
		}
	}, [actionData, navigation.formData, revalidator, onClose]);

	// Handle file selection for upload
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Check file size (5MB limit)
			if (file.size > 5 * 1024 * 1024) {
				setError("File size must be less than 5MB");
				return;
			}

			// Check file type
			if (!file.type.startsWith("image/")) {
				setError("Please select an image file");
				return;
			}

			setError(null);
			setSelectedImage(file);

			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewUrl(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const clearSelection = () => {
		setSelectedImage(null);
		setPreviewUrl(null);
		setError(null);
	};

	const handleUpload = () => {
		if (!selectedImage) return;

		const formData = new FormData();
		formData.append("event_image", selectedImage);
		formData.append("intent", "add-event-image");
		// Don't append eventId - it comes from the URL params

		// Submit to the specific event details route
		submit(formData, {
			method: "post",
			action: `/events/${eventDetails.id}`,
			encType: "multipart/form-data",
		});
	};

	const handleDelete = (imageId: number) => {
		if (!confirm("Are you sure you want to delete this image?")) return;

		const formData = new FormData();
		formData.append("intent", "delete-event-image");
		formData.append("imageId", imageId.toString());

		// Submit to the specific event details route
		submit(formData, {
			method: "post",
			action: `/events/${eventDetails.id}`,
		});
	};

	return (
		<div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
			{/* Header */}
			<div className="bg-gradient-to-r from-blue-50 to-slate-50 p-6 border-b border-slate-200 flex-shrink-0">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
							<Calendar size={20} className="text-blue-600" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-slate-900">
								Manage Event Images
							</h2>
							<p className="text-sm text-slate-600">{eventDetails.name}</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
					>
						<X size={20} className="text-slate-500" />
					</button>
				</div>

				{/* Success/Error Messages */}
				{successMessage && (
					<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
						<CheckCircle size={16} className="text-green-600" />
						<p className="text-green-700 text-sm font-medium">
							{successMessage}
						</p>
					</div>
				)}

				{error && (
					<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
						<AlertCircle size={16} className="text-red-600" />
						<p className="text-red-700 text-sm font-medium">{error}</p>
						<button
							onClick={() => setError(null)}
							className="ml-auto text-red-600 hover:text-red-800 text-sm underline"
						>
							Dismiss
						</button>
					</div>
				)}

				{/* Tabs */}
				<div className="flex mt-4 space-x-1 bg-slate-100 rounded-lg p-1">
					<button
						onClick={() => setActiveTab("gallery")}
						className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
							activeTab === "gallery"
								? "bg-white text-blue-600 shadow-sm"
								: "text-slate-600 hover:text-slate-900"
						}`}
					>
						<div className="flex items-center justify-center gap-2">
							<Eye size={16} />
							Gallery ({eventImages.length})
						</div>
					</button>
					{isOrganizer && (
						<button
							onClick={() => setActiveTab("upload")}
							className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
								activeTab === "upload"
									? "bg-white text-blue-600 shadow-sm"
									: "text-slate-600 hover:text-slate-900"
							}`}
						>
							<div className="flex items-center justify-center gap-2">
								<Plus size={16} />
								Upload New
							</div>
						</button>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{activeTab === "gallery" && (
					<div className="p-6">
						{eventImages.length === 0 ? (
							<div className="text-center py-12">
								<div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<Image size={24} className="text-slate-400" />
								</div>
								<h3 className="text-lg font-semibold text-slate-900 mb-2">
									No images yet
								</h3>
								<p className="text-slate-600 mb-4">
									{isOrganizer
										? "Upload the first image to showcase your event!"
										: "The event organizer hasn't uploaded any images yet."}
								</p>
								{isOrganizer && (
									<button
										onClick={() => setActiveTab("upload")}
										className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
									>
										<Plus size={18} />
										Upload First Image
									</button>
								)}
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{eventImages.map((image) => (
									<div
										key={image.id}
										className="relative group bg-slate-50 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-300 transition-colors"
									>
										<div className="aspect-video relative">
											<img
												src={image.eventImage}
												alt={`Event image ${image.id}`}
												className="w-full h-full object-cover"
											/>
											<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
												<div className="flex gap-2">
													{/* View Full Size */}
													<button
														onClick={() =>
															window.open(image.eventImage, "_blank")
														}
														className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
														title="View full size"
													>
														<Eye size={16} className="text-slate-700" />
													</button>
													{/* Download */}
													<a
														href={image.eventImage}
														download={`event-${eventDetails.id}-image-${image.id}.jpg`}
														className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
														title="Download image"
													>
														<Download size={16} className="text-slate-700" />
													</a>
													{/* Delete (Organizer Only) */}
													{isOrganizer && (
														<button
															onClick={() => handleDelete(image.id)}
															disabled={isDeleting}
															className="bg-red-500/90 backdrop-blur-sm p-2 rounded-full hover:bg-red-500 transition-colors text-white disabled:opacity-50"
															title="Delete image"
														>
															{isDeleting ? (
																<div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
															) : (
																<Trash2 size={16} />
															)}
														</button>
													)}
												</div>
											</div>
										</div>
										<div className="p-3">
											<p className="text-xs text-slate-500 truncate">
												Image #{image.id}
											</p>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{activeTab === "upload" && isOrganizer && (
					<div className="p-6">
						<div className="space-y-6">
							{/* Upload Area */}
							{previewUrl ? (
								<div className="space-y-4">
									<div className="relative rounded-lg overflow-hidden border border-slate-200">
										<img
											src={previewUrl}
											alt="Preview"
											className="w-full h-64 object-cover"
										/>
										<button
											type="button"
											onClick={clearSelection}
											className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1 rounded-full hover:bg-white transition-colors"
											disabled={isUploading}
										>
											<X size={16} className="text-slate-700" />
										</button>
									</div>
									{selectedImage && (
										<div className="bg-slate-50 rounded-lg p-3">
											<p className="text-sm font-medium text-slate-700 mb-1">
												Selected file:
											</p>
											<p className="text-sm text-slate-600">
												{selectedImage.name} (
												{Math.round(selectedImage.size / 1024)} KB)
											</p>
										</div>
									)}
								</div>
							) : (
								<div
									onClick={() =>
										!isUploading &&
										document.getElementById("event-image-upload")?.click()
									}
									className={`border-2 border-dashed border-slate-300 rounded-lg p-12 text-center transition-all duration-200 ${
										isUploading
											? "cursor-not-allowed opacity-50"
											: "cursor-pointer hover:border-blue-300 hover:bg-blue-50"
									}`}
								>
									<Upload size={48} className="mx-auto text-slate-400 mb-4" />
									<p className="text-lg font-medium text-slate-700 mb-2">
										{isUploading ? "Uploading..." : "Click to upload an image"}
									</p>
									<p className="text-sm text-slate-500 mb-4">
										PNG, JPG, or GIF (max 5MB)
									</p>
									<p className="text-xs text-slate-400">
										Share moments from your event with attendees and potential
										participants
									</p>
								</div>
							)}

							<input
								id="event-image-upload"
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="hidden"
								disabled={isUploading}
							/>

							{/* Action Buttons */}
							<div className="flex gap-3 pt-4 border-t border-slate-200">
								<button
									type="button"
									onClick={() => setActiveTab("gallery")}
									className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
									disabled={isUploading}
								>
									Cancel
								</button>
								<button
									onClick={handleUpload}
									disabled={!selectedImage || isUploading}
									className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
										selectedImage && !isUploading
											? "bg-blue-500 text-white hover:bg-blue-600"
											: "bg-slate-300 text-slate-500 cursor-not-allowed"
									} transition-colors`}
								>
									{isUploading ? (
										<>
											<div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
											Uploading...
										</>
									) : (
										<>
											<Upload size={18} />
											Upload Image
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default EventImages;
