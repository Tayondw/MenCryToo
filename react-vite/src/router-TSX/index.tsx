import { createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import Layout from "./Layout";
import PrivateRoute from "../components/PrivateRoute";
import SuspenseWrapper from "../components/SuspenseWrapper/SuspenseWrapper";

// OPTIMIZED: Lazy loading with better chunking
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
const CreatePost = lazy(() => import("../components/Posts/CRUD/Create"));
const UpdatePost = lazy(() => import("../components/Posts/CRUD/Update"));
const Partnership = lazy(() => import("../components/Partnership"));
const Contact = lazy(() => import("../components/Contact"));
const Success = lazy(() => import("../components/Success"));
const FourZeroFourPage = lazy(() => import("../components/404Page"));

// Import loaders and actions
import { getLoader, tagsLoader } from "./loaders";
import { postActions, partnershipActions, contactActions } from "./actions";
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
	postsLoader,
	postDetailsLoader,
	postAction,
} from "../loaders/postLoaders";

// OPTIMIZED: Router configuration with performance considerations
export const router = createBrowserRouter([
	{
		element: <Layout />,
		loader: tagsLoader,
		children: [
			{
				path: "/",
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
				loader: getLoader,
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
				action: postActions,
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
				path: "posts-feed",
				loader: postsLoader,
				element: (
					<SuspenseWrapper>
						<Posts />
					</SuspenseWrapper>
				),
				action: postActions,
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
			// Catch-all route
			{
				path: "*",
				element: (
					<SuspenseWrapper>
						<FourZeroFourPage />
					</SuspenseWrapper>
				),
			},
		],
	},
]);

export default router;
