import { Link, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const Home = () => {
	const sessionUser = useSelector((state) => state.session.user);

	return (
		<div id="home-page">
			
		</div>
	);
};

export default Home;
