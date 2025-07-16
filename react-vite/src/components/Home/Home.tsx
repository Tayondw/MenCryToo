import React from "react";
import { useLoaderData } from "react-router-dom";
import AuthHome from "./AuthHome";
import NotAuthHome from "./NotAuthHome";
import { HomeLoaderData } from "../../types";

const Home: React.FC = () => {
	const { user } = useLoaderData() as HomeLoaderData;

	return (
		<div className="min-h-screen">{user ? <AuthHome /> : <NotAuthHome />}</div>
	);
};

export default Home;
