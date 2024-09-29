import { useActionData, Form, Link } from "react-router-dom";
import { useState } from "react";
import "./Partnership.css";

const Partnership = () => {
	const errors = useActionData();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [subject, setSubject] = useState("");
	const [message, setMessage] = useState("");

	return (
		<div id="partnership-form">
			<Form
				id="contact-form"
				action="/partnership"
				method="post"
				// type="file"
				encType="multipart/form-data"
			>
				<div className="col-12 col-md-6">
					<label className="text-sm fw-normal font-Inter leading-tight mb-3 d-block">
						First Name
					</label>
					<input
						id="first-name-input-text"
						type="text"
						placeholder="First Name"
						name="firstName"
						value={firstName}
						onChange={(event) => setFirstName(event.target.value)}
						required
					/>
				</div>
				{errors?.firstName && (
					<p style={{ color: "red" }} className="errors">
						{errors.firstName}
					</p>
				)}
				<div className="col-12 col-md-6">
					<label className="text-sm fw-normal font-Inter leading-tight mb-3 d-block">
						Last Name
					</label>
					<input
						id="last-name-input-text"
						type="text"
						placeholder="Last Name"
						name="lastName"
						value={lastName}
						onChange={(event) => setLastName(event.target.value)}
						required
					/>
				</div>
				{errors?.lastName && (
					<p style={{ color: "red" }} className="errors">
						{errors.lastName}
					</p>
				)}
				<div className="col-12 col-md-6">
					<label className="text-sm fw-normal font-Inter leading-tight mb-3 d-block">
						Email
					</label>
					<input
						id="email-input-text"
						type="text"
						placeholder="Email"
						name="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						required
					/>
				</div>
				{errors?.email && (
					<p style={{ color: "red" }} className="errors">
						{errors.email}
					</p>
				)}
				<div className="col-12 col-md-6">
					<label className="text-sm fw-normal font-Inter leading-tight mb-3 d-block">
						Phone
					</label>
					<input
						id="Phone"
						type="text"
						placeholder="Phone Number"
						name="phone"
						value={phone}
						onChange={(event) => setPhone(event.target.value)}
						required
					/>
				</div>
				{errors?.phone && (
					<p style={{ color: "red" }} className="errors">
						{errors.phone}
					</p>
				)}
				<div className="col-12 col-md-6">
					<label className="text-sm fw-normal font-Inter leading-tight mb-3 d-block">
						Subject
					</label>
					<input
						id="Subject"
						type="text"
						placeholder="Subject"
						name="subject"
						value={subject}
						onChange={(event) => setSubject(event.target.value)}
						required
					/>
				</div>
				{errors?.subject && (
					<p style={{ color: "red" }} className="errors">
						{errors.subject}
					</p>
				)}
				<div className="col-12">
					<label className="text-sm fw-normal font-Inter leading-tight mb-3 d-block">
						Message
					</label>
					<textarea
						name="message"
						id="Message"
						cols="30"
						rows="10"
						placeholder="Type your message"
						value={message}
						onChange={(event) => setMessage(event.target.value)}
						required
					></textarea>
				</div>
				{errors?.message && (
					<p style={{ color: "red" }} className="errors">
						{errors.message}
					</p>
				)}
				<div className="col-12">
					<button
						id="create-group-submit"
						type="submit"
						name="intent"
						value="create-partnership"
					>
						Submit
					</button>
					<Link to="/profile">
						<button id="update-group-cancel">Cancel</button>
					</Link>
				</div>
			</Form>
		</div>
	);
};

export default Partnership;
