import { useModal } from "../../../context/Modal";
import { Form, useActionData } from "react-router-dom";
import "./GroupImage.css";

const GroupImage = ({ groupDetails}) => {
      const { closeModal } = useModal();
      const group_image = useActionData();

      // const image = groupDetails.groupImage.map((groupImage) => groupImage.groupImage)
      
	const onClose = async (event) => {
		event.preventDefault();
		closeModal();
	};

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
			>
				<input name="group_image" type="file" accept="image/*" />
				{/* {errors?.group_image && (
					<p style={{ color: "red" }} className="errors">
						{errors.group_image}
					</p>
				)} */}
				<button type="submit" name="intent" value="add-group-image" onSubmit={onClose}>
					Submit
				</button>
				<input type="hidden" name="id" value={groupDetails.id} />
			</Form>
			<img src={group_image?.name} />
		</div>
	);
};

export default GroupImage;