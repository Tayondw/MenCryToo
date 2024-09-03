import { Form, useActionData } from "react-router-dom";
import { useEffect } from "react";
import { useModal } from "../../../context/Modal";
import "./EventImage.css";

const EditEventImage = ({ eventDetails, onClose }) => {
	const event_image = useActionData();
	const { closeModal } = useModal();

	// Close modal when clicking the back button
	useEffect(() => {
		const handlePopState = () => {
			closeModal();
		};

		window.addEventListener("popstate", handlePopState);

		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [closeModal]);

	// Close modal when clicking outside of the modal content
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (event.target.classList.contains("modal-close")) {
				closeModal();
			}
		};

		document.addEventListener("click", handleClickOutside);

		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, [closeModal]);

	return (
		<div id="adding-group-image">
			<div id="image-close-confirm">
				<button id="image-close-button" onClick={onClose}>
					✖
				</button>
				<h1>Update the image to your event</h1>
			</div>

			<Form
				method="post"
				encType="multipart/form-data"
				type="file"
				action={`/events/${eventDetails.id}/images/${eventDetails.eventImage[0].id}/edit`}
				onSubmit={onClose}
			>
				<input name="event_image" type="file" accept="image/*" required />
				<button type="submit" name="intent" value="edit-event-image">
					Submit
				</button>
				<input type="hidden" name="eventId" value={eventDetails.id} />
				<input
					type="hidden"
					name="imageId"
					value={eventDetails.eventImage[0].id}
				/>
			</Form>
			{event_image && <img src={event_image?.name} alt="Event" />}
		</div>
	);
};

export default EditEventImage;
