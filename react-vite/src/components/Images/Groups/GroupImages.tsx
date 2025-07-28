import React, { useState } from "react";
import { X, Upload, Image, Trash2, Plus, Eye, Download } from "lucide-react";

interface GroupImage {
	id: number;
	groupImage: string;
	name?: string;
}

interface GroupDetails {
	id: number;
	name: string;
	organizerId: number;
	organizer: {
		id: number;
	};
	groupImage: GroupImage[];
}

interface GroupImagesManagerProps {
	groupDetails: GroupDetails;
	onClose: () => void;
}

const GroupImages: React.FC<GroupImagesManagerProps> = ({
	groupDetails,
	onClose,
}) => {
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"upload" | "gallery">("gallery");
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isOrganizer = groupDetails?.organizerId === groupDetails?.organizer?.id;
	const groupImages = groupDetails?.groupImage || [];

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

	const handleUpload = async () => {
		if (!selectedImage) return;

		setIsUploading(true);
		setError(null);

		const formData = new FormData();
		formData.append("group_image", selectedImage);
		formData.append("intent", "add-group-image");
		formData.append("groupId", groupDetails.id.toString());

		try {
			const response = await fetch(`/api/groups/${groupDetails.id}/images`, {
				method: "POST",
				body: formData,
				credentials: "include",
			});

			if (response.ok) {
				clearSelection();
				setActiveTab("gallery");
				window.location.reload(); // Refresh to show new image
			} else {
				const errorData = await response.json();
				setError(errorData.message || "Upload failed. Please try again.");
			}
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setIsUploading(false);
		}
	};

	const handleDelete = async (imageId: number) => {
		if (!confirm("Are you sure you want to delete this image?")) return;

		try {
			const response = await fetch(`/api/group-images/${imageId}`, {
				method: "DELETE",
				credentials: "include",
			});

			if (response.ok) {
				window.location.reload(); // Refresh to remove deleted image
			} else {
				setError("Delete failed. Please try again.");
			}
		} catch {
			setError("Network error. Please try again.");
		}
	};

	return (
		<div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
			{/* Header */}
			<div className="bg-gradient-to-r from-orange-50 to-slate-50 p-6 border-b border-slate-200 flex-shrink-0">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
							<Image size={20} className="text-orange-600" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-slate-900">
								Manage Group Images
							</h2>
							<p className="text-sm text-slate-600">{groupDetails.name}</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
					>
						<X size={20} className="text-slate-500" />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex mt-4 space-x-1 bg-slate-100 rounded-lg p-1">
					<button
						onClick={() => setActiveTab("gallery")}
						className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
							activeTab === "gallery"
								? "bg-white text-orange-600 shadow-sm"
								: "text-slate-600 hover:text-slate-900"
						}`}
					>
						<div className="flex items-center justify-center gap-2">
							<Eye size={16} />
							Gallery ({groupImages.length})
						</div>
					</button>
					{isOrganizer && (
						<button
							onClick={() => setActiveTab("upload")}
							className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
								activeTab === "upload"
									? "bg-white text-orange-600 shadow-sm"
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
						{groupImages.length === 0 ? (
							<div className="text-center py-12">
								<div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<Image size={24} className="text-slate-400" />
								</div>
								<h3 className="text-lg font-semibold text-slate-900 mb-2">
									No images yet
								</h3>
								<p className="text-slate-600 mb-4">
									{isOrganizer
										? "Upload the first image to showcase your group!"
										: "The group organizer hasn't uploaded any images yet."}
								</p>
								{isOrganizer && (
									<button
										onClick={() => setActiveTab("upload")}
										className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
									>
										<Plus size={18} />
										Upload First Image
									</button>
								)}
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{groupImages.map((image) => (
									<div
										key={image.id}
										className="relative group bg-slate-50 rounded-lg overflow-hidden border border-slate-200 hover:border-orange-300 transition-colors"
									>
										<div className="aspect-video relative">
											<img
												src={image.groupImage}
												alt={`Group image ${image.id}`}
												className="w-full h-full object-cover"
											/>
											<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
												<div className="flex gap-2">
													{/* View Full Size */}
													<button
														onClick={() =>
															window.open(image.groupImage, "_blank")
														}
														className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
														title="View full size"
													>
														<Eye size={16} className="text-slate-700" />
													</button>
													{/* Download */}
													<a
														href={image.groupImage}
														download={`group-${groupDetails.id}-image-${image.id}.jpg`}
														className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
														title="Download image"
													>
														<Download size={16} className="text-slate-700" />
													</a>
													{/* Delete (Organizer Only) */}
													{isOrganizer && (
														<button
															onClick={() => handleDelete(image.id)}
															className="bg-red-500/90 backdrop-blur-sm p-2 rounded-full hover:bg-red-500 transition-colors text-white"
															title="Delete image"
														>
															<Trash2 size={16} />
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
										document.getElementById("group-image-upload")?.click()
									}
									className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
								>
									<Upload size={48} className="mx-auto text-slate-400 mb-4" />
									<p className="text-lg font-medium text-slate-700 mb-2">
										Click to upload an image
									</p>
									<p className="text-sm text-slate-500 mb-4">
										PNG, JPG, or GIF (max 5MB)
									</p>
									<p className="text-xs text-slate-400">
										High-quality images help showcase your group and attract new
										members
									</p>
								</div>
							)}

							<input
								id="group-image-upload"
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="hidden"
							/>

							{/* Error Display */}
							{error && (
								<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
									<p className="text-red-700 text-sm font-medium">{error}</p>
									<button
										onClick={() => setError(null)}
										className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
									>
										Dismiss
									</button>
								</div>
							)}

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
											? "bg-orange-500 text-white hover:bg-orange-600"
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

export default GroupImages;