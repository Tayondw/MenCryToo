import React, { useState, useEffect } from "react";
import { useActionData, Form, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
	ArrowLeft,
	Image as ImageIcon,
	PenTool,
	Send,
	X,
	Info,
	MessageSquare,
	Heart,
	Users,
	Camera,
	Upload,
} from "lucide-react";
import { RootState, PostFormErrors } from "../../../../types";

const CreatePost: React.FC = () => {
	const errors = useActionData() as PostFormErrors;
	const sessionUser = useSelector((state: RootState) => state.session.user);
	const navigate = useNavigate();

	// Form state
	const [title, setTitle] = useState("");
	const [caption, setCaption] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Character limits
	const TITLE_MAX_LENGTH = 25;
	const CAPTION_MAX_LENGTH = 500;
	const CAPTION_MIN_LENGTH = 50;

	// Ensure user is logged in
	useEffect(() => {
		if (!sessionUser) {
			navigate("/");
		}
	}, [sessionUser, navigate]);

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
	};

	// Calculate if form is valid
	const isFormValid =
		title.length >= 5 &&
		title.length <= TITLE_MAX_LENGTH &&
		caption.length >= CAPTION_MIN_LENGTH &&
		caption.length <= CAPTION_MAX_LENGTH &&
		imageFile !== null;

	if (!sessionUser) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
					<h1 className="text-2xl font-bold text-slate-900 mb-4">
						Please Log In
					</h1>
					<p className="text-slate-600 mb-6">
						You need to be logged in to create a post.
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
							to="/similar-feed"
							className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
						>
							<ArrowLeft size={20} />
							Back to Posts
						</Link>
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-4 py-12">
				<div className="grid md:grid-cols-2 gap-8 items-start">
					{/* Left Column - Image and Preview */}
					<div className="space-y-8">
						{/* Hero Image */}
						<div className="relative rounded-2xl overflow-hidden shadow-xl">
							<img
								src="https://mencrytoo.s3.amazonaws.com/login-2.png"
								alt="Create post"
								className="w-full h-auto object-cover rounded-2xl"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent flex items-end">
								<div className="p-8 text-white">
									<h2 className="text-3xl font-bold mb-2">Share Your Story</h2>
									<p className="text-slate-200">
										Your voice matters in our community
									</p>
								</div>
							</div>
						</div>

						{/* Post Preview */}
						<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
							<div className="p-6">
								<h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
									<PenTool size={18} className="text-orange-500" />
									Post Preview
								</h3>

								{previewImage ? (
									<div className="space-y-4">
										<div className="flex items-center gap-3">
											<img
												src={sessionUser.profileImage}
												alt={sessionUser.username}
												className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
											/>
											<div>
												<p className="font-semibold text-slate-900">
													{sessionUser.username}
												</p>
												<p className="text-xs text-slate-500">Just now</p>
											</div>
										</div>

										<h4 className="font-semibold text-lg text-slate-800">
											{title || "Your post title will appear here"}
										</h4>

										<div className="rounded-xl overflow-hidden border border-slate-200">
											<img
												src={previewImage}
												alt="Preview"
												className="w-full h-48 object-cover"
											/>
										</div>

										<p className="text-slate-700 text-sm">
											{caption || "Your caption will appear here..."}
										</p>

										<div className="flex items-center gap-4 text-slate-500 text-sm">
											<span className="flex items-center gap-1">
												<Heart size={14} />0
											</span>
											<span className="flex items-center gap-1">
												<MessageSquare size={14} />0
											</span>
											<span className="flex items-center gap-1">
												<Users size={14} />0
											</span>
										</div>
									</div>
								) : (
									<div className="text-center py-8 px-4">
										<div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
											<ImageIcon size={24} className="text-slate-400" />
										</div>
										<p className="text-slate-500 mb-2">
											Your post preview will appear here
										</p>
										<p className="text-slate-400 text-sm">
											Fill out the form and upload an image to see how your post
											will look
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Right Column - Form */}
					<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
						<div className="flex items-center gap-4 mb-8">
							<div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
								<PenTool size={24} className="text-white" />
							</div>
							<div>
								<h2 className="text-2xl font-bold text-slate-900">
									Create a Post
								</h2>
								<p className="text-slate-600">
									Share your thoughts with the community
								</p>
							</div>
						</div>

						<Form
							method="post"
							encType="multipart/form-data"
							className="space-y-6"
							onSubmit={handleSubmit}
						>
							<input type="hidden" name="intent" value="create-post" />
							<input type="hidden" name="userId" value={sessionUser.id} />

							{/* Title */}
							<div className="space-y-2">
								<label
									htmlFor="title"
									className="block text-sm font-medium text-slate-700"
								>
									Post Title
								</label>
								<input
									id="title"
									name="title"
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="What's your post about?"
									className={`w-full px-4 py-3 border ${
										errors?.title ? "border-red-300" : "border-slate-300"
									} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
									maxLength={TITLE_MAX_LENGTH}
									required
								/>
								<div className="flex justify-between items-center text-xs">
									<div>
										{errors?.title ? (
											<p className="text-red-600">{errors.title}</p>
										) : (
											<p className="text-slate-500">
												Choose a clear, descriptive title (5-25 characters)
											</p>
										)}
									</div>
									<div
										className={`${
											title.length > TITLE_MAX_LENGTH - 5
												? "text-orange-500"
												: "text-slate-500"
										}`}
									>
										{title.length}/{TITLE_MAX_LENGTH}
									</div>
								</div>
							</div>

							{/* Caption */}
							<div className="space-y-2">
								<label
									htmlFor="caption"
									className="block text-sm font-medium text-slate-700"
								>
									Caption
								</label>
								<textarea
									id="caption"
									name="caption"
									value={caption}
									onChange={(e) => setCaption(e.target.value)}
									placeholder="Express yourself. Share your thoughts, experiences, or insights... (minimum 50 characters)"
									rows={6}
									className={`w-full px-4 py-3 border ${
										errors?.caption ? "border-red-300" : "border-slate-300"
									} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none`}
									maxLength={CAPTION_MAX_LENGTH}
									required
								/>
								<div className="flex justify-between items-center text-xs">
									<div>
										{errors?.caption ? (
											<p className="text-red-600">{errors.caption}</p>
										) : (
											<p className="text-slate-500">
												{caption.length < CAPTION_MIN_LENGTH
													? `Please write at least ${CAPTION_MIN_LENGTH} characters`
													: "Great! Your caption meets the minimum length"}
											</p>
										)}
									</div>
									<div
										className={`${
											caption.length > CAPTION_MAX_LENGTH - 50
												? "text-orange-500"
												: caption.length >= CAPTION_MIN_LENGTH
												? "text-green-500"
												: "text-slate-500"
										}`}
									>
										{caption.length}/{CAPTION_MAX_LENGTH}
									</div>
								</div>
							</div>

							{/* Image Upload */}
							<div className="space-y-2">
								<label
									htmlFor="image"
									className="block text-sm font-medium text-slate-700"
								>
									Upload an Image
								</label>

								{previewImage ? (
									<div className="relative">
										<img
											src={previewImage}
											alt="Preview"
											className="w-full h-48 object-cover rounded-lg border border-slate-300"
										/>
										<button
											type="button"
											onClick={() => {
												setPreviewImage(null);
												setImageFile(null);
											}}
											className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1 rounded-full hover:bg-white transition-colors"
										>
											<X size={16} className="text-slate-700" />
										</button>
										<button
											type="button"
											onClick={() =>
												document.getElementById("image-upload")?.click()
											}
											className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium hover:bg-white transition-colors flex items-center gap-1"
										>
											<Camera size={12} />
											Change
										</button>
									</div>
								) : (
									<div
										onClick={() =>
											document.getElementById("image-upload")?.click()
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
									id="image-upload"
									name="image"
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									className="hidden"
									required
								/>

								{errors?.image && (
									<p className="text-red-600 text-xs">{errors.image}</p>
								)}
							</div>

							{/* Tips */}
							<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<Info size={16} className="text-orange-500" />
									<h4 className="font-medium text-slate-800">Posting Tips</h4>
								</div>
								<ul className="text-sm text-slate-700 space-y-1 pl-6 list-disc">
									<li>Be respectful and considerate of others</li>
									<li>Share personal experiences that might help others</li>
									<li>Use appropriate language and content</li>
									<li>
										Respect privacy - don't share others' personal information
									</li>
								</ul>
							</div>

							{/* Form Actions */}
							<div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-4 justify-end">
								<Link
									to="/similar-feed"
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
											Creating...
										</>
									) : (
										<>
											<Send size={18} />
											Create Post
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

export default CreatePost;