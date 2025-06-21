import { Form, useActionData } from "react-router-dom";
import { useEffect } from "react";
import { useModal } from "../../../context-TSX/Modal";
import "./EventImage.css";

const EventImage = ({ eventDetails, onClose }) => {
	const event_image = useActionData();
	const { closeModal } = useModal();
	// Close modal when clicking the back button
	useEffect(() => {
		const handlePopState = () => closeModal();
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [closeModal]);

	return (
		<div id="adding-group-image" className="modal-close">
			<div id="image-close-confirm">
				<button id="delete-close-button" onClick={onClose}>
					✖
				</button>
				<h3>Add an image to your event</h3>
			</div>

			<Form
				method="post"
				encType="multipart/form-data"
				type="file"
				action={`/events/${eventDetails.id}`}
				onSubmit={onClose}
				className="image-upload-form"
			>
				<div id="group-image-upload">
					<label htmlFor="file-upload" className="custom-file-upload">
						Choose an image
					</label>
					<input
						id="file-upload"
						name="event_image"
						type="file"
						accept="image/*"
						required
					/>
				</div>

				<button
					type="submit"
					name="intent"
					value="add-event-image"
					className="button"
				>
					Submit
				</button>
				<input type="hidden" name="eventId" value={eventDetails.id} />
			</Form>
			{event_image && <img src={event_image?.name} alt="Event" />}
		</div>
	);
};

export default EventImage;
