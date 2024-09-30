import { useEffect } from "react";
import { Form } from "react-router-dom";
import { useModal } from "../../../../context/Modal";
import "./DeletePost.css";

const DeletePost = ({ post }) => {
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
                              <h3 style={{ display: `flex`, flexDirection: `row`, flexWrap: `wrap`, alignItems: `center`, justifyContent: `center`}}>Are you sure you want to delete <h3 style={{color: `red`}}>{post.title}</h3>?</h3>
				</div>
			</div>
			<div id="delete-event">
				<Form
					method="delete"
					action="/posts-feed"
					onSubmit={closeModal}
				>
					<button
						type="submit"
						name="intent"
						style={{ backgroundColor: "red" }}
						value="delete-post"
						id="button-text"
						className="button"
					>
						Yes (Delete Post)
					</button>
					<button
						id="button-text"
						style={{ backgroundColor: "darkgray" }}
						onClick={onClose}
						className="button"
					>
						No (Keep Post)
					</button>
					<input type="hidden" name="postId" value={post.id} />
				</Form>
			</div>
		</div>
	);
};

export default DeletePost;
