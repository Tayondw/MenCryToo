import { useModal } from "../../../context/Modal";
import { Form, useActionData } from "react-router-dom";
import "./EventImage.css";

const EventImage = ({ eventDetails }) => {
	const { closeModal } = useModal();
	const event_image = useActionData();
	const onClose = async (event) => {
		event.preventDefault();
		closeModal();
	};

	return (
		<div id="adding-group-image">
			<div id="image-close-confirm">
				<h1>Add an image to your event</h1>
				<button id="image-close-button" onClick={onClose}>
					✖
				</button>
			</div>
			<Form
				method="post"
				encType="multipart/form-data"
				type="file"
				action={`/groups/${eventDetails.id}`}
			>
				<input name="event_image" type="file" accept="image/*" />
				<button
					type="submit"
					name="intent"
					value="add-event-image"
					onSubmit={onClose}
				>
					Submit
				</button>
				<input type="hidden" name="id" value={eventDetails.id} />
			</Form>
			<img src={event_image?.name} />
		</div>
	);
};

export default EventImage;