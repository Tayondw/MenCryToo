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
		<div id="deleteMenu">
			<div id="event-close-confirm">
				<h1>Confirm Delete</h1>
				<h3>Are you sure you want to remove this event?</h3>
				<button id="delete-close-button" onClick={onClose}>
					✖
				</button>
			</div>
			<div id="delete-event">
				<div>
					<h2>Are you sure you want to delete {eventDetails.name}?</h2>
				</div>
				<div id="event-delete-buttons">
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
							className="event-delete-button"
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
		</div>
	);
};

export default DeleteEvent;
