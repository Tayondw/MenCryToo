import { useEffect, useState, memo } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ModalProvider } from "../context/Modal";
import { thunkAuthenticate } from "../store/session";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
import NavigationLoader from "../components/Navigation/NavigationLoader";
import PageLoader from "../components/PageLoader";
import { AppDispatch } from "../types";

// Memoized Layout component
const Layout = memo(({ children }: { children?: React.ReactNode }) => {
	const dispatch = useDispatch<AppDispatch>();
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		// Single authentication check with faster loading
		const authenticateUser = async () => {
			try {
				await dispatch(thunkAuthenticate());
			} catch (error) {
				console.error("Authentication failed:", error);
			} finally {
				// Add small delay to prevent loading flash
				setTimeout(() => {
					setIsLoaded(true);
				}, 500);
			}
		};

		authenticateUser();
	}, [dispatch]);

	// Show minimal loading state
	if (!isLoaded) {
		return <PageLoader message="Initializing application..." />;
	}

	return (
		<ModalProvider>
			<Navigation />
			<NavigationLoader /> {/* route transition loading */}
			<ScrollToTop />
			<div className="relative overflow-hidden">
				<main className="relative">
					{/* Support both children prop (for 404) and Outlet (for normal routes) */}
					{children ? children : <Outlet />}
				</main>
				{/* Force boundary */}
				<div className="clear-both h-0"></div>
				<div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-blue-500 to-purple-500"></div>
			</div>
			<Footer />
		</ModalProvider>
	);
});

Layout.displayName = "Layout";

export default Layout;
