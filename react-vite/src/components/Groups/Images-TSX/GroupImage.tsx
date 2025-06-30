import React, { useState, useEffect } from "react";
import { Form } from "react-router-dom";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { useModal } from "../../../hooks/useModal";

interface GroupImageProps {
	groupDetails: {
		id: number;
		name: string;
	};
	onClose: () => void;
}

const GroupImage: React.FC<GroupImageProps> = ({ groupDetails, onClose }) => {
	// const group_image = useActionData();
	const { closeModal } = useModal();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	// Close modal when clicking the back button
	useEffect(() => {
		const handlePopState = () => closeModal();
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [closeModal]);

	// Handle file selection
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);

			// Create preview URL
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewUrl(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-lg w-full">
			{/* Header */}
			<div className="bg-gradient-to-r from-orange-50 to-slate-50 p-6 border-b border-slate-200">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
							<ImageIcon size={20} className="text-orange-600" />
						</div>
						<h2 className="text-xl font-bold text-slate-900">
							Add Group Image
						</h2>
					</div>
					<button
						onClick={onClose}
						className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
					>
						<X size={20} className="text-slate-500" />
					</button>
				</div>
			</div>

			{/* Body */}
			<div className="p-6">
				<p className="text-slate-600 mb-6 text-center">
					Upload an image to showcase your group. High-quality images help
					attract new members.
				</p>

				<Form
					method="post"
					encType="multipart/form-data"
					action={`/groups/${groupDetails.id}`}
					onSubmit={onClose}
					className="space-y-6"
				>
					<input type="hidden" name="id" value={groupDetails.id} />
					<input type="hidden" name="intent" value="add-group-image" />

					{previewUrl ? (
						<div className="space-y-4">
							<div className="relative rounded-lg overflow-hidden border border-slate-200">
								<img
									src={previewUrl}
									alt="Preview"
									className="w-full h-48 object-cover"
								/>
								<button
									type="button"
									onClick={() => {
										setPreviewUrl(null);
										setSelectedFile(null);
									}}
									className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1 rounded-full hover:bg-white transition-colors"
								>
									<X size={16} className="text-slate-700" />
								</button>
							</div>
							<p className="text-sm text-slate-500 text-center">
								{selectedFile?.name} ({Math.round(selectedFile?.size / 1024)}{" "}
								KB)
							</p>
						</div>
					) : (
						<div
							onClick={() =>
								document.getElementById("group-image-upload")?.click()
							}
							className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
						>
							<Upload size={32} className="mx-auto text-slate-400 mb-2" />
							<p className="text-sm font-medium text-slate-700 mb-1">
								Click to upload an image
							</p>
							<p className="text-xs text-slate-500">
								PNG, JPG, or GIF (max 5MB)
							</p>
						</div>
					)}

					<input
						id="group-image-upload"
						name="group_image"
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						className="hidden"
					/>

					<div className="flex gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!selectedFile}
							className={`flex-1 px-4 py-2 rounded-lg font-medium ${
								selectedFile
									? "bg-orange-500 text-white hover:bg-orange-600"
									: "bg-slate-300 text-slate-500 cursor-not-allowed"
							} transition-colors`}
						>
							Upload Image
						</button>
					</div>
				</Form>
			</div>
		</div>
	);
};

export default GroupImage;
