import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, X, LogIn, User } from "lucide-react";
import { thunkLogin } from "../../store/session";
import { AppDispatch } from "../../types";
import { useModal } from "../../context-TSX/Modal";

interface LoginFormModalProps {
	navigate?: (path: string) => void;
	onClose?: () => void;
}

interface LoginErrors {
	email?: string;
	password?: string;
	server?: string;
}

const LoginFormModal: React.FC<LoginFormModalProps> = ({
	navigate: propNavigate,
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const routerNavigate = useNavigate();
	const { closeModal } = useModal();

	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [errors, setErrors] = useState<LoginErrors>({});
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const isDisabled = email.length < 4 || password.length < 6;

	// Use the navigate function passed as prop, or fall back to router navigate
	const navigate = propNavigate || routerNavigate;

	const handleClose = () => {
		closeModal();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setErrors({});

		try {
			const serverResponse = (await dispatch(
				thunkLogin({
					email,
					password,
				}),
			)) as LoginErrors | void;

			if (serverResponse) {
				setErrors(serverResponse);
			} else {
				// Successfully logged in - close modal and navigate
				handleClose();
				navigate("/");
			}
		} catch {
			setErrors({ server: "Something went wrong. Please try again." });
		} finally {
			setIsLoading(false);
		}
	};

	const demoUserLogin = async (event: React.MouseEvent) => {
		event.preventDefault();
		setIsLoading(true);
		setErrors({});

		try {
			const demoServerResponse = (await dispatch(
				thunkLogin({
					email: "demo@aa.io",
					password: "password",
				}),
			)) as LoginErrors | void;

			if (demoServerResponse) {
				setErrors(demoServerResponse);
			} else {
				// Successfully logged in - close modal and navigate
				handleClose();
				navigate("/");
			}
		} catch {
			setErrors({ server: "Something went wrong. Please try again." });
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignUpClick = () => {
		handleClose();
		navigate("/signup");
	};

	// Close modal when clicking the back button
	useEffect(() => {
		const handlePopState = () => {
			handleClose();
		};

		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);

	return (
		<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95 mx-4">
			{/* Header */}
			<div className="flex items-center justify-between p-6 border-b border-slate-200">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
						<LogIn size={20} className="text-white" />
					</div>
					<h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
				</div>
				<button
					onClick={handleClose}
					className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
				>
					<X size={20} className="text-slate-500" />
				</button>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="p-6 space-y-6">
				{/* Server Error */}
				{errors.server && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
						{errors.server}
					</div>
				)}

				{/* Email Field */}
				<div className="space-y-2">
					<label
						htmlFor="email"
						className="block text-sm font-semibold text-slate-700"
					>
						Email Address
					</label>
					<input
						id="email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Enter your email"
						className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
							errors.email
								? "border-red-300 focus:border-red-500 focus:ring-red-200"
								: "border-slate-200 focus:border-orange-400 focus:ring-orange-100"
						} focus:outline-none focus:ring-4`}
						required
					/>
					{errors.email && (
						<p className="text-red-600 text-sm font-medium">{errors.email}</p>
					)}
				</div>

				{/* Password Field */}
				<div className="space-y-2">
					<label
						htmlFor="password"
						className="block text-sm font-semibold text-slate-700"
					>
						Password
					</label>
					<div className="relative">
						<input
							id="password"
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter your password"
							className={`w-full px-4 py-3 pr-12 border-2 rounded-xl transition-all duration-200 ${
								errors.password
									? "border-red-300 focus:border-red-500 focus:ring-red-200"
									: "border-slate-200 focus:border-orange-400 focus:ring-orange-100"
							} focus:outline-none focus:ring-4`}
							required
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
						>
							{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
						</button>
					</div>
					{errors.password && (
						<p className="text-red-600 text-sm font-medium">
							{errors.password}
						</p>
					)}
				</div>

				{/* Buttons */}
				<div className="space-y-3">
					<button
						type="submit"
						disabled={isDisabled || isLoading}
						className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 ${
							isDisabled || isLoading
								? "bg-slate-300 cursor-not-allowed"
								: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
						}`}
					>
						{isLoading ? (
							<div className="flex items-center justify-center gap-2">
								<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								Signing In...
							</div>
						) : (
							"Sign In"
						)}
					</button>

					<button
						type="button"
						onClick={demoUserLogin}
						disabled={isLoading}
						className="w-full py-3 px-4 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						<User size={18} />
						Try Demo Account
					</button>
				</div>
			</form>

			{/* Footer */}
			<div className="px-6 pb-6 text-center">
				<p className="text-sm text-slate-600">
					Don't have an account?{" "}
					<button
						onClick={handleSignUpClick}
						className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
					>
						Sign up here
					</button>
				</p>
			</div>
		</div>
	);
};

export default LoginFormModal;
