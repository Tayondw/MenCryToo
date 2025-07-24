import React from "react";
import { useNavigation } from "react-router-dom";
import Logo from "../Navigation/Logo";
import { PageLoaderProps } from "../../types";

const PageLoader: React.FC<PageLoaderProps> = ({
	message,
	showLogo = true,
}) => {
	const navigation = useNavigation();

	// Get contextual loading message based on navigation state
	const getLoadingMessage = () => {
		if (message) return message;

		switch (navigation.state) {
			case "loading":
				return "Loading page...";
			case "submitting":
				return "Processing request...";
			default:
				return "Loading...";
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
			<div className="text-center p-8">
				{/* Logo with animation */}
				{showLogo && (
					<div className="mb-6">
						<Logo
							size="lg"
							className="mx-auto animate-pulse transform hover:scale-110 transition-transform duration-300"
						/>
						<h2 className="text-xl font-bold mt-2 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
							MEN CRY TOO
						</h2>
					</div>
				)}

				{/* Loading Spinner */}
				<div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>

				{/* Loading Text */}
				<p className="text-slate-600 font-medium mb-2 animate-pulse">
					{getLoadingMessage()}
				</p>
				<p className="text-slate-400 text-sm">Please wait a moment</p>

				{/* Animated Progress Dots */}
				<div className="flex justify-center space-x-1 mt-4">
					<div
						className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
						style={{ animationDelay: "0ms" }}
					></div>
					<div
						className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
						style={{ animationDelay: "150ms" }}
					></div>
					<div
						className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
						style={{ animationDelay: "300ms" }}
					></div>
				</div>

				{/* Progress Bar for long operations */}
				<div className="w-64 h-1 bg-slate-200 rounded-full mx-auto mt-6 overflow-hidden">
					<div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 animate-pulse rounded-full"></div>
				</div>
			</div>
		</div>
	);
};

export default PageLoader;