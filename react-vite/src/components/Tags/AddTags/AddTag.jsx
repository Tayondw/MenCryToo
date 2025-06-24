import { useActionData, Form } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useModal } from "../../../hooks/useModal";
import "./AddTag.css";

const AddTag = () => {
	const errors = useActionData();
	const sessionUser = useSelector((state) => state.session.user);
	const [userTags, setUserTags] = useState(["ANGER"]);
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

	useEffect(() => {
		if (sessionUser) setUserTags(sessionUser.userTags || "");
	}, [sessionUser]);

	return (
		<div id="event-deleteMenu" style={{ gap: `20px` }}>
			<div id="event-close-confirm" style={{ width: `100%` }}>
				<button
					id="delete-close-button"
					onClick={onClose}
					style={{ marginLeft: `500px` }}
				>
					✖
				</button>
				<div id="confirm-delete">
					<h1 style={{ paddingBottom: `0px` }}>Add TAGS TO YOUR PROFILE</h1>
				</div>
			</div>
			<div id="delete-event">
				<Form
					method="delete"
					action="/profile"
					encType="multipart/form-data"
					onSubmit={closeModal}
					style={{
						display: `flex`,
						flexDirection: `column`,
						justifyContent: `center`,
						alignItems: `center`,
					}}
				>
					<div
						id="event-status"
						style={{
							display: `flex`,
							flexDirection: `column`,
							justifyContent: `center`,
							alignItems: `center`,
						}}
					>
						<h3 style={{ fontSize: `17px` }}>Select one or more tags to add</h3>
						<label
							style={{
								display: `flex`,
								flexDirection: `column`,
								justifyContent: `center`,
								alignItems: `center`,
							}}
						>
							<select
								name="userTags"
								style={{ width: `225px` }}
								id="tag-select"
								value={userTags}
								multiple={true}
								onChange={(event) => {
									const options = [...event.target.selectedOptions];
									const values = options.map((option) => option.value);
									setUserTags(values);
								}}
							>
								<option value="">(select one or more)</option>
								<option value="ANGER">ANGER</option>
								<option value="ANXIETY">ANXIETY</option>
								<option value="DEPRESSION">DEPRESSION</option>
								<option value="SUBSTANCE ABUSE">SUBSTANCE ABUSE</option>
								<option value="STRESS">STRESS</option>
								<option value="TRAUMA">TRAUMA</option>
								<option value="RELATIONSHIPS">RELATIONSHIPS</option>
								<option value="GRIEF">GRIEF</option>
								<option value="COMING OUT">COMING OUT</option>
								<option value="SUICIDAL THOUGHTS">SUICIDAL THOUGHTS</option>
							</select>
							<div
								style={{
									display: `flex`,
									flexWrap: `wrap`,
									flexDirection: `column`,
									width: `600px`,
									justifyContent: `center`,
									alignItems: `center`,
								}}
							>
								<h3 style={{ fontSize: `12px` }}>Your Current Tags</h3>
								<div style={{ display: `flex`, flexWrap: `wrap`, padding: 0 }}>
									{sessionUser?.usersTags?.map((tag) => (
										<div key={tag?.id} style={{ padding: 0 }}>
											<h5
												style={{
													display: `flex`,
													fontSize: `12px`,
													paddingLeft: `9px`,
													paddingRight: `9px`,
													margin: 0,
													flexDirection: `row`,
													width: `fit-content`,
												}}
											>
												{tag?.name}
											</h5>
										</div>
									))}
								</div>
							</div>
						</label>

						{errors?.userTags && (
							<p style={{ color: "red" }} className="errors">
								{errors.userTags}
							</p>
						)}
					</div>
					<hr style={{ width: `100%` }} />
					<div id="signup-section-6">
						<button
							id="create-group-submit"
							type="submit"
							name="intent"
							value="add-tags"
						>
							Add Tags
						</button>
						<button id="update-group-cancel" onClick={onClose}>
							Cancel
						</button>
						<input type="hidden" name="userId" value={sessionUser?.id} />
					</div>
				</Form>
			</div>
		</div>
	);
};

export default AddTag;
