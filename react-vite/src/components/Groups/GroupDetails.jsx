import { useLoaderData } from "react-router-dom";

const GroupDetails = () => {
	const groupDetails = useLoaderData();

	console.log("group details", groupDetails);
};

export default GroupDetails;
