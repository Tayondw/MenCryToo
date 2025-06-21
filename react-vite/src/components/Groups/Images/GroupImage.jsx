import { Form, useActionData } from "react-router-dom";
import { useEffect } from "react";
import { useModal } from "../../../context-TSX/Modal";
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
				<button id="delete-close-button" onClick={onClose}>
					✖
				</button>
				<h3>Add an image to your group</h3>
			</div>
			<Form
				method="post"
				encType="multipart/form-data"
				type="file"
				action={`/groups/${groupDetails.id}`}
				onSubmit={onClose}
				className="image-upload-form"
			>
				<div id="group-image-upload">
					{/* <h3>Upload a group image</h3> */}
					<label htmlFor="file-upload" className="custom-file-upload">
						Choose an image
					</label>
					<input
						name="group_image"
						type="file"
						accept="image/*"
						id="file-upload"
					/>
				</div>
				<button
					type="submit"
					name="intent"
					value="add-group-image"
					className="button"
				>
					Submit
				</button>
				<input type="hidden" name="id" value={groupDetails.id} />
			</Form>
			{group_image && <img src={group_image?.name} alt="Group" />}
		</div>
	);
};

export default GroupImage;
