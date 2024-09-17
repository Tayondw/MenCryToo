import {
	useActionData,
	Form,
	useNavigate,
	useLoaderData,
	Link,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "./CreateEvent.css";

const CreateEvent = () => {
	const errors = useActionData();
	const sessionUser = useSelector((state) => state.session.user);
	const navigate = useNavigate();
	const groupDetails = useLoaderData();

	// Ensure user is logged in
	useEffect(() => {
		if (!sessionUser) navigate("/");
	}, [sessionUser, navigate]);

	// Ensure user is the group owner
	useEffect(() => {
		if (sessionUser && groupDetails.organizerId !== sessionUser.id)
			navigate("/");
	}, [groupDetails, sessionUser, navigate]);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [type, setType] = useState("");
	const [capacity, setCapacity] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const formatDate = (date) => {
		if (!date) return;

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");

		return `${year}-${month}-${day}T${hours}:${minutes}`;
	};

	return (
		<div id="new-event">
			{sessionUser && groupDetails ? (
				<div id="events-section-1">
					<img
						src={groupDetails.image}
						alt={groupDetails.name}
						id="fit-image-content"
						sizes="(min-width: 768px) 1440px, 720px"
					/>
					<div className="create-event">
						<Form
							method="post"
							action={`/groups/${groupDetails.id}/events/new`}
							className="create-event-form"
							encType="multipart/form-data"
							type="file"
						>
							<h3
								style={{
									fontWeight: 800,
									fontSize: `29.4px`,
									marginTop: `20px`,
								}}
							>
								Create an event for {groupDetails.name}
							</h3>
							<hr />
							<div id="name-input">
								<h3>EVENT NAME</h3>
								<label>
									What is the name of your event?
									<input
										id="event-name-input"
										type="text"
										name="name"
										placeholder="Event Name"
										value={name}
										onChange={(event) => setName(event.target.value)}
									/>
								</label>
								{errors?.name && (
									<p style={{ color: "red" }} className="errors">
										{errors.name}
									</p>
								)}
							</div>
							<hr />
							<div id="event-status">
								<h3>Type of Event</h3>
								<label>
									Is this an in-person or online event?
									<select
										name="type"
										id="event-privacy-select"
										value={type}
										onChange={(event) => setType(event.target.value)}
									>
										<option value="">(select one)</option>
										<option value="in-person">In Person</option>
										<option value="online">Online</option>
									</select>
								</label>
								{errors?.type && (
									<p style={{ color: "red" }} className="errors">
										{errors.type}
									</p>
								)}
								<label>
									How many people can attend the event?
									<input
										id="event-capacity-select"
										type="number"
										min="2"
										step="any"
										name="capacity"
										placeholder="0"
										value={capacity}
										onChange={(event) => setCapacity(event.target.value)}
									/>
								</label>
								{errors?.capacity && (
									<p style={{ color: "red" }} className="errors">
										{errors.capacity}
									</p>
								)}
							</div>
							<hr />
							<div id="event-date-time">
								<h3>EVENT STATUS</h3>

								<label>
									When does your event start?
									<input
										id="event-startDate-select"
										type="datetime-local"
										name="startDate"
										value={startDate ? formatDate(new Date(startDate)) : ""}
										onChange={(event) => setStartDate(event.target.value)}
									/>
								</label>
								{errors?.startDate && (
									<p style={{ color: "red" }} className="errors">
										{errors.startDate}
									</p>
								)}
								<label>
									When does your event end?
									<input
										id="event-endDate-select"
										type="datetime-local"
										name="endDate"
										value={endDate ? formatDate(new Date(endDate)) : ""}
										onChange={(event) => setEndDate(event.target.value)}
									/>
								</label>
								{errors?.endDate && (
									<p style={{ color: "red" }} className="errors">
										{errors.endDate}
									</p>
								)}
							</div>

							<hr />
							<div id="event-description">
								<h3>EVENT DESCRIPTION</h3>
								<label>
									Please an event description:
									<textarea
										name="description"
										id="event-description-textarea"
										placeholder="Please include at least 50 characters."
										value={description}
										onChange={(event) => setDescription(event.target.value)}
									></textarea>
								</label>
								{errors?.description && (
									<p style={{ color: "red" }} className="errors">
										{errors.description}
									</p>
								)}
							</div>
							<hr />
							<div id="create-group-image-upload">
								<h3>Upload an event image</h3>
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
							<div id="create-event">
								<button
									type="submit"
									id="create-group-submit"
									name="intent"
									value="create-event"
								>
									Create Event
								</button>
								<Link to={`/groups/${groupDetails.id}`}>
									<button id="update-group-cancel">Cancel</button>
								</Link>
								<input type="hidden" name="group_id" value={groupDetails.id} />
							</div>
						</Form>
					</div>
				</div>
			) : (
				<h1>Please log in to create an event!</h1>
			)}
		</div>
	);
};

export default CreateEvent;
