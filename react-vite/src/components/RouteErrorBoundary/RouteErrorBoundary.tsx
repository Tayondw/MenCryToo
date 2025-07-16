import React from "react";
import { useRouteError, Link } from "react-router-dom";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { RouteError } from "../../types";

export const RouteErrorBoundary: React.FC = () => {
	const error = useRouteError() as RouteError;

	console.error("Route error:", error);

	// Enhanced type guard for error.data
	const getErrorData = () => {
		if (error.data && typeof error.data === "object" && error.data !== null) {
			// Type assertion with additional safety checks
			const data = error.data as Record<string, unknown>;

			// Log for debugging
			// console.log("Error data:", data);

			// You can safely access properties now
			if ("errors" in data && typeof data.errors === "object") {
				console.log("API errors:", data.errors);
			}

			return data;
		}
		return null;
	};

	// Call the type guard function
	const errorData = getErrorData();

	// Handle different types of errors
	const getErrorInfo = () => {
		if (!error) {
			return {
				title: "Unknown Error",
				message: "Something went wrong.",
				status: 500,
			};
		}

		if (error.status === 404) {
			return {
				title: "Page Not Found",
				message: "The page you're looking for doesn't exist.",
				status: 404,
			};
		}

		if (error.status === 403) {
			return {
				title: "Access Denied",
				message: "You don't have permission to access this page.",
				status: 403,
			};
		}

		if (error.status === 401) {
			return {
				title: "Authentication Required",
				message: "Please log in to access this page.",
				status: 401,
			};
		}

		// Try to extract more specific error message from errorData
		let errorMessage =
			error.message || error.statusText || "An unexpected error occurred.";

		if (errorData && "errors" in errorData) {
			const errors = errorData.errors as Record<string, unknown>;
			if (
				typeof errors === "object" &&
				errors !== null &&
				"message" in errors
			) {
				errorMessage = String(errors.message);
			}
		}

		return {
			title: "Something Went Wrong",
			message: errorMessage,
			status: error.status || 500,
		};
	};

	const { title, message, status } = getErrorInfo();

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
				<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<AlertTriangle size={32} className="text-red-600" />
				</div>

				<h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>

				<p className="text-slate-600 mb-6">{message}</p>

				<div className="text-sm text-slate-500 mb-6">Error Code: {status}</div>

				<div className="flex flex-col sm:flex-row gap-3">
					<button
						onClick={() => window.history.back()}
						className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
					>
						<ArrowLeft size={16} />
						Go Back
					</button>

					<Link
						to="/"
						className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
					>
						<Home size={16} />
						Home
					</Link>
				</div>

				{/* Debug info in development */}
				{process.env.NODE_ENV === "development" && (
					<details className="mt-6 text-left">
						<summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700">
							Debug Information
						</summary>
						<pre className="mt-2 p-3 bg-slate-100 rounded text-xs overflow-auto">
							{JSON.stringify(error, null, 2)}
						</pre>
					</details>
				)}
			</div>
		</div>
	);
};
