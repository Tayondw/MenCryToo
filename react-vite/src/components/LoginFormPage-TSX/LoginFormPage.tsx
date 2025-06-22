import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, LogIn, User, Shield } from "lucide-react";
import { thunkLogin } from "../../store/session";
import { RootState, AppDispatch } from "../../types";

interface LoginErrors {
	email?: string;
	password?: string;
	server?: string;
}

const LoginFormPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const sessionUser = useSelector((state: RootState) => state.session.user);

	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [errors, setErrors] = useState<LoginErrors>({});
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const isDisabled = email.length < 4 || password.length < 6;

	if (sessionUser) return <Navigate to="/" replace={true} />;

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
				navigate("/");
			}
		} catch {
			setErrors({ server: "Something went wrong. Please try again." });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
			{/* Back Button */}
			<Link
				to="/"
				className="fixed top-8 left-8 z-20 inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-slate-600 hover:text-slate-900 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
			>
				<ArrowLeft size={20} />
				Back to Home
			</Link>

			<div className="grid lg:grid-cols-2 min-h-screen">
				{/* Left Side - Hero Image and Content */}
				<div
					className="relative flex flex-col bg-slate-800 text-white overflow-hidden lg:sticky lg:top-0 lg:h-screen"
					style={{
						backgroundImage:
							'url("https://mencrytoo.s3.amazonaws.com/login-1.png")',
						backgroundSize: "cover",
						backgroundPosition: "center",
						backgroundRepeat: "no-repeat",
					}}
				>
					{/* Overlay for better text readability */}
					<div className="absolute inset-0 bg-slate-900/70"></div>

					{/* Content */}
					<div className="relative z-10 flex flex-col justify-center items-center text-center p-8 lg:p-12 min-h-full">
						<div className="max-w-lg space-y-6">
							<div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
								<Shield size={32} className="text-white" />
							</div>

							<h1 className="text-4xl lg:text-5xl font-bold text-orange-400 drop-shadow-lg">
								Welcome Back
							</h1>
							<p className="text-xl lg:text-2xl font-semibold text-slate-200">
								Continue Your Journey
							</p>
							<p className="text-lg text-slate-300 leading-relaxed">
								Log in to access your account and continue connecting with our
								supportive community focused on mental health and wellness.
							</p>

							{/* Feature highlights */}
							<div className="space-y-3 text-left max-w-sm mx-auto">
								<div className="flex items-center gap-3">
									<div className="w-2 h-2 bg-orange-400 rounded-full"></div>
									<span className="text-slate-200">
										Access your personal dashboard
									</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="w-2 h-2 bg-orange-400 rounded-full"></div>
									<span className="text-slate-200">
										Connect with your support groups
									</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="w-2 h-2 bg-orange-400 rounded-full"></div>
									<span className="text-slate-200">
										Continue your healing journey
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Right Side - Login Form */}
				<div className="bg-white overflow-y-auto flex items-center justify-center p-4 lg:p-8">
					<div className="w-full max-w-md">
						<div className="text-center mb-8">
							<div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
								<LogIn size={24} className="text-white" />
							</div>
							<h2 className="text-3xl font-bold text-slate-900 mb-2">
								Log In
							</h2>
							<p className="text-slate-600">
								Enter your credentials to access your account
							</p>
						</div>

						{/* Server Error */}
						{errors.server && (
							<div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center font-medium">
								{errors.server}
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-6">
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
									<p className="text-red-600 text-sm font-medium">
										{errors.email}
									</p>
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
							<div className="space-y-4">
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
										"Log In"
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
						<div className="mt-8 text-center">
							<p className="text-slate-600">
								Don't have an account?{" "}
								<Link
									to="/signup"
									className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
								>
									Sign up here
								</Link>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginFormPage;
