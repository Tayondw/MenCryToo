import React, { useEffect } from "react";
import { Form } from "react-router-dom";
import { X, AlertTriangle, Shield } from "lucide-react";
import { DeleteProfileProps } from "../../../../types";

const DeleteProfile: React.FC<DeleteProfileProps> = ({
	user,
	onClose,
	onConfirm,
}) => {
	// Close modal when clicking the back button
	useEffect(() => {
		const handlePopState = () => onClose();
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [onClose]);

	const handleCancel = (event: React.MouseEvent) => {
		event.preventDefault();
		onClose();
	};

	const handleSubmit = async () => {
		// Let the form submit naturally - the router action will handle the deletion and logout
		onConfirm();
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h2 className="flex items-center gap-3 text-xl font-semibold text-gray-900">
						<Shield size={24} />
						Confirm Account Deletion
					</h2>
					<button
						className="p-2 hover:bg-gray-100 rounded-full transition-colors"
						onClick={onClose}
						aria-label="Close modal"
					>
						<X size={20} />
					</button>
				</div>

				<div className="p-6">
					<div className="flex justify-center mb-6">
						<AlertTriangle size={60} color="#dc2626" />
					</div>

					<h3 className="text-lg font-medium text-gray-900 text-center mb-6">
						Are you sure you want to permanently delete your account?
					</h3>

					<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<div className="flex items-center gap-2 text-red-800 font-medium mb-3">
							<AlertTriangle size={16} />
							This action cannot be undone
						</div>
						<p className="text-red-700 mb-3">
							Deleting your account will permanently remove:
						</p>
						<ul className="text-red-700 space-y-1 ml-4">
							<li className="list-disc">
								Your profile and all personal information
							</li>
							<li className="list-disc">
								All posts, comments, and interactions
							</li>
							<li className="list-disc">
								Any groups you created (members will be notified)
							</li>
							<li className="list-disc">
								Events you organized (attendees will be notified)
							</li>
							<li className="list-disc">
								Your connections and network within the platform
							</li>
						</ul>

						<div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-800">
							<strong>Important:</strong> Please inform group members and event
							attendees before proceeding!
						</div>
					</div>
				</div>

				<div className="flex gap-3 p-6 border-t border-gray-200">
					<button
						className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
						onClick={handleCancel}
					>
						Cancel
					</button>

					<Form
						method="post"
						onSubmit={handleSubmit}
						style={{ display: "inline" }}
					>
						<input type="hidden" name="intent" value="delete-profile" />
						<input type="hidden" name="userId" value={user.id.toString()} />
						<button
							type="submit"
							className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
						>
							Delete Account
						</button>
					</Form>
				</div>
			</div>
		</div>
	);
};

export default DeleteProfile;
