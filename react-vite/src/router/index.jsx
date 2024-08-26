import { createBrowserRouter } from "react-router-dom";
import LoginFormPage from "../components/LoginFormPage";
import SignupFormPage from "../components/SignupFormPage";
import Groups from "../components/Groups";
import GroupDetails from "../components/Groups/GroupDetails";
import { getLoader, groupDetailsLoader, eventDetailsLoader, venueDetailsLoader, userDetailsLoader, postDetailsLoader } from "./loaders";
import Layout from "./Layout";

export const router = createBrowserRouter([
	{
		element: <Layout />,
		children: [
			{
				path: "/",
				element: <h1>Welcome!</h1>,
			},
			{
				path: "login",
				element: <LoginFormPage />,
			},
			{
				path: "signup",
				element: <SignupFormPage />,
			},
			// ! GROUPS
			{
				path: "groups",
				loader: getLoader,
				element: <Groups />,
			},
			{
				path: "groups/:groupId",
				loader: groupDetailsLoader,
				element: <GroupDetails />,
			},
			{
				path: "groups/new",
				loader: getLoader,
				element: <Groups />,
			},
			{
				path: "groups/groupId/edit",
				loader: getLoader,
				element: <Groups />,
			},
			{
				path: "groups/groupId/delete",
				loader: getLoader,
				element: <Groups />,
			},
			// ! GROUP - IMAGES
			{
				path: "groups/groupId/images",
				loader: getLoader,
				element: <Groups />,
			},
			{
				path: "groups/groupId/images/:imageId/edit",
				loader: getLoader,
				element: <Groups />,
			},
			// ! VENUES
			{
				path: "venues",
				element: <SignupFormPage />,
			},
			{
                        path: "venues/:venueId",
                        loader: venueDetailsLoader,
				element: <SignupFormPage />,
			},
			{
				path: "groups/groupId/venues",
				loader: getLoader,
				element: <Groups />,
			},
			// ! GROUP - MEMBERSHIPS
			{
				path: "groups/groupId/join-group",
				loader: getLoader,
				element: <Groups />,
			},
			{
				path: "groups/groupId/leave-group/:memberId",
				loader: getLoader,
				element: <Groups />,
			},
			// ! EVENTS
			{
				path: "events",
				element: <SignupFormPage />,
			},
			{
                        path: "events/:eventId",
                        loader: eventDetailsLoader,
				element: <SignupFormPage />,
			},
			{
				path: "groups/groupId/events",
				loader: getLoader,
				element: <Groups />,
			},
			{
				path: "groups/groupId/events/:eventId",
				loader: getLoader,
				element: <Groups />,
			},
			// ! PROFILE
			{
				path: "profile",
				element: <SignupFormPage />,
			},
			{
				path: "users/:userId",
				loader: userDetailsLoader,
				element: <SignupFormPage />,
			},
			{
				path: "posts",
				element: <SignupFormPage />,
			},
			{
                        path: "posts/:postId",
                        loader: postDetailsLoader,
				element: <SignupFormPage />,
			},
			{
				path: "comments",
				element: <SignupFormPage />,
			},
			{
				path: "tags",
				element: <SignupFormPage />,
			},
		],
	},
]);
