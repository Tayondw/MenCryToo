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
const PostDetailsWithComments = lazy(
	() => import("../components/Posts/Details/PostDetails"),
);
const PostsFeedWithComments = lazy(
	() => import("../components/Posts/Feed/PostsFeed"),
);
const CreatePost = lazy(() => import("../components/Posts/CRUD/Create"));
const UpdatePost = lazy(() => import("../components/Posts/CRUD/Update"));
const Partnership = lazy(() => import("../components/Partnership"));
const Contact = lazy(() => import("../components/Contact"));
const Success = lazy(() => import("../components/Success"));
const FourZeroFourPage = lazy(() => import("../components/404Page"));

// Import loaders and actions
import { homeLoader } from "./loaders/homeLoaders";
import {
	signupAction,
	loginAction,
	protectedRouteLoader,
} from "./loaders/authLoaders";
import { publicUserProfileLoader } from "./loaders/userLoaders";
import {
	profileLoader,
	profileUpdateAction,
	profileAction,
} from "./loaders/profileLoaders";
import { profileFeedLoaderDetailed } from "./loaders/profileFeedLoaders";
import {
	groupsLoader,
	groupDetailsLoader,
	groupAction,
	groupFormAction,
} from "./loaders/groupLoaders";
import {
	eventsLoader,
	eventDetailsLoader,
	eventAction,
	eventFormAction,
} from "./loaders/eventLoaders";
import {
	postDetailsLoader,
	postAction,
	similarPostsLoader,
} from "./loaders/postLoaders";
import { postsFeedLoader, postsFeedAction } from "./loaders/postsFeedLoaders";
import { partnershipActions } from "./loaders/partnershipActions";
import { contactActions } from "./loaders/contactActions";

// Router configuration
export const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		children: [
			{
				index: true, // Use index route for home
				loader: homeLoader, // This handles auth gracefully now
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
			// PUBLIC ROUTES (no auth required)
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
				path: "users/:userId",
				loader: publicUserProfileLoader,
				element: (
					<SuspenseWrapper>
						<ProfileDetails />
					</SuspenseWrapper>
				),
			},
			// PROTECTED ROUTES (require auth)
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
				path: "posts-feed",
				loader: postsFeedLoader,
				element: (
					<SuspenseWrapper>
						<PrivateRoute>
							<PostsFeedWithComments />
						</PrivateRoute>
					</SuspenseWrapper>
				),
				action: postsFeedAction,
			},
			{
				path: "similar-feed",
				loader: similarPostsLoader,
				element: (
					<SuspenseWrapper>
						<PrivateRoute>
							<Posts />
						</PrivateRoute>
					</SuspenseWrapper>
				),
				action: postAction,
			},
			{
				path: "profile-feed",
				loader: profileFeedLoaderDetailed,
				element: (
					<SuspenseWrapper>
						<PrivateRoute>
							<ProfileFeed />
						</PrivateRoute>
					</SuspenseWrapper>
				),
				action: postAction,
			},
			// CREATION ROUTES (require auth)
			{
				path: "groups/new",
				loader: protectedRouteLoader,
				element: (
					<SuspenseWrapper>
						<PrivateRoute>
							<CreateGroup />
						</PrivateRoute>
					</SuspenseWrapper>
				),
				action: groupFormAction,
			},
			{
				path: "groups/:groupId/edit",
				loader: protectedRouteLoader,
				element: (
					<SuspenseWrapper>
						<PrivateRoute>
							<UpdateGroup />
						</PrivateRoute>
					</SuspenseWrapper>
				),
				action: groupFormAction,
			},
			{
				path: "groups/:groupId/events/new",
				loader: protectedRouteLoader,
				element: (
					<SuspenseWrapper>
						<PrivateRoute>
							<CreateEvent />
						</PrivateRoute>
					</SuspenseWrapper>
				),
				action: eventFormAction,
			},
			{
				path: "groups/:groupId/events/:eventId",
				loader: protectedRouteLoader,
				element: (
					<SuspenseWrapper>
						<PrivateRoute>
							<UpdateEvent />
						</PrivateRoute>
					</SuspenseWrapper>
				),
				action: eventFormAction,
			},
			{
				path: "users/:userId/profile/update",
				loader: protectedRouteLoader,
				element: (
					<SuspenseWrapper>
						<PrivateRoute>
							<UpdateProfile />
						</PrivateRoute>
					</SuspenseWrapper>
				),
				action: profileUpdateAction,
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
				loader: protectedRouteLoader,
				element: (
					<SuspenseWrapper>
						<PrivateRoute>
							<CreatePost />
						</PrivateRoute>
					</SuspenseWrapper>
				),
				action: postAction,
			},
			{
				path: "posts/:postId/edit",
				loader: protectedRouteLoader,
				element: (
					<SuspenseWrapper>
						<PrivateRoute>
							<UpdatePost />
						</PrivateRoute>
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
