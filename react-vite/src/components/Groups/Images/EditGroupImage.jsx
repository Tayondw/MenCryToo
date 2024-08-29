import { Form, useActionData } from "react-router-dom";
import "./GroupImage.css";

const EditGroupImage = ({ groupDetails, groupImageId, onClose }) => {
	const group_image = useActionData();

	// console.log(groupDetails);

	return (
		<div id="adding-group-image">
			<div id="image-close-confirm">
				<h1>Add an image to your group</h1>
				<button id="image-close-button" onClick={onClose}>
					✖
				</button>
			</div>
			<Form
				method="post"
				encType="multipart/form-data"
				type="file"
				action={`/groups/${groupDetails.id}/images/${groupImageId}/edit`}
				onSubmit={onClose}
			>
				<input name="group_image" type="file" accept="image/*" />
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
