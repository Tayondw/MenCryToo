import { useEffect } from "react";
import { Form } from "react-router-dom";
import { useModal } from "../../../../context/Modal";

const DeleteProfile = ({ sessionUser }) => {
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
					<h1>CONFIRM DELETE</h1>
					<h3 style={{ fontSize: `17.8px` }}>
						Are you sure you want to delete your profile?
                              </h3>
                              <p style={{color: `red`}}>Please note that the groups and the events you created will be deleted as well. Please inform other members of the group and event that you are deleting your profile!</p>
				</div>
			</div>
			<div id="delete-event">
				<Form method="delete" action="/profile" onSubmit={closeModal}>
					<button
						type="submit"
						name="intent"
						style={{ backgroundColor: "red" }}
						value="delete-profile"
						id="button-text"
						className="button"
					>
						Yes (Delete Profile)
					</button>
					<button
						id="button-text"
						style={{ backgroundColor: "darkgray" }}
						onClick={onClose}
						className="button"
					>
						No (Keep Profile)
					</button>
					<input type="hidden" name="userId" value={sessionUser.id} />
				</Form>
			</div>
		</div>
	);
};

export default DeleteProfile;
