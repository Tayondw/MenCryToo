import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Home, ArrowLeft } from "lucide-react";

const Success: React.FC = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center p-4">
			<div className="max-w-3xl w-full">
				<div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
					{/* Header with gradient */}
					<div className="bg-gradient-to-r from-orange-500 to-slate-600 p-8 text-white text-center">
						<div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
							<CheckCircle size={40} className="text-white" />
						</div>
						<h1 className="text-3xl md:text-4xl font-bold mb-4">Thank You!</h1>
						<p className="text-lg text-white/90 max-w-xl mx-auto">
							Your partnership application has been successfully submitted.
						</p>
					</div>

					{/* Content */}
					<div className="p-8 md:p-12">
						<div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
							<h2 className="text-xl font-semibold text-green-800 mb-3 flex items-center gap-2">
								<CheckCircle size={20} className="text-green-600" />
								Application Received
							</h2>
							<p className="text-green-700 mb-4">
								We appreciate you contacting us about becoming a partner. One of
								our team members will get back to you soon!
							</p>
							<p className="text-green-700 text-sm">
								Please allow 1-2 business days for a response.
							</p>
						</div>

						<div className="space-y-6">
							<div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
								<h3 className="font-semibold text-slate-900 mb-3">
									What happens next?
								</h3>
								<ol className="space-y-3 text-slate-700">
									<li className="flex items-start gap-3">
										<div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
											<span className="text-orange-600 font-medium text-sm">
												1
											</span>
										</div>
										<p>Our partnership team will review your application</p>
									</li>
									<li className="flex items-start gap-3">
										<div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
											<span className="text-orange-600 font-medium text-sm">
												2
											</span>
										</div>
										<p>We'll reach out to schedule an initial consultation</p>
									</li>
									<li className="flex items-start gap-3">
										<div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
											<span className="text-orange-600 font-medium text-sm">
												3
											</span>
										</div>
										<p>Together we'll develop a customized partnership plan</p>
									</li>
								</ol>
							</div>

							<div className="flex flex-col sm:flex-row gap-4">
								<Link
									to="/"
									className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg text-center font-medium flex items-center justify-center gap-2"
								>
									<Home size={18} />
									Return Home
								</Link>
								<Link
									to="/groups"
									className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 text-center font-medium flex items-center justify-center gap-2"
								>
									<ArrowLeft size={18} />
									Explore Groups
								</Link>
							</div>
						</div>
					</div>

					{/* Footer */}
					{/* <div className="bg-slate-50 p-6 border-t border-slate-200 text-center">
						<p className="text-slate-600 text-sm">
							Have questions? Contact us at{" "}
							<a
								href="mailto:support@mencrytoo.org"
								className="text-orange-600 hover:text-orange-700 font-medium"
							>
								support@mencrytoo.org
							</a>
						</p>
						<div className="flex items-center justify-center gap-6 mt-4">
							<a
								href="#"
								className="text-slate-500 hover:text-orange-600 transition-colors"
							>
								<ExternalLink size={18} />
							</a>
							<a
								href="#"
								className="text-slate-500 hover:text-orange-600 transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
								</svg>
							</a>
							<a
								href="#"
								className="text-slate-500 hover:text-orange-600 transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
								</svg>
							</a>
						</div>
					</div> */}
				</div>
			</div>
		</div>
	);
};

export default Success;
