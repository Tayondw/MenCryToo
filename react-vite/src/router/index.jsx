import { createBrowserRouter } from "react-router-dom";
import LoginFormPage from "../components/LoginFormPage";
import SignupFormPage from "../components/SignupFormPage";
// import Home from "../components/Home";
import NotAuthHome from "../components/Home/NotAuthHome";
import Groups from "../components/Groups";
import GroupDetails from "../components/Groups/GroupDetails";
import {
	getLoader,
	groupDetailsLoader,
	eventDetailsLoader,
	venueDetailsLoader,
	userDetailsLoader,
	postDetailsLoader,
      tagDetailsLoader,
} from "./loaders";
import {
	groupActions,
	groupImageActions,
	eventActions,
	eventImageActions,
	groupMemberActions,
	eventAttendeeActions,
	venueActions,
	profileActions,
	postActions,
} from "./actions";
import Layout from "./Layout";

export const router = createBrowserRouter([
	{
		element: <Layout />,
		loader: getLoader,
		children: [
			{
				path: "/",
				loader: getLoader,
				element: <NotAuthHome />,
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
				action: groupActions,
			},
			{
				path: "groups/new",
				loader: getLoader,
				element: <Groups />,
				action: groupActions,
			},
			{
				path: "groups/groupId/edit",
				loader: getLoader,
				element: <Groups />,
				action: groupActions,
			},
			{
				path: "groups/groupId/delete",
				loader: getLoader,
				element: <Groups />,
				action: groupActions,
			},
			// ! GROUP - IMAGES
			{
				path: "groups/groupId/images",
				loader: getLoader,
				element: <Groups />,
				action: groupImageActions,
			},
			{
				path: "groups/groupId/images/:imageId/edit",
				loader: getLoader,
				element: <Groups />,
				action: groupImageActions,
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
				action: venueActions,
			},
			{
				path: "groups/:groupId/venues",
				loader: getLoader,
				element: <Groups />,
				action: venueActions,
			},
			// ! GROUP - MEMBERSHIPS
			{
				path: "groups/groupId/join-group",
				loader: getLoader,
				element: <Groups />,
				action: groupMemberActions,
			},
			{
				path: "groups/groupId/leave-group/:memberId",
				loader: getLoader,
				element: <Groups />,
				action: groupMemberActions,
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
				action: eventActions,
			},
			{
				path: "groups/groupId/events",
				loader: getLoader,
				element: <Groups />,
				action: eventActions,
			},
			{
				path: "groups/groupId/events/:eventId",
				loader: getLoader,
				element: <Groups />,
				action: eventActions,
			},
			// ! EVENT - IMAGES
			{
				path: "events/:eventId/images",
				loader: eventDetailsLoader,
				element: <SignupFormPage />,
				action: eventImageActions,
			},
			{
				path: "events/:eventId/images/:imageId/edit",
				loader: eventDetailsLoader,
				element: <SignupFormPage />,
				action: eventImageActions,
			},
			// ! EVENT - ATTENDANCES
			{
				path: "events/:eventId/attend-event",
				loader: eventDetailsLoader,
				element: <SignupFormPage />,
				action: eventAttendeeActions,
			},
			{
				path: "events/:eventId/leave-event/:attendeeId",
				loader: eventDetailsLoader,
				element: <SignupFormPage />,
				action: eventAttendeeActions,
			},
			// ! PROFILE
			{
				path: "profile",
				loader: getLoader,
				element: <SignupFormPage />,
			},
			{
				path: "users/:userId",
				loader: userDetailsLoader,
				element: <SignupFormPage />,
				action: postActions,
			},
			{
				path: "posts",
				element: <SignupFormPage />,
				action: postActions,
			},
			{
				path: "posts/:postId",
				loader: postDetailsLoader,
				element: <SignupFormPage />,
				action: postActions,
			},
			{
				path: "comments",
				element: <SignupFormPage />,
				action: postActions,
			},
			{
				path: "tags",
				loader: getLoader,
				element: <SignupFormPage />,
				action: profileActions,
			},
			{
				path: "tags/:id/:name",
				loader: tagDetailsLoader,
				element: <SignupFormPage />,
				action: profileActions,
			},
			{
				path: "about",
				loader: tagDetailsLoader,
				element: <SignupFormPage />,
				action: profileActions,
			},
			{
				path: "partnership",
				loader: tagDetailsLoader,
				element: <SignupFormPage />,
				action: profileActions,
			},
			{
				path: "assets/resume",
				loader: tagDetailsLoader,
				element: <SignupFormPage />,
				action: profileActions,
			},
		],
	},
]);
