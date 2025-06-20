import { createBrowserRouter } from "react-router-dom";
import LoginFormPage from "../components/LoginFormPage";
// import SignupFormPage from "../components/SignupFormPage";
import SignupFormPage from "../components/SignupFormPage-TSX/SignupFormPage";
// import Home from "../components/Home";
import Home from "../components/Home-TSX";
import Groups from "../components/Groups";
import GroupDetails from "../components/Groups/Details";
import CreateGroup from "../components/Groups/CRUD/Create";
import UpdateGroup from "../components/Groups/CRUD/Update";
import Events from "../components/Events";
import EventDetails from "../components/Events/Details";
import CreateEvent from "../components/Events/CRUD/Create";
import UpdateEvent from "../components/Events/CRUD/Update";
// import Profile from "../components/Profile";
import Profile from "../components/Profile/CRUD";
import ProfileDetails from "../components/Profile/Details";
// import UpdateProfile from "../components/Profile/CRUD/Update";
import UpdateProfile from "../components/Profile/CRUD-TSX/Update";
import Posts from "../components/Posts";
// import PostDetails from "../components/Posts/Details";
import CreatePost from "../components/Posts/CRUD/Create";
import UpdatePost from "../components/Posts/CRUD/Update";
import PrivateRoute from "../components/PrivateRoute";
import ProfileFeed from "../components/Profile/CRUD/ProfileFeed";
import Partnership from "../components/Partnership";
import Contact from "../components/Contact";
import Success from "../components/Success";
import FourZeroFourPage from "../components/404Page";
// import Comments from "../components/Comments";
// import CommentDetails from "../components/Comments/Details";
// import Tags from "../components/Tags";
// import TagDetails from "../components/Tags/Details";
// import Venues from "../components/Venues";
// import VenueDetails from "../components/Venues/Details";
// import CreateVenue from "../components/Venues/CRUD/Create";
import {
	getLoader,
	groupDetailsLoader,
	eventDetailsLoader,
	// venueDetailsLoader,
	userDetailsLoader,
	// postsLoader,
	postDetailsLoader,
	profilesLoader,
	tagsLoader,
	// tagDetailsLoader,
} from "./loaders";
import {
	groupActions,
	// groupImageActions,
	eventActions,
	// eventImageActions,
	// groupMemberActions,
	// eventAttendeeActions,
	// venueActions,
	profileActions,
	postActions,
	partnershipActions,
	contactActions,
} from "./actions";
import {profileLoader, profileUpdateAction, profileAction} from "../loaders/profileLoaders";
import Layout from "./Layout";

export const router = createBrowserRouter([
	{
		element: <Layout />,
		loader: tagsLoader,
		children: [
			{
				path: "/",
				loader: getLoader,
				element: <Home />,
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
				action: groupActions,
			},
			{
				path: "groups/new",
				loader: getLoader,
				element: <CreateGroup />,
				action: groupActions,
			},
			{
				path: "groups/:groupId/edit",
				loader: groupDetailsLoader,
				element: <UpdateGroup />,
				action: groupActions,
			},
			// ! VENUES
			// {
			// 	path: "venues",
			// 	element: <Venues />,
			// },
			// {
			// 	path: "venues/:venueId",
			// 	loader: venueDetailsLoader,
			// 	element: <VenueDetails />,
			// 	action: venueActions,
			// },
			// {
			// 	path: "groups/:groupId/venues",
			// 	loader: getLoader,
			// 	element: <CreateVenue />,
			// 	action: venueActions,
			// },
			// ! EVENTS
			{
				path: "events",
				loader: getLoader,
				element: <Events />,
				action: eventActions,
			},
			{
				path: "events/:eventId",
				loader: eventDetailsLoader,
				element: <EventDetails />,
				action: eventActions,
			},
			{
				path: "groups/:groupId/events/new",
				loader: groupDetailsLoader,
				element: <CreateEvent />,
				action: eventActions,
			},
			{
				path: "groups/:groupId/events/:eventId",
				loader: eventDetailsLoader,
				element: <UpdateEvent />,
				action: eventActions,
			},
			// ! PROFILE
			// ? your profile only you can access
			{
                        path: "profile",
                        loader: profileLoader,
				element: (
					<PrivateRoute>
						<Profile />
					</PrivateRoute>
				),
				action: profileAction,
			},
			{
				path: "users/:userId/profile/update",
				loader: profileLoader,
				element: <UpdateProfile />,
				action: profileUpdateAction,
			},
			// ? profile feed for users with similar tags
			{
				path: "profile-feed",
				loader: profilesLoader,
				element: <ProfileFeed />,
				action: postActions,
			},
			// ? other users profiles when you click on their profile
			{
				path: "users/:userId",
				loader: userDetailsLoader,
				element: <ProfileDetails />,
				// action: postActions,
			},
			{
				path: "posts-feed",
				loader: profilesLoader,
				element: <Posts />,
				action: postActions,
			},
			// {
			// 	path: "posts/:postId",
			// 	loader: postDetailsLoader,
			// 	element: <PostDetails />,
			// 	action: postActions,
			// },
			{
				path: "posts/create",
				// loader: postDetailsLoader,
				element: <CreatePost />,
				action: postActions,
			},
			{
				path: "posts/:postId/edit",
				loader: postDetailsLoader,
				element: <UpdatePost />,
				action: postActions,
			},
			// {
			// 	path: "comments",
			// 	element: <Comments />,
			// 	action: postActions,
			// },
			// {
			// 	path: "comments/:commentId",
			// 	element: <CommentDetails />,
			// 	action: postActions,
			// },
			// {
			// 	path: "tags",
			// 	loader: getLoader,
			// 	element: <Tags />,
			// 	action: profileActions,
			// },
			// {
			// 	path: "tags/:id/:name",
			// 	loader: tagDetailsLoader,
			// 	element: <TagDetails />,
			// 	action: profileActions,
			// },
			// {
			// 	path: "about",
			// 	loader: tagDetailsLoader,
			// 	element: <SignupFormPage />,
			// 	action: profileActions,
			// },
			{
				path: "partnership",
				element: <Partnership />,
				action: partnershipActions,
			},
			{
				path: "contact",
				element: <Contact />,
				action: contactActions,
			},
			{
				path: "success",
				element: <Success />,
			},
			{
				path: "*",
				element: <FourZeroFourPage />,
			},
		],
	},
]);
