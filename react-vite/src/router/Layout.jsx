import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
// import { ModalProvider, Modal } from "../context/Modal";
// import { Modal } from "../context/Modal";
import { ModalProvider } from "../context-TSX/Modal";
import { thunkAuthenticate } from "../redux/session";
import Navigation from "../components/Navigation/Navigation";
// import Footer from "../components/Footer";
import Footer from "../components/Footer-TSX";
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
				{isLoaded && <Outlet />}
				<Footer />
				{/* <Modal /> */}
			</ModalProvider>
		</>
	);
}
