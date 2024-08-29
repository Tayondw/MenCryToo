import { Form, useActionData } from "react-router-dom";
import "./EventImage.css";

const EventImage = ({ eventDetails, onClose }) => {
	const event_image = useActionData();

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
				action={`/events/${eventDetails.id}/images`}
				onSubmit={onClose}
			>
				<input name="event_image" type="file" accept="image/*" required />
				<button type="submit" name="intent" value="add-event-image">
					Submit
				</button>
				<input type="hidden" name="eventId" value={eventDetails.id} />
			</Form>
			{event_image && <img src={event_image?.name} alt="Event" />}
		</div>
	);
};

export default EventImage;
