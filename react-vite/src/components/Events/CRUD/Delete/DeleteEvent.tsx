import React, { useEffect } from "react";
import { Form } from "react-router-dom";
import { X, AlertTriangle, Trash2, Calendar } from "lucide-react";
import { useModal } from "../../../../hooks/useModal";
import { DeleteEventProps } from "../../../../types";

const DeleteEvent: React.FC<DeleteEventProps> = ({ eventDetails }) => {
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
						<Calendar size={32} className="text-red-600" />
					</div>
					<h3 className="text-lg font-semibold text-slate-900 mb-3">
						Are you sure you want to delete this event?
					</h3>
					<div className="bg-slate-50 rounded-lg p-4 mb-4">
						<p className="font-medium text-slate-800 mb-2">Event Name:</p>
						<p className="text-slate-700 italic">"{eventDetails.name}"</p>
					</div>

					{eventDetails.image && (
						<div className="relative w-32 h-32 mx-auto mb-4 rounded-lg overflow-hidden border border-slate-200">
							<img
								src={eventDetails.image}
								alt={eventDetails.name}
								className="w-full h-full object-cover"
							/>
							<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
								<Trash2 size={24} className="text-white" />
							</div>
						</div>
					)}

					{eventDetails.startDate && (
						<p className="text-slate-600 text-sm mb-2">
							Scheduled for:{" "}
							{new Date(eventDetails.startDate).toLocaleDateString()}
						</p>
					)}

					{eventDetails.description && (
						<p className="text-slate-600 text-sm line-clamp-2 mb-4">
							{eventDetails.description}
						</p>
					)}

					<p className="text-slate-600 text-sm leading-relaxed">
						This action cannot be undone. This will permanently delete the event
						and remove all attendees.
					</p>
				</div>
			</div>

			{/* Actions */}
			<div className="flex p-6 bg-slate-50 border-t border-slate-200">
				<Form
					method="delete"
					action={`/events/${eventDetails.id}`}
					onSubmit={closeModal}
					className="w-full flex gap-3"
				>
					<input type="hidden" name="intent" value="delete-event" />
					<input type="hidden" name="group_id" value={eventDetails.groupId} />
					<input type="hidden" name="eventId" value={eventDetails.id} />
					<input type="hidden" name="id" value={eventDetails.id} />

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
						Delete Event
					</button>
				</Form>
			</div>
		</div>
	);
};

export default DeleteEvent;
