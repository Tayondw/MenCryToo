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
		<div id="new-group">
			<img
				src="https://mencrytoo.s3.amazonaws.com/MENCRYTOO4.jpg"
				alt="partnership"
				id="fit-image-content"
			/>
			<Form
				id="contact-form"
				action="/partnership"
				method="post"
				// type="file"
				encType="multipart/form-data"
                        className="create-group-form"
                        style={{paddingTop: `25px`}}
			>
				<div id="header">
					<h3 style={{paddingBottom: `15px`}}>BECOME A PARTNER</h3>
					<p>
						Men Cry Too is an member-based, ready-made program for organizations
						and communities that want to promote mental health and reduce
						suicide among men. Our licensing model and partnership network help
						us expand Men Cry Too&apos;s reach and impact through a proven
						solution that connects men with lifesaving tools and resources.
						Learn how you can join our thriving network and put this innovative,
						prevention campaign to work in your community.
					</p>
					<hr />
				</div>
				<div id="section-0-create">
					<div id="set-first-name">
						<h3 style={{ fontSize: `15px` }}>First Name</h3>
						<div id="first-name-input">
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
					</div>
					{errors?.firstName && (
						<p style={{ color: "red" }} className="errors">
							{errors.firstName}
						</p>
					)}
					<div id="set-last-name">
						<h3 style={{ fontSize: `15px` }}>Last Name</h3>
						<div id="state-input">
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
					</div>
					{errors?.lastName && (
						<p style={{ color: "red" }} className="errors">
							{errors.lastName}
						</p>
					)}
					<div id="set-email">
						<h3 style={{ fontSize: `15px` }}>Email</h3>
						<div id="email-input">
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
					</div>
					{errors?.email && (
						<p style={{ color: "red" }} className="errors">
							{errors.email}
						</p>
					)}
					<div id="set-username">
						<h3 style={{ fontSize: `15px` }}>Phone</h3>
						<div id="username-input">
							<input
								id="username-input-text"
								type="text"
								placeholder="Phone Number"
								name="phone"
								value={phone}
								onChange={(event) => setPhone(event.target.value)}
								required
							/>
						</div>
					</div>
					{errors?.phone && (
						<p style={{ color: "red" }} className="errors">
							{errors.phone}
						</p>
					)}
				</div>
				<hr />
				<div id="section-2-create">
					<div id="set-name">
						<h3 style={{ fontSize: `15px` }}>Specify who you are</h3>
						<div className="caption">
							<p>
								Are you an individual or a professional?
								<br />
								If professional, specify which organization (i.e Non-Profit,
								Government, Privately Licensed Professional, Industry Specific
								Organization)
							</p>
						</div>
						<div id="name-input">
							<input
								id="name-input-text"
								type="text"
								placeholder="Individual or Professional?"
								name="subject"
								value={subject}
								onChange={(event) => setSubject(event.target.value)}
								required
							/>
						</div>
					</div>
					{errors?.subject && (
						<p style={{ color: "red" }} className="errors">
							{errors.subject}
						</p>
					)}
				</div>
				<hr />
				<div id="section-3-create">
					<div id="set-description">
						<h3 style={{ fontSize: `15px`, paddingBottom: `10px` }}>
							Describe your journey to here
						</h3>
						<div id="description-input">
							<textarea
								name="message"
								id="partner-name-textarea"
								cols="80"
								rows="5"
								placeholder="Type your message"
								value={message}
                                                onChange={(event) => setMessage(event.target.value)}
                                                style={{border: `2px solid black`, boxSizing: `border-box`, maxWidth: `fit-content`, maxHeight: `fit-content`}}
								required
							></textarea>
						</div>
					</div>
					{errors?.message && (
						<p style={{ color: "red" }} className="errors">
							{errors.message}
						</p>
					)}
				</div>
				<hr />
				<div id="section-5-create">
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
