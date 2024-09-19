import { useState, useEffect } from "react";
import { thunkLogin } from "../../redux/session";
import { useDispatch } from "react-redux";
import { useModal } from "../../context/Modal";
import "./LoginForm.css";

function LoginFormModal() {
	const dispatch = useDispatch();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState({});
	const { closeModal } = useModal();

	const isDisabled = email.length < 4 || password.length < 6;

	const handleSubmit = async (e) => {
		e.preventDefault();

		const serverResponse = await dispatch(
			thunkLogin({
				email,
				password,
			}),
		);

		if (serverResponse) {
			setErrors(serverResponse);
		} else {
			closeModal();
		}
	};

	const demoUserLogin = async (event) => {
		event.preventDefault();

		const demoServerResponse = await dispatch(
			thunkLogin({
				email: "demo@aa.io",
				password: "password",
			}),
		);

		if (demoServerResponse) {
			setErrors(demoServerResponse);
		} else {
			closeModal();
		}
	};

	// Close modal when clicking the back button
	useEffect(() => {
		const handlePopState = () => {
			closeModal();
		};

		window.addEventListener("popstate", handlePopState);

		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [closeModal]);

	// Close modal when clicking outside of the modal content
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (event.target.classList.contains("body")) {
				closeModal();
			}
		};

		document.addEventListener("click", handleClickOutside);

		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, [closeModal]);

	return (
		<div className="body">
			<div className="login">
				<form className="form" onSubmit={handleSubmit}>
					<h1>Log In</h1>
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
					{errors.email && <p style={{ color: `red` }}>{errors.email}</p>}
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
					{errors.password && <p style={{ color: `red` }}>{errors.password}</p>}
					<button
						className="login-button"
						disabled={isDisabled}
						style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
						type="submit"
					>
						Log In
					</button>
					<button
						type="submit"
						className="demo-login-button"
						onClick={demoUserLogin}
					>
						Log in as Demo User
					</button>
				</form>
			</div>
		</div>
	);
}

export default LoginFormModal;
