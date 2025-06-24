import { useEffect } from "react";
import { Form } from "react-router-dom";
import { useModal } from "../../../../hooks/useModal";
import "./DeleteGroup.css";

const DeleteGroup = ({ groupDetails }) => {
	const { closeModal } = useModal();
	const onClose = async (event) => {
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
		<div id="event-deleteMenu">
			<div id="event-close-confirm">
				<button id="delete-close-button" onClick={onClose}>
					✖
				</button>
				<div id="confirm-delete">
					<h1>Confirm Delete</h1>
					<h3>Are you sure you want to remove {groupDetails.name}?</h3>
				</div>
			</div>
			<div id="delete-event">
				<Form
					method="delete"
					action={`/groups/${groupDetails.id}`}
					onSubmit={closeModal}
				>
					<button
						type="submit"
						name="intent"
						style={{ backgroundColor: "red" }}
						value="delete-group"
						id="button-text"
						className="button"
					>
						Yes (Delete Group)
					</button>
					<button
						id="button-text"
						style={{ backgroundColor: "darkgray" }}
						onClick={onClose}
						className="button"
					>
						No (Keep Group)
					</button>
					<input type="hidden" name="groupId" value={groupDetails.id} />
					<input type="hidden" name="id" value={groupDetails.id} />
				</Form>
			</div>
		</div>
	);
};

export default DeleteGroup;
