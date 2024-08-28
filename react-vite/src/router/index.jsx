import { createBrowserRouter } from "react-router-dom";
import LoginFormPage from "../components/LoginFormPage";
import SignupFormPage from "../components/SignupFormPage";
// import Home from "../components/Home";
import NotAuthHome from "../components/Home/NotAuthHome";
import Groups from "../components/Groups";
import GroupDetails from "../components/Groups/Details";
import CreateGroup from "../components/Groups/CRUD/Create";
import UpdateGroup from "../components/Groups/CRUD/Update";
import DeleteGroup from "../components/Groups/CRUD/Delete";
import Events from "../components/Events";
import EventDetails from "../components/Events/Details";
import CreateEvent from "../components/Events/CRUD/Create";
import UpdateEvent from "../components/Events/CRUD/Update";
import Profile from "../components/Profile";
import ProfileDetails from "../components/Profile/Details";
import Posts from "../components/Posts";
import PostDetails from "../components/Posts/Details";
import Comments from "../components/Comments";
import CommentDetails from "../components/Comments/Details";
import Tags from "../components/Tags";
import TagDetails from "../components/Tags/Details";
import Venues from "../components/Venues";
import VenueDetails from "../components/Venues/Details";
import CreateVenue from "../components/Venues/CRUD/Create";
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
                        action: groupActions,
			},
			{
				path: "groups/:groupId",
				loader: groupDetailsLoader,
				element: <GroupDetails />,
				action: groupImageActions,
			},
			{
				path: "groups/new",
				loader: getLoader,
				element: <CreateGroup />,
				action: groupActions,
			},
			{
				path: "groups/groupId/edit",
				loader: groupDetailsLoader,
				element: <UpdateGroup />,
				action: groupActions,
			},
			{
				path: "groups/groupId/delete",
				loader: groupDetailsLoader,
				element: <DeleteGroup />,
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
				element: <Venues />,
			},
			{
				path: "venues/:venueId",
				loader: venueDetailsLoader,
				element: <VenueDetails />,
				action: venueActions,
			},
			{
				path: "groups/:groupId/venues",
				loader: getLoader,
				element: <CreateVenue />,
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
				loader: getLoader,
				element: <Events />,
			},
			{
				path: "events/:eventId",
				loader: eventDetailsLoader,
				element: <EventDetails />,
				action: eventActions,
			},
			{
				path: "groups/groupId/events",
				loader: getLoader,
				element: <CreateEvent />,
				action: eventActions,
			},
			{
				path: "groups/groupId/events/:eventId",
				loader: eventDetailsLoader,
				element: <UpdateEvent />,
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
				element: <Profile />,
			},
			{
				path: "users/:userId",
				loader: userDetailsLoader,
				element: <ProfileDetails />,
				action: postActions,
			},
			{
				path: "posts",
				element: <Posts />,
				action: postActions,
			},
			{
				path: "posts/:postId",
				loader: postDetailsLoader,
				element: <PostDetails />,
				action: postActions,
			},
			{
				path: "comments",
				element: <Comments />,
				action: postActions,
			},
			{
				path: "comments/:commentId",
				element: <CommentDetails />,
				action: postActions,
			},
			{
				path: "tags",
				loader: getLoader,
				element: <Tags />,
				action: profileActions,
			},
			{
				path: "tags/:id/:name",
				loader: tagDetailsLoader,
				element: <TagDetails />,
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
