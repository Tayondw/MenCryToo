import { createBrowserRouter } from "react-router-dom";
import LoginFormPage from "../components/LoginFormPage";
import SignupFormPage from "../components/SignupFormPage";
import Groups from "../components/Groups";
import { getLoader } from "./loaders";
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
				path: "posts",
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
