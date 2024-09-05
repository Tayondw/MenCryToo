import { useSelector } from "react-redux";
import AuthHome from "./AuthHome";
import NotAuthHome from "./NotAuthHome/NotAuthHome";
// import ProfileHome from "./ProfileHome/ProfileHome";

const Home = () => {
	const sessionUser = useSelector((state) => state.session.user);

	let mainContent;

	if (!sessionUser) mainContent = <NotAuthHome />;
	if (sessionUser) mainContent = <AuthHome />;
	// if (sessionUser && !sessionUser.profileImage) mainContent = <AuthHome />;
	// if (sessionUser && sessionUser.profileImage) mainContent = <ProfileHome />;

	return <>{mainContent}</>;
};

export default Home;
