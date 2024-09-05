import { Form, useActionData } from "react-router-dom";
import { useEffect } from "react";
import { useModal } from "../../../context/Modal";
import "./GroupImage.css";

const EditGroupImage = ({ groupDetails, groupImageId, onClose }) => {
	const group_image = useActionData();
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

	// console.log(groupDetails);

	return (
		<div id="adding-group-image">
			<div id="image-close-confirm">
				<button id="image-close-button" onClick={onClose}>
					✖
				</button>
				<h1>Update the image to your group</h1>
			</div>
			<Form
				method="post"
				encType="multipart/form-data"
				type="file"
				action={`/groups/${groupDetails.id}/images/${groupImageId}/edit`}
				onSubmit={onClose}
			>
				<input name="group_image" type="file" accept="image/*"/>
				<button type="submit" name="intent" value="edit-group-image">
					Submit
				</button>
				<input type="hidden" name="id" value={groupDetails.id} />
				<input type="hidden" name="imageId" value={groupImageId} />
			</Form>
			{group_image && <img src={group_image?.name} alt="Group" />}
		</div>
	);
};

export default EditGroupImage;
