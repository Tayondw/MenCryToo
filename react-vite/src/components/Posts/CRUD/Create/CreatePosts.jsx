import { useActionData, Form, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const CreatePost = () => {
	const errors = useActionData();
	const sessionUser = useSelector((state) => state.session.user);
	const navigate = useNavigate();

	// Ensure user is logged in
	useEffect(() => {
		if (!sessionUser) {
			navigate("/");
		}
	}, [sessionUser, navigate]);

	const [title, setTitle] = useState("");
	const [caption, setCaption] = useState("");

	return (
		<div id="new-group">
			<img
				src="https://mencrytoo.s3.amazonaws.com/login-2.png"
				alt="create-group"
				id="fit-image-content"
			/>
			{/* <div id="group-fit-image-content"></div> */}
			{sessionUser ? (
				<Form
					method="post"
					action="/posts/create"
					encType="multipart/form-data"
					type="file"
					// id="create-group-form"
					className="create-group-form"
					style={{ margin: `20%`, gap: `55%` }}
				>
					<div id="header">
						<h3>Create a Post</h3>
						<p>We&apos;ll walk you through a few steps to create a post</p>
						<hr />
					</div>
					<div id="section-2-create">
						<div id="set-name">
							<h3 style={{ fontSize: `15px` }}>
								What will your post&apos;s title be?
							</h3>
							<div className="caption">
								<p>
									Choose a title that will give people a clear idea of what the
									post is about.
									<br />
									Feel free to get creative! You can edit this later if you
									change your mind.
								</p>
							</div>
							<div id="name-input">
								<input
									id="name-input-text"
									type="text"
									placeholder="What is the title of your post?"
									name="title"
									value={title}
									onChange={(event) => setTitle(event.target.value)}
								/>
							</div>
						</div>
						{errors?.title && (
							<p style={{ color: "red" }} className="errors">
								{errors.title}
							</p>
						)}
					</div>
					<hr />
					<div id="section-3-create">
						<div id="set-description">
							<h3 style={{ fontSize: `15px` }}>Express Yourself.</h3>
							<div className="caption">
								<p>Scream and shout and let it all out!</p>
							</div>
							<div id="description-input">
								<textarea
									name="caption"
									id="group-name-textarea"
									placeholder="What's on your mind?"
									value={caption}
									onChange={(event) => setCaption(event.target.value)}
								></textarea>
							</div>
						</div>
						{errors?.caption && (
							<p style={{ color: "red" }} className="errors">
								{errors.caption}
							</p>
						)}
					</div>
					<hr />
					<div id="create-group-image-upload">
						<h3 style={{ fontSize: `15px` }}>Upload an image</h3>
						<label htmlFor="file-upload" className="custom-file-upload">
							Choose an image
						</label>
						<input name="image" type="file" accept="image/*" id="file-upload" />
						{errors?.image && (
							<p style={{ color: "red" }} className="errors">
								{errors.image}
							</p>
						)}
					</div>
					<hr />
					<div id="section-5-create">
						<button
							id="create-group-submit"
							type="submit"
							name="intent"
							value="create-post"
						>
							Create Post
						</button>
						<Link to="/profile">
							<button id="update-group-cancel">Cancel</button>
						</Link>
						<input type="hidden" name="userId" value={sessionUser.id} />
					</div>
				</Form>
			) : (
				<h1>Please log in to create your post!</h1>
			)}
		</div>
	);
};

export default CreatePost;
