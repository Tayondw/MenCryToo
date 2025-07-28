import React, { useState, useEffect } from "react";
import { Form, useNavigation, useActionData } from "react-router-dom";
import { X, Plus, Check } from "lucide-react";
import { AddTagsProps } from "../../../types";

const AddTags: React.FC<AddTagsProps> = ({ user, onClose }) => {
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [wasSubmitting, setWasSubmitting] = useState(false);
	const navigation = useNavigation();
	const actionData = useActionData() as { error?: string } | null;

	const availableTags = [
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

	// Get current user tags
	const currentUserTags = user.usersTags?.map((tag) => tag.name) || [];

	// Filter out tags the user already has
	const availableNewTags = availableTags.filter(
		(tag) => !currentUserTags.includes(tag),
	);

	const isSubmitting = navigation.state === "submitting";

	// Track when we start submitting
	useEffect(() => {
		if (isSubmitting) {
			setWasSubmitting(true);
		}
	}, [isSubmitting]);

	// Close modal when clicking the back button
	useEffect(() => {
		const handlePopState = () => onClose();
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [onClose]);

	// Close modal on successful submission
	useEffect(() => {
		// If we were submitting and now we're idle, and there's no error, close the modal
		if (wasSubmitting && navigation.state === "idle" && !actionData?.error) {
			// Small delay to allow any state updates to complete
			const timer = setTimeout(() => {
				onClose();
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [wasSubmitting, navigation.state, actionData, onClose]);

	const handleTagToggle = (tag: string) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
		);
	};

	const handleCancel = (event: React.MouseEvent) => {
		event.preventDefault();
		onClose();
	};

	return (
		<div className="max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] h-auto flex flex-col">
			{/* Modal Header */}
			<div className="flex items-center justify-between px-8 pt-8 pb-4 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200 flex-shrink-0">
				<h2 className="text-2xl font-bold text-sky-700 flex items-center gap-3 flex-1 min-w-0">
					<Plus size={24} />
					Add New Tags
				</h2>
				<button
					className="bg-transparent border-none text-gray-500 cursor-pointer p-2 rounded-lg transition-all duration-200 flex items-center justify-center w-10 h-10 flex-shrink-0 hover:bg-blue-100 hover:text-sky-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					onClick={onClose}
					aria-label="Close modal"
				>
					<X size={20} />
				</button>
			</div>

			{/* Modal Body */}
			<div className="px-8 py-8 flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
				<div className="mb-8 text-center">
					<p className="text-base text-gray-600 m-0 leading-relaxed">
						Select additional tags that resonate with you. These help connect
						you with similar users.
					</p>
				</div>

				{/* Show error message if any */}
				{actionData?.error && (
					<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-center">
						{actionData.error}
					</div>
				)}

				{availableNewTags.length > 0 ? (
					<>
						<div className="mb-8">
							<h3 className="text-lg font-semibold text-gray-800 m-0 mb-4">
								Available Tags
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
								{availableNewTags.map((tag) => (
									<label
										key={tag}
										className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 bg-white relative overflow-hidden hover:border-blue-500 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/15 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
									>
										<input
											type="checkbox"
											checked={selectedTags.includes(tag)}
											onChange={() => handleTagToggle(tag)}
											className="hidden"
										/>
										<span
											className={`w-5 h-5 border-2 rounded flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
												selectedTags.includes(tag)
													? "bg-blue-500 border-blue-500 text-white"
													: "border-gray-300 bg-white"
											}`}
										>
											{selectedTags.includes(tag) && <Check size={12} />}
										</span>
										<span className="text-sm text-gray-700 font-medium flex-1 hover:text-gray-800">
											{tag}
										</span>
									</label>
								))}
							</div>
						</div>

						{selectedTags.length > 0 && (
							<div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-6 mb-8">
								<h4 className="text-base font-semibold text-sky-700 m-0 mb-4">
									Selected Tags ({selectedTags.length})
								</h4>
								<div className="flex flex-wrap gap-2">
									{selectedTags.map((tag) => (
										<span
											key={tag}
											className="bg-blue-500 text-white px-3 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all duration-200 hover:bg-blue-600 hover:scale-105"
										>
											{tag}
											<button
												type="button"
												onClick={() => handleTagToggle(tag)}
												className="bg-transparent border-none text-white cursor-pointer p-0.5 rounded-full transition-all duration-200 flex items-center justify-center hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
												aria-label={`Remove ${tag}`}
											>
												<X size={14} />
											</button>
										</span>
									))}
								</div>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-12 px-4">
						<div className="mb-6 flex justify-center">
							<Check size={48} className="text-emerald-500" />
						</div>
						<h3 className="text-2xl font-bold text-emerald-600 m-0 mb-4">
							All Tags Added!
						</h3>
						<p className="text-base text-gray-600 m-0 leading-relaxed">
							You've already added all available tags to your profile. Great job
							building your interests!
						</p>
					</div>
				)}

				{currentUserTags.length > 0 && (
					<div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
						<h4 className="text-base font-semibold text-gray-700 m-0 mb-4">
							Your Current Tags
						</h4>
						<div className="flex flex-wrap gap-2">
							{currentUserTags.map((tag) => (
								<span
									key={tag}
									className="bg-gray-200 text-gray-700 px-3 py-2 rounded-full text-xs font-medium"
								>
									{tag}
								</span>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Modal Actions */}
			<div className="flex gap-4 px-8 pt-6 pb-8 bg-gray-50 border-t border-gray-200 justify-end flex-shrink-0">
				<button
					className="px-6 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-600 font-semibold cursor-pointer transition-all duration-200 text-sm min-w-[120px] hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-400/10 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					onClick={handleCancel}
					disabled={isSubmitting}
				>
					Cancel
				</button>

				{availableNewTags.length > 0 && (
					<Form method="post" action="/profile" className="inline">
						<input type="hidden" name="intent" value="add-tags" />
						<input type="hidden" name="userId" value={user.id.toString()} />

						{/* Add hidden inputs for each selected tag */}
						{selectedTags.map((tag) => (
							<input key={tag} type="hidden" name="userTags" value={tag} />
						))}

						<button
							type="submit"
							className="px-6 py-3 border-none rounded-lg bg-gradient-to-r from-orangy to-blue-600 text-white font-semibold cursor-pointer transition-all duration-200 text-sm min-w-[140px] relative overflow-hidden hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
							disabled={selectedTags.length === 0 || isSubmitting}
						>
							{isSubmitting
								? "Adding..."
								: `Add ${selectedTags.length} Tag${
										selectedTags.length !== 1 ? "s" : ""
								  }`}
						</button>
					</Form>
				)}
			</div>
		</div>
	);
};

export default AddTags;
