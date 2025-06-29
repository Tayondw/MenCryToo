import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, Search, RefreshCw, Map } from "lucide-react";

const FourZeroFourPage: React.FC = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center p-4">
			<div className="max-w-3xl w-full">
				<div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
					{/* Header with gradient */}
					<div className="bg-gradient-to-r from-orange-500 to-slate-600 p-8 text-white text-center">
						<h1 className="text-7xl md:text-9xl font-bold mb-4 animate-pulse">
							404
						</h1>
						<p className="text-xl md:text-2xl text-white/90">Page Not Found</p>
					</div>

					{/* Content */}
					<div className="p-8 md:p-12">
						<div className="text-center mb-8">
							<p className="text-xl md:text-2xl font-semibold text-slate-800 mb-4">
								Not all those who wander are lost, but it seems you may have
								taken a wrong turn.
							</p>
							<p className="text-slate-600 max-w-xl mx-auto">
								The page you're looking for doesn't exist or has been moved to
								another URL.
							</p>
						</div>

						<div className="grid md:grid-cols-2 gap-6 mb-8">
							<div className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all duration-200">
								<div className="flex items-center gap-3 mb-3">
									<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
										<Search size={20} className="text-orange-600" />
									</div>
									<h3 className="font-semibold text-slate-800">
										Search Our Site
									</h3>
								</div>
								<p className="text-slate-600 mb-4">
									Try searching for what you're looking for using specific
									keywords.
								</p>
								<div className="relative">
									<input
										type="text"
										placeholder="Search..."
										className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
									/>
									<Search
										size={16}
										className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
									/>
								</div>
							</div>

							<div className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all duration-200">
								<div className="flex items-center gap-3 mb-3">
									<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
										<Map size={20} className="text-orange-600" />
									</div>
									<h3 className="font-semibold text-slate-800">
										Popular Destinations
									</h3>
								</div>
								<p className="text-slate-600 mb-4">
									Check out these frequently visited pages:
								</p>
								<ul className="space-y-2">
									<li>
										<Link
											to="/groups"
											className="text-orange-600 hover:text-orange-700 flex items-center gap-2"
										>
											<ArrowLeft size={14} />
											<span>Support Groups</span>
										</Link>
									</li>
									<li>
										<Link
											to="/events"
											className="text-orange-600 hover:text-orange-700 flex items-center gap-2"
										>
											<ArrowLeft size={14} />
											<span>Events</span>
										</Link>
									</li>
									<li>
										<Link
											to="/contact"
											className="text-orange-600 hover:text-orange-700 flex items-center gap-2"
										>
											<ArrowLeft size={14} />
											<span>Contact Us</span>
										</Link>
									</li>
								</ul>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								to="/"
								className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg text-center font-medium flex items-center justify-center gap-2 max-w-xs mx-auto"
							>
								<Home size={18} />
								Return Home
							</Link>
							<button
								onClick={() => window.history.back()}
								className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 text-center font-medium flex items-center justify-center gap-2 max-w-xs mx-auto"
							>
								<ArrowLeft size={18} />
								Go Back
							</button>
						</div>
					</div>

					{/* Footer */}
					<div className="bg-slate-50 p-6 border-t border-slate-200 text-center">
						<p className="text-slate-600 text-sm">
							If you believe this is an error, please{" "}
							<Link
								to="/contact"
								className="text-orange-600 hover:text-orange-700 font-medium"
							>
								contact us
							</Link>{" "}
							and we'll help you find what you're looking for.
						</p>
						<button
							onClick={() => window.location.reload()}
							className="mt-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-orange-600"
						>
							<RefreshCw size={14} />
							<span>Refresh the page</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FourZeroFourPage;
