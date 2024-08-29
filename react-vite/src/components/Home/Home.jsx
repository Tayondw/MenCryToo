// import { Link, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import AuthHome from "./AuthHome";
import NotAuthHome from "./NotAuthHome";
import ProfileHome from "./ProfileHome/ProfileHome";
import Footer from "../Footer";

const Home = () => {
	const sessionUser = useSelector((state) => state.session.user);

	return (
            <div id="home-page">
                  {!sessionUser && <NotAuthHome />}
                  {sessionUser && <AuthHome />}
                  {sessionUser && sessionUser.profileImage && <ProfileHome />}
                  <Footer />
		</div>
	);
};

export default Home;
