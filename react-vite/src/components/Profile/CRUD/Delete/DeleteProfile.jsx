import { Form } from "react-router-dom";
import { useModal } from "../../../../context/Modal";

const DeleteProfile = ({userProfile}) => {
	const { closeModal } = useModal();
	const onClose = async (event) => {
		event.preventDefault();
		closeModal();
	};
	return (
		<div id="deleteMenu">
			<div id="event-close-confirm">
				<h1>Confirm Delete</h1>
                        <h3>Are you sure you want to remove your profile? </h3>
                        <h4>Please keep in mind you will still be a user but you will lose access to certain items</h4>
				<button id="delete-close-button" onClick={onClose}>
					✖
				</button>
			</div>
			<div id="delete-event">
				<div>
					<h2>Are you sure you want to delete your profile?</h2>
				</div>
				<div id="event-delete-buttons">
					<Form
						method="delete"
						action="/profile"
						onSubmit={closeModal}
					>
						<button
							type="submit"
							name="intent"
							style={{ backgroundColor: "red" }}
							value="delete-profile"
							className="event-delete-button"
						>
							Yes (Delete Profile)
						</button>
						<button
							id="button-text"
							style={{ backgroundColor: "darkgray" }}
							onClick={onClose}
						>
							No (Keep Profile)
						</button>
						<input type="hidden" name="userId" value={userProfile.id} />
					</Form>
				</div>
			</div>
		</div>
	);
};

export default DeleteProfile;
