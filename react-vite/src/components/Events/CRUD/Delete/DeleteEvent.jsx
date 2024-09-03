import { Form } from "react-router-dom";
import { useModal } from "../../../../context/Modal";
import "./DeleteEvent.css";

const DeleteEvent = ({ eventDetails }) => {
	const { closeModal } = useModal();
	const onClose = async (event) => {
		event.preventDefault();
		closeModal();
	};

	return (
		<div id="event-deleteMenu">
			<div id="event-close-confirm">
				<button id="delete-close-button" onClick={onClose}>
					✖
				</button>
				<div id="confirm-delete">
					<h1>Confirm Delete</h1>
					<h3>Are you sure you want to remove {eventDetails.name}?</h3>
				</div>
			</div>
			<div id="delete-event">
				<Form
					method="delete"
					action={`/events/${eventDetails.id}`}
					onSubmit={closeModal}
				>
					<button
						type="submit"
						name="intent"
						style={{ backgroundColor: "red" }}
						value="delete-event"
						id="button-text"
						className="event-delete-button-modal"
					>
						Yes (Delete Event)
					</button>
					<button
						id="button-text"
						style={{ backgroundColor: "darkgray" }}
						onClick={onClose}
					>
						No (Keep Event)
					</button>
					<input type="hidden" name="group_id" value={eventDetails.groupId} />
					<input type="hidden" name="eventId" value={eventDetails.id} />
					<input type="hidden" name="id" value={eventDetails.id} />
				</Form>
			</div>
		</div>
	);
};

export default DeleteEvent;
