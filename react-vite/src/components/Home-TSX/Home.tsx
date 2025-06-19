import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../types";
import AuthHome from "./AuthHome/AuthHome";
import NotAuthHome from "./NotAuthHome/NotAuthHome";

const Home: React.FC = () => {
	const sessionUser = useSelector((state: RootState) => state.session.user);

	return (
		<div className="min-h-screen">
			{sessionUser ? <AuthHome /> : <NotAuthHome />}
		</div>
	);
};

export default Home;
