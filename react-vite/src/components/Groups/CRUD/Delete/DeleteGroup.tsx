import React, { useEffect } from "react";
import { Form } from "react-router-dom";
import { X, AlertTriangle, Trash2 } from "lucide-react";
import { useModal } from "../../../../hooks/useModal";
import { DeleteGroupProps } from "../../../../types/groups";

const DeleteGroup: React.FC<DeleteGroupProps> = ({ groupDetails }) => {
	const { closeModal } = useModal();

	const handleCancel = (event: React.MouseEvent) => {
		event.preventDefault();
		closeModal();
	};

	// Close modal when clicking the back button
	useEffect(() => {
		const handlePopState = () => closeModal();
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [closeModal]);

	return (
		<div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
			{/* Header */}
			<div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 border-b border-slate-200">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
							<AlertTriangle size={20} className="text-red-600" />
						</div>
						<h2 className="text-xl font-bold text-slate-900">Confirm Delete</h2>
					</div>
					<button
						onClick={handleCancel}
						className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
					>
						<X size={20} className="text-slate-500" />
					</button>
				</div>
			</div>

			{/* Body */}
			<div className="p-6 text-center">
				<div className="mb-6">
					<div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<Trash2 size={32} className="text-red-600" />
					</div>
					<h3 className="text-lg font-semibold text-slate-900 mb-3">
						Are you sure you want to delete this group?
					</h3>
					<div className="bg-slate-50 rounded-lg p-4 mb-4">
						<p className="font-medium text-slate-800 mb-2">Group Name:</p>
						<p className="text-slate-700 italic">"{groupDetails.name}"</p>
					</div>
					<p className="text-slate-600 text-sm leading-relaxed">
						This action cannot be undone. This will permanently delete the
						group, all its events, and remove all members.
					</p>
				</div>
			</div>

			{/* Actions */}
			<div className="flex p-6 bg-slate-50 border-t border-slate-200">
				<Form
					method="delete"
					action={`/groups/${groupDetails.id}`}
					onSubmit={closeModal}
					className="w-full flex gap-3"
				>
					<input type="hidden" name="intent" value="delete-group" />
					<input type="hidden" name="groupId" value={groupDetails.id} />
					<input type="hidden" name="id" value={groupDetails.id} />

					<button
						type="button"
						onClick={handleCancel}
						className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 font-medium flex items-center justify-center gap-2"
					>
						<X size={18} />
						Cancel
					</button>

					<button
						type="submit"
						className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
					>
						<Trash2 size={18} />
						Delete Group
					</button>
				</Form>
			</div>
		</div>
	);
};

export default DeleteGroup;
