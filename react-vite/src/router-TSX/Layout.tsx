import { useEffect, useState, memo } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ModalProvider } from "../context/Modal";
import { thunkAuthenticate } from "../store/session";
import Navigation from "../components/Navigation/Navigation";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
import { AppDispatch } from "../types";

// OPTIMIZED: Memoized Layout component
const Layout = memo(() => {
	const dispatch = useDispatch<AppDispatch>();
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		// OPTIMIZED: Single authentication check with faster loading
		const authenticateUser = async () => {
			try {
				await dispatch(thunkAuthenticate());
			} catch (error) {
				console.error("Authentication failed:", error);
			} finally {
				setIsLoaded(true);
			}
		};

		authenticateUser();
	}, [dispatch]);

	// OPTIMIZED: Show minimal loading state
	if (!isLoaded) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-slate-600 text-sm">Loading application...</p>
				</div>
			</div>
		);
	}

	return (
		<ModalProvider>
			<Navigation />
			<ScrollToTop />
			<div className="relative overflow-hidden">
				<main className="relative">
					<Outlet />
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
