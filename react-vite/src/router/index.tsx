import { createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import Layout from "./Layout";
import PrivateRoute from "../components/PrivateRoute";
import SuspenseWrapper from "../components/SuspenseWrapper/SuspenseWrapper";
import { RouteErrorBoundary } from "../components/RouteErrorBoundary/RouteErrorBoundary";

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
import { homeLoader } from "./loaders/home";
import {
	signupAction,
	loginAction,
	protectedRouteLoader,
} from "./loaders/auth";
import { publicUserProfileLoader } from "./loaders/user";
import {
	profileLoader,
	profileUpdateAction,
	profileAction,
	profileFeedLoaderDetailed,
} from "./loaders/profile";
import {
	groupsLoader,
	groupDetailsLoader,
	groupAction,
	groupFormAction,
	updateGroupLoader,
	createEventLoader,
} from "./loaders/group";
import {
	eventsLoader,
	eventDetailsLoader,
	eventAction,
	eventFormAction,
	updateEventLoader,
} from "./loaders/event";
import {
	postDetailsLoader,
	postAction,
	similarPostsLoader,
	postsFeedAction,
	postsFeedLoader,
} from "./loaders/post";
import { partnershipActions } from "./actions/partnership";
import { contactActions } from "./actions/contact";

// Router configuration
export const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		errorElement: <RouteErrorBoundary />,
		children: [
			{
				index: true,
				loader: homeLoader,
				element: (
					<SuspenseWrapper>
						<Home />
					</SuspenseWrapper>
				),
				errorElement: <RouteErrorBoundary />,
			},
			{
				path: "login",
				element: (
					<SuspenseWrapper>
						<LoginFormPage />
					</SuspenseWrapper>
				),
				action: loginAction,
				errorElement: <RouteErrorBoundary />,
			},
			{
				path: "signup",
				element: (
					<SuspenseWrapper>
						<SignupFormPage />
					</SuspenseWrapper>
				),
				action: signupAction,
				errorElement: <RouteErrorBoundary />,
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
				errorElement: <RouteErrorBoundary />,
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
				errorElement: <RouteErrorBoundary />,
			},
			{
				path: "events",
				loader: eventsLoader,
				element: (
					<SuspenseWrapper>
						<Events />
					</SuspenseWrapper>
				),
				errorElement: <RouteErrorBoundary />,
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
				errorElement: <RouteErrorBoundary />,
			},
			{
				path: "users/:userId",
				loader: publicUserProfileLoader,
				element: (
					<SuspenseWrapper>
						<ProfileDetails />
					</SuspenseWrapper>
				),
				errorElement: <RouteErrorBoundary />,
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
				errorElement: <RouteErrorBoundary />,
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
				loader: updateGroupLoader,
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
				loader: createEventLoader,
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
				path: "groups/:groupId/events/:eventId/edit",
				loader: updateEventLoader,
				element: (
					<SuspenseWrapper>
						<PrivateRoute>
							<UpdateEvent />
						</PrivateRoute>
					</SuspenseWrapper>
				),
				action: eventFormAction,
				errorElement: <RouteErrorBoundary />,
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
	{
		path: "*",
		element: (
			<Layout>
				<SuspenseWrapper>
					<FourZeroFourPage />
				</SuspenseWrapper>
			</Layout>
		),
		errorElement: <RouteErrorBoundary />,
	},
]);

export default router;
