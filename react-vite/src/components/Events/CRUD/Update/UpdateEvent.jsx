import {
	useActionData,
	Form,
	useNavigate,
	useLoaderData,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Footer from "../../../Footer";
import "./UpdateEvent.css";

const UpdateEvent = () => {
	const errors = useActionData();
	const sessionUser = useSelector((state) => state.session.user);
	const navigate = useNavigate();
      const eventDetails = useLoaderData();
      const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [type, setType] = useState("");
	const [capacity, setCapacity] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
      console.log("events", eventDetails);
      
	// Ensure user is logged in
	useEffect(() => {
		if (!sessionUser) {
			navigate("/");
		}
	}, [sessionUser, navigate]);

	// Ensure user is the group owner
	useEffect(() => {
		if (sessionUser && eventDetails.organizer.id !== sessionUser.id) {
			navigate("/");
		}
	}, [eventDetails, sessionUser, navigate]);

	useEffect(() => {
		if (eventDetails) {
			setName(eventDetails.name || "");
			setDescription(eventDetails.description || "");
			setType(eventDetails.type || "");
			setCapacity(eventDetails.capacity || "");
			setStartDate(eventDetails.startDate || "");
			setEndDate(eventDetails.endDate || "");
		}
	}, [eventDetails]);

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
		<div id="update-event">
			{sessionUser && eventDetails ? (
				<div id="events-section-1">
					<h1>Create an event for {eventDetails.name}</h1>
					<Form
						method="post"
						action={`/groups/${eventDetails.groupId}/events/${eventDetails.id}`}
						className="update-event"
					>
						<div id="name-input">
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
							<label>
								Is this an in-person or online group?
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
							<label>
								Please describe your event:
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
						<div id="create-event">
							<button
								type="submit"
								id="edit-event-submit"
								name="intent"
								value="edit-event"
							>
								Update Event
							</button>
							<input type="hidden" name="group_id" value={eventDetails.groupId} />
							<input type="hidden" name="eventId" value={eventDetails.id} />
						</div>
					</Form>
				</div>
			) : (
				<h1>Please log in to update an event!</h1>
			)}
			<Footer />
		</div>
	);
};

export default UpdateEvent;
