import React from "react";

const PageLoader: React.FC = () => (
	<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
		<div className="text-center p-8">
			<div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
			<p className="text-slate-600">Loading...</p>
		</div>
	</div>
);

export default PageLoader;
