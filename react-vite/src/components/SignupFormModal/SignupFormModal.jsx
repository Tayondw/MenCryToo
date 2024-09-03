import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useModal } from "../../context/Modal";
import { thunkSignup } from "../../redux/session";
import { thunkAuthenticate } from "../../redux/session";
import "./SignupForm.css";

function SignupFormModal() {
	const dispatch = useDispatch();
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errors, setErrors] = useState({});
      const { closeModal } = useModal();
      
      const isDisabled = username.length < 3 || password.length < 8;

	useEffect(() => {
		dispatch(thunkAuthenticate());
	}, [dispatch]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			return setErrors({
				confirmPassword:
					"Confirm Password field must be the same as the Password field",
			});
		}

		const error = {};
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (email.length > 50)
			error.email = "Email must be less than 50 characters";
		if (!emailRegex.test(email) || email.length <= 0)
			error.email = "Invalid email";
		if (username.length > 20)
			error.username =
				"Username too long! Come on, who ya tryna confuse? Yourself?";
		if (username.length < 3)
			error.username = "Username is too short! At least 3 characters man!";
		if (!username.length)
			error.username =
				"Now you know you need a username, I need 3 to 20 characters for you to signup!";
		if (password.length > 25) error.password = "Password is too long!";
		if (password.length < 8) error.password = "Password is too short!";
		if (password.length < 0) error.password = "Password is required";
		if (password !== confirmPassword)
			error.confirmPassword =
				"Confirm Password field must be the same as the Password field";
		if (Object.keys(error).length > 0) {
			console.log("EERR", error);
			return setErrors(error);
		}

		const serverResponse = await dispatch(
			thunkSignup({
				email,
				username,
				password,
			}),
		);

		if (serverResponse) {
			error.server = serverResponse.server;
			error.email = serverResponse.email;
			error.username = serverResponse.username;
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

			if (email.length > 50)
				error.email = "Email must be less than 50 characters";
			if (!emailRegex.test(email) || email.length <= 0)
				error.email = "Invalid email";
			if (username.length > 20)
				error.username =
					"Username too long! Come on, who ya tryna confuse? Yourself?";
			if (username.length < 3)
				error.username = "Username is too short! At least 3 characters man!";
			if (!username.length)
				error.username =
					"Now you know you need a username, I need 3 to 20 characters for you to signup!";
			if (password.length > 25) error.password = "Password is too long!";
			if (password.length < 8) error.password = "Password is too short!";
			if (password.length < 0) error.password = "Password is required";
			if (password !== confirmPassword)
				error.confirmPassword =
					"Confirm Password field must be the same as the Password field";
			return setErrors(error);
		} else {
			closeModal();
		}
	};

	return (
		<div className="signup-body">
			{errors.server && <p className="error">{errors.server}</p>}
			<div className="login">
				<form className="form-signup" onSubmit={handleSubmit}>
					<h1>Sign Up</h1>
					<label>
						Email
						<input
							type="text"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Email"
							required
						/>
					</label>
					{errors.email && <p className="error">{errors.email}</p>}
					<label>
						Username
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Username"
							required
						/>
					</label>
					{errors.username && <p className="error">{errors.username}</p>}
					<label>
						Password
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Password"
							required
						/>
					</label>
					{errors.password && <p className="error">{errors.password}</p>}
					<label>
						Confirm Password
						<input
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Confirm Password"
							required
						/>
					</label>
					{errors.confirmPassword && (
						<p className="error">{errors.confirmPassword}</p>
					)}
					<button
						className="signup"
						disabled={isDisabled}
						style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
						type="submit"
					>
						Sign Up
					</button>
				</form>
			</div>
		</div>
	);
}

export default SignupFormModal;
