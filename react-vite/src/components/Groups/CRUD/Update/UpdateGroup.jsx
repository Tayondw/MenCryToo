import {
	useActionData,
	Form,
	useNavigate,
	useLoaderData,
	Link,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "./UpdateGroup.css";

const UpdateGroup = () => {
	const groupDetails = useLoaderData();
	const errors = useActionData();
	const sessionUser = useSelector((state) => state.session.user);
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [about, setAbout] = useState("");
	const [type, setType] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");

	// Ensure user is logged in
	useEffect(() => {
		if (!sessionUser) navigate("/");
	}, [sessionUser, navigate]);

	// Ensure user is the group owner
	useEffect(() => {
		if (sessionUser && groupDetails.organizerId !== sessionUser.id)
			navigate("/");
	}, [groupDetails, sessionUser, navigate]);

	useEffect(() => {
		if (groupDetails) {
			setCity(groupDetails.city || "");
			setState(groupDetails.state || "");
			setName(groupDetails.name || "");
			setAbout(groupDetails.about || "");
			setType(groupDetails.type || "");
		}
	}, [groupDetails]);

	return (
		<div id="update-group-page">
			
			<div id="update-group">
				<img
					src={groupDetails.image}
					alt="create-group"
					id="fit-image-content"
				/>
				<div id="update-form">
					{sessionUser ? (
						<Form
							method="post"
							action={`/groups/${groupDetails.id}/edit`}
							className="create-group-form"
							encType="multipart/form-data"
							type="file"
						>
							<div id="header">
								<h3>Update Group Information</h3>
								<p>
									We&apos;ll walk you through a few steps to build your local
									community
								</p>
								<hr />
							</div>
							<div id="section-1-create">
								<h3 style={{ fontSize: `15px` }}>
									Where will this group be located?
								</h3>
								<div className="caption">
									<p>
										Groups meet locally, in person, and online. We&apos;ll
										connect you with people in your area.
									</p>
								</div>
								<div id="set-location">
									<div id="set-city">
										<div id="city-input">
											<input
												id="city-input-text"
												type="text"
												placeholder="City"
												name="city"
												value={city}
												onChange={(event) => setCity(event.target.value)}
											/>
										</div>
									</div>
									{errors?.city && (
										<p style={{ color: "red" }} className="errors">
											{errors.city}
										</p>
									)}
									<div id="set-state">
										<div id="state-input">
											<input
												id="state-input-text"
												type="text"
												placeholder="STATE"
												name="state"
												value={state}
												onChange={(event) => setState(event.target.value)}
											/>
										</div>
									</div>
									{errors?.state && (
										<p style={{ color: "red" }} className="errors">
											{errors.state}
										</p>
									)}
								</div>
							</div>
							<hr />
							<div id="section-2-create">
								<div id="set-name">
									<h3 style={{ fontSize: `15px` }}>
										What will your group&apos;s name be?
									</h3>
									<div className="caption">
										<p>
											Choose a name that will give people a clear idea of what
											the group is about.
											<br />
											Feel free to get creative! You can edit this later if you
											change your mind.
										</p>
									</div>
									<div id="name-input">
										<input
											id="name-input-text"
											type="text"
											placeholder="What is your group name?"
											name="name"
											value={name}
											onChange={(event) => setName(event.target.value)}
										/>
									</div>
								</div>
								{errors?.name && (
									<p style={{ color: "red" }} className="errors">
										{errors.name}
									</p>
								)}
							</div>
							<hr />
							<div id="section-3-create">
								<div id="set-description">
									<h3 style={{ fontSize: `15px` }}>
										Describe the purpose of your group.
									</h3>
									<div className="caption">
										<p>
											1. What&apos;s the purpose of the group?
											<br />
											2. Who should join?
											<br />
											3. What will you do at your events?
										</p>
									</div>
									<div id="description-input">
										<textarea
											name="about"
											id="group-name-textarea"
											placeholder="Please write at least 20 characters"
											value={about}
											onChange={(event) => setAbout(event.target.value)}
										></textarea>
									</div>
								</div>
								{errors?.about && (
									<p style={{ color: "red" }} className="errors">
										{errors.about}
									</p>
								)}
							</div>
							<hr />
							<div id="create-group-image-upload">
								<h3 style={{ fontSize: `15px` }}>Upload an image</h3>
								<label htmlFor="file-upload" className="custom-file-upload">
									Choose an image
								</label>
								<input
									name="image"
									type="file"
									accept="image/*"
									id="file-upload"
								/>
								{errors?.image && (
									<p style={{ color: "red" }} className="errors">
										{errors.image}
									</p>
								)}
							</div>
							<hr />
							<div id="section-4-create">
								<div id="set-privacy">
									<h3 style={{ fontSize: `15px` }}>Final steps...</h3>
									<div className="type-questions">
										<label id="type-questions-label" htmlFor="type-select">
											Is this an in-person or online group?
											<select
												name="type"
												id="type-select"
												value={type}
												onChange={(event) => setType(event.target.value)}
											>
												<option className="group-option-text" value="">
													(select one)
												</option>
												<option className="group-option-text" value="in-person">
													In Person
												</option>
												<option className="group-option-text" value="online">
													Online
												</option>
											</select>
										</label>
										{errors?.type && (
											<p style={{ color: "red" }} className="errors">
												{errors.type}
											</p>
										)}
									</div>
								</div>
							</div>
							<hr />
							<div id="section-5-create">
								<button
									id="create-group-submit"
									type="submit"
									name="intent"
									value="edit-group"
								>
									Update Group
								</button>
								<Link to={`/groups/${groupDetails.id}`}>
									<button id="update-group-cancel">Cancel</button>
								</Link>
								<input
									type="hidden"
									name="organizer_id"
									value={sessionUser.id}
								/>
								<input type="hidden" name="id" value={groupDetails.id} />
							</div>
						</Form>
					) : (
						<h1>Please log in to make a group!</h1>
					)}
				</div>
			</div>
		</div>
	);
};

export default UpdateGroup;
