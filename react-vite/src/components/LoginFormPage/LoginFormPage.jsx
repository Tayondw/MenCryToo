import { useState } from "react";
import { thunkLogin } from "../../redux/session";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import "./LoginForm.css";

function LoginFormPage() {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const sessionUser = useSelector((state) => state.session.user);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState({});
	const isDisabled = email.length < 4 || password.length < 6;

	if (sessionUser) return <Navigate to="/" replace={true} />;

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
			navigate("/");
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
			navigate("/");
		}
	};

	return (
		<div id="new-group">
			<img
				src="https://mencrytoo.s3.amazonaws.com/login-1.png"
				alt="login-image"
				id="fit-image-content"
			/>

			{errors.length > 0 &&
				errors.map((message) => <p key={message}>{message}</p>)}
			<form className="create-group-form" onSubmit={handleSubmit} id="form-login">
				<div id="header-login">
					<h3>Log In</h3>
					<hr />
				</div>
				<div id="login">
					<div id="login-email">
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
					</div>
					<div id="login-password">
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
						{errors.password && (
							<p style={{ color: `red` }}>{errors.password}</p>
						)}
					</div>
				</div>
                        <hr />
				<button
					type="submit"
					className="login-button"
					disabled={isDisabled}
					style={{ cursor: isDisabled ? "not-allowed" : "pointer", marginRight: `15px` }}
				>
					Log In
				</button>
				<button
					type="submit"
					className="demo-login-button"
                              onClick={demoUserLogin}
                              style={{width: `fit-content`}}
				>
					Log in as Demo User
				</button>
			</form>
		</div>
	);
}

export default LoginFormPage;
