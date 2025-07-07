import { createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import Layout from "./Layout";
import PrivateRoute from "../components/PrivateRoute";
import SuspenseWrapper from "../components/SuspenseWrapper/SuspenseWrapper";

// Lazy loading with better chunking
const LoginFormPage = lazy(() => import("../components/LoginFormPage"));
const SignupFormPage = lazy(() => import("../components/SignupFormPage"));
const Home = lazy(() => import("../components/Home"));
const Groups = lazy(() => import("../components/Groups"));
const GroupDetails = lazy(() => import("../components/Groups/Details"));
const CreateGroup = lazy(() => import("../components/Groups/CRUD/Create"));
const UpdateGroup = lazy(() => import("../components/Groups/CRUD/Update"));
const Events = lazy(() => import("../components/Events"));
const EventDetails = lazy(() => import("../components/Events/Details"));
const CreateEvent = lazy(() => import("../components/Events/CRUD/Create"));
const UpdateEvent = lazy(() => import("../components/Events/CRUD/Update"));
const Profile = lazy(() => import("../components/Profile"));
const ProfileDetails = lazy(() => import("../components/Profile/Details"));
const UpdateProfile = lazy(() => import("../components/Profile/CRUD/Update"));
const ProfileFeed = lazy(
	() => import("../components/Profile/CRUD/ProfileFeed"),
);
const Posts = lazy(() => import("../components/Posts"));
// const PostDetails = lazy(() => import("../components/Posts/Details"));
const PostDetailsWithComments = lazy(() => import("../components/Posts/Details/PostDetailsWithComments"))
// const PostsFeed = lazy(() => import("../components/Posts/Feed"));
const PostsFeedWithComments = lazy(() => import("../components/Posts/Feed/PostsFeedWithComments"));
const CreatePost = lazy(() => import("../components/Posts/CRUD/Create"));
const UpdatePost = lazy(() => import("../components/Posts/CRUD/Update"));
const Partnership = lazy(() => import("../components/Partnership"));
const Contact = lazy(() => import("../components/Contact"));
const Success = lazy(() => import("../components/Success"));
const FourZeroFourPage = lazy(() => import("../components/404Page"));

// Import loaders and actions
import { homeLoader } from "../loaders/homeLoaders";
import { signupAction, loginAction } from "../loaders/authLoaders";
import { userDetailsLoader } from "../loaders/userLoaders";
import {
	profileLoader,
	profileUpdateAction,
	profileAction,
} from "../loaders/profileLoaders";
import { profileFeedLoader } from "../loaders/profileFeedLoaders";
import {
	groupsLoader,
	groupDetailsLoader,
	groupAction,
	groupFormAction,
} from "../loaders/groupLoaders";
import {
	eventsLoader,
	eventDetailsLoader,
	eventAction,
	eventFormAction,
} from "../loaders/eventLoaders";
import {
	postDetailsLoader,
	postAction,
	similarPostsLoader,
} from "../loaders/postLoaders";
import { postsFeedLoader, postsFeedAction } from "../loaders/postsFeedLoaders";
import { partnershipActions } from "../loaders/partnershipActions";
import { contactActions } from "../loaders/contactActions";

// Router configuration
export const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		children: [
			{
				index: true, // Use index route for home
				loader: homeLoader,
				element: (
					<SuspenseWrapper>
						<Home />
					</SuspenseWrapper>
				),
			},
			{
				path: "login",
				element: (
					<SuspenseWrapper>
						<LoginFormPage />
					</SuspenseWrapper>
				),
				action: loginAction,
			},
			{
				path: "signup",
				element: (
					<SuspenseWrapper>
						<SignupFormPage />
					</SuspenseWrapper>
				),
				action: signupAction,
			},
			// GROUPS
			{
				path: "groups",
				loader: groupsLoader,
				element: (
					<SuspenseWrapper>
						<Groups />
					</SuspenseWrapper>
				),
			},
			{
				path: "groups/:groupId",
				loader: groupDetailsLoader,
				element: (
					<SuspenseWrapper>
						<GroupDetails />
					</SuspenseWrapper>
				),
				action: groupAction,
			},
			{
				path: "groups/new",
				element: (
					<SuspenseWrapper>
						<CreateGroup />
					</SuspenseWrapper>
				),
				action: groupFormAction,
			},
			{
				path: "groups/:groupId/edit",
				loader: groupDetailsLoader,
				element: (
					<SuspenseWrapper>
						<UpdateGroup />
					</SuspenseWrapper>
				),
				action: groupFormAction,
			},
			// EVENTS
			{
				path: "events",
				loader: eventsLoader,
				element: (
					<SuspenseWrapper>
						<Events />
					</SuspenseWrapper>
				),
			},
			{
				path: "events/:eventId",
				loader: eventDetailsLoader,
				element: (
					<SuspenseWrapper>
						<EventDetails />
					</SuspenseWrapper>
				),
				action: eventAction,
			},
			{
				path: "groups/:groupId/events/new",
				loader: groupDetailsLoader,
				element: (
					<SuspenseWrapper>
						<CreateEvent />
					</SuspenseWrapper>
				),
				action: eventFormAction,
			},
			{
				path: "groups/:groupId/events/:eventId",
				loader: eventDetailsLoader,
				element: (
					<SuspenseWrapper>
						<UpdateEvent />
					</SuspenseWrapper>
				),
				action: eventFormAction,
			},
			// PROFILE
			{
				path: "profile",
				loader: profileLoader,
				element: (
					<SuspenseWrapper>
						<PrivateRoute>
							<Profile />
						</PrivateRoute>
					</SuspenseWrapper>
				),
				action: profileAction,
			},
			{
				path: "users/:userId/profile/update",
				loader: profileLoader,
				element: (
					<SuspenseWrapper>
						<UpdateProfile />
					</SuspenseWrapper>
				),
				action: profileUpdateAction,
			},
			{
				path: "profile-feed",
				loader: profileFeedLoader,
				element: (
					<SuspenseWrapper>
						<ProfileFeed />
					</SuspenseWrapper>
				),
				action: postAction,
			},
			{
				path: "users/:userId",
				loader: userDetailsLoader,
				element: (
					<SuspenseWrapper>
						<ProfileDetails />
					</SuspenseWrapper>
				),
			},
			{
				path: "similar-feed",
				loader: similarPostsLoader,
				element: (
					<SuspenseWrapper>
						<Posts />
					</SuspenseWrapper>
				),
				action: postAction,
			},
			{
				path: "posts-feed",
				loader: postsFeedLoader,
				element: (
					<SuspenseWrapper>
						<PostsFeedWithComments />
					</SuspenseWrapper>
				),
				action: postsFeedAction,
			},
			{
				path: "posts/:postId",
				loader: postDetailsLoader,
				element: (
					<SuspenseWrapper>
						<PostDetailsWithComments />
					</SuspenseWrapper>
				),
				action: postAction,
			},
			{
				path: "posts/create",
				element: (
					<SuspenseWrapper>
						<CreatePost />
					</SuspenseWrapper>
				),
				action: postAction,
			},
			{
				path: "posts/:postId/edit",
				loader: postDetailsLoader,
				element: (
					<SuspenseWrapper>
						<UpdatePost />
					</SuspenseWrapper>
				),
				action: postAction,
			},
			// STATIC PAGES
			{
				path: "partnership",
				element: (
					<SuspenseWrapper>
						<Partnership />
					</SuspenseWrapper>
				),
				action: partnershipActions,
			},
			{
				path: "contact",
				element: (
					<SuspenseWrapper>
						<Contact />
					</SuspenseWrapper>
				),
				action: contactActions,
			},
			{
				path: "success",
				element: (
					<SuspenseWrapper>
						<Success />
					</SuspenseWrapper>
				),
			},
		],
	},
	// Separate 404 route outside of the Layout children
	{
		path: "*",
		element: (
			<Layout>
				<SuspenseWrapper>
					<FourZeroFourPage />
				</SuspenseWrapper>
			</Layout>
		),
	},
]);

export default router;
