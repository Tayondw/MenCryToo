import React from "react";
import { useLoaderData } from "react-router-dom";
import AuthHome from "./AuthHome";
import NotAuthHome from "./NotAuthHome";
import { User, Group, Event, Tag } from "../../types";

interface HomeLoaderData {
	allGroups: Group[];
	allEvents: Event[];
	allTags: Tag[];
	user: User | null;
	error?: string;
}

const Home: React.FC = () => {
	const { user } = useLoaderData() as HomeLoaderData;

	return (
		<div className="min-h-screen">{user ? <AuthHome /> : <NotAuthHome />}</div>
	);
};

export default Home;
