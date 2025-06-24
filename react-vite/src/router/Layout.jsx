import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ModalProvider } from "../context/Modal";
import { thunkAuthenticate } from "../store/session";
import Navigation from "../components/Navigation/Navigation";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

export default function Layout() {
	const dispatch = useDispatch();
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		dispatch(thunkAuthenticate()).then(() => setIsLoaded(true));
	}, [dispatch]);

	return (
		<>
			<ModalProvider>
				<Navigation isLoaded={isLoaded} />
				<ScrollToTop />
				<div className="relative overflow-hidden">
					{isLoaded && <Outlet />}
					{/* Force boundary */}
					<div className="clear-both h-0"></div>
					<div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-blue-500 to-purple-500"></div>
				</div>
				<Footer />
			</ModalProvider>
		</>
	);
}
