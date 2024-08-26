import { useLoaderData } from "react-router-dom";
import "./Groups.css";

const Groups = () => {
	const {allGroups} = useLoaderData();
	console.log("this is groups", allGroups);
};

export default Groups;
