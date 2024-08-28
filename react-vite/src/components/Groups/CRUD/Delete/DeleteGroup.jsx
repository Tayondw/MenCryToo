import { useModal } from "../../../../context/Modal";
import "./DeleteGroup.css";

const DeleteGroup = ({ groupDetails, navigate }) => {
	const { closeModal } = useModal();

	const yesDelete = async (event) => {
		event.preventDefault();
		try {
			const response = await fetch(`/api/groups/${groupDetails.id}/delete`, {
				method: "DELETE",
			});

			if (response.ok) {
				console.log("Group deleted successfully");
				closeModal();
				navigate("/groups");
			} else {
				console.error("Failed to delete the group");
			}
		} catch (error) {
			console.error("Error:", error);
		}
	};

	const noDelete = async (event) => {
		event.preventDefault();
		closeModal();
	};

	return (
		<div id="deleteMenu">
			<h1>Confirm Delete</h1>
			<h3>Are you sure you want to remove this group?</h3>
			<div id="button-div">
				<div>
					<button
						id="button-text"
						style={{ backgroundColor: "red" }}
						value="delete"
						type="submit"
						onClick={yesDelete}
					>
						Yes (Delete Group)
					</button>
				</div>
				<div>
					<button
						id="button-text"
						style={{ backgroundColor: "darkgray" }}
						onClick={noDelete}
					>
						No (Keep Group)
					</button>
				</div>
			</div>
		</div>
	);
};

export default DeleteGroup;
