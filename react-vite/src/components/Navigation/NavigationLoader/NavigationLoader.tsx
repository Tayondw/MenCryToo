import React from "react";
import { useNavigationLoading } from "../../../hooks";
import PageLoader from "../../PageLoader";

const NavigationLoader: React.FC = () => {
	const { showLoader } = useNavigationLoading();

	if (!showLoader) return null;

	return (
		<div className="fixed inset-0 z-[60]">
			<PageLoader />
		</div>
	);
};

export default NavigationLoader;
