import { Form, useActionData } from "react-router-dom";
import { useEffect } from "react";
import { useModal } from "../../../context/Modal";
import "./GroupImage.css";

const GroupImage = ({ groupDetails, onClose }) => {
	const group_image = useActionData();
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
				<button id="image-close-button" onClick={onClose}>
					✖
				</button>
				<h1>Add an image to your group</h1>
			</div>
			<Form
				method="post"
				encType="multipart/form-data"
				type="file"
				action={`/groups/${groupDetails.id}`}
				onSubmit={onClose}
			>
				<input name="group_image" type="file" accept="image/*" multiple />
				<button type="submit" name="intent" value="add-group-image">
					Submit
				</button>
				<input type="hidden" name="id" value={groupDetails.id} />
			</Form>
			{group_image && <img src={group_image?.name} alt="Group" />}
		</div>
	);
};

export default GroupImage;
