import { Form, useActionData } from "react-router-dom";
import "./GroupImage.css";

const GroupImage = ({ groupDetails, onClose }) => {
	const group_image = useActionData();

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
                        action={`/groups/${groupDetails.id}`}
                        onSubmit={onClose}
			>
				<input name="group_image" type="file" accept="image/*" />
				<button
					type="submit"
					name="intent"
					value="add-group-image"
					
				>
					Submit
				</button>
				<input type="hidden" name="id" value={groupDetails.id} />
			</Form>
			{group_image && <img src={group_image?.name} alt="Event" />}
		</div>
	);
};

export default GroupImage;
