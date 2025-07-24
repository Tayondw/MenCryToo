import { useState, useEffect } from "react";
import { useNavigation, useLocation } from "react-router-dom";

export const useNavigationLoading = () => {
	const navigation = useNavigation();
	const location = useLocation();
	const [isNavigating, setIsNavigating] = useState(false);
	const [showLoader, setShowLoader] = useState(false);

	useEffect(() => {
		// Track navigation state changes
		const isLoadingOrSubmitting =
			navigation.state === "loading" || navigation.state === "submitting";

		if (isLoadingOrSubmitting && !isNavigating) {
			setIsNavigating(true);
			// Show loader after a small delay to avoid flash for fast navigations
			const timer = setTimeout(() => {
				setShowLoader(true);
			}, 100);

			return () => clearTimeout(timer);
		} else if (!isLoadingOrSubmitting && isNavigating) {
			setIsNavigating(false);
			setShowLoader(false);
		}
	}, [navigation.state, isNavigating]);

	// Reset loading state on location change
	useEffect(() => {
		setIsNavigating(false);
		setShowLoader(false);
	}, [location.pathname]);

	return {
		isNavigating: navigation.state !== "idle",
		showLoader,
		navigationState: navigation.state,
	};
};
