import React, {
	useState,
	useCallback,
	memo,
	useEffect,
	useRef,
	useMemo,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
	Home,
	User,
	Users,
	LogOut,
	Menu,
	X,
	Heart,
	Settings,
	Calendar,
	PenTool,
	StickyNote,
	ChevronDown,
	type LucideIcon,
} from "lucide-react";
import {
	RootState,
	AppDispatch,
	User as UserType,
	SessionDataWrapped,
	SessionDataDirect,
} from "../../types";
import { thunkLogout } from "../../store/session";
import OpenModalMenuItem from "./OpenModalMenuItem/OpenModalMenuItem";
import LoginFormModal from "../LoginFormModal";
import Logo from "./Logo";

type SessionData =
	| SessionDataWrapped
	| SessionDataDirect
	| UserType
	| null
	| undefined;

// Navigation item component
const NavigationItem = memo(
	({
		to,
		icon: Icon,
		label,
		onClick,
		className = "",
		isActive = false,
	}: {
		to?: string;
		icon: LucideIcon;
		label: string;
		onClick?: () => void;
		className?: string;
		isActive?: boolean;
	}) => {
		const baseClasses =
			"flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200";
		const activeClasses = isActive
			? "bg-orange-100 text-orange-700 shadow-sm"
			: "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

		if (to) {
			return (
				<Link
					to={to}
					onClick={onClick}
					className={`${baseClasses} ${activeClasses} ${className}`}
				>
					<Icon size={18} />
					<span>{label}</span>
				</Link>
			);
		}

		return (
			<button
				onClick={onClick}
				className={`${baseClasses} ${activeClasses} w-full text-left ${className}`}
			>
				<Icon size={18} />
				<span>{label}</span>
			</button>
		);
	},
);

NavigationItem.displayName = "NavigationItem";

// Profile image component with error handling
const ProfileImage = memo(
	({
		src,
		alt,
		className,
		fallbackSrc = "/default-avatar.png",
	}: {
		src: string;
		alt: string;
		className?: string;
		fallbackSrc?: string;
	}) => {
		const [imageSrc, setImageSrc] = useState(src);
		const [hasError, setHasError] = useState(false);

		useEffect(() => {
			setImageSrc(src);
			setHasError(false);
		}, [src]);

		const handleError = useCallback(() => {
			if (!hasError && imageSrc !== fallbackSrc) {
				setHasError(true);
				setImageSrc(fallbackSrc);
			}
		}, [imageSrc, hasError, fallbackSrc]);

		return (
			<img
				src={imageSrc}
				alt={alt}
				className={className}
				onError={handleError}
			/>
		);
	},
);

ProfileImage.displayName = "ProfileImage";

// User menu component
const UserMenu = memo(
	({
		user,
		onLogout,
		onCloseMenu,
		isMobile = false,
	}: {
		user: UserType;
		onLogout: () => void;
		onCloseMenu: () => void;
		isMobile?: boolean;
	}) => {
		if (isMobile) {
			return (
				<div className="pt-4 border-t border-slate-200 space-y-2">
					<div className="flex items-center space-x-3 px-4 py-3">
						<ProfileImage
							src={user.profileImage}
							alt={user.username}
							className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
						/>
						<div>
							<p className="font-semibold text-slate-900">
								{user.firstName} {user.lastName}
							</p>
							<p className="text-sm text-slate-500">@{user.username}</p>
						</div>
					</div>

					<NavigationItem
						to="/profile"
						icon={User}
						label="View Profile"
						onClick={onCloseMenu}
						className="text-slate-700 hover:bg-slate-100"
					/>

					<NavigationItem
						to={`/users/${user.id}/profile/update`}
						icon={Settings}
						label="Settings"
						onClick={onCloseMenu}
						className="text-slate-700 hover:bg-slate-100"
					/>

					<NavigationItem
						icon={LogOut}
						label="Sign Out"
						onClick={() => {
							onLogout();
							onCloseMenu();
						}}
						className="text-red-600 hover:bg-red-50 hover:text-red-700"
					/>
				</div>
			);
		}

		return (
			<div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-0 zoom-in-95 duration-200">
				{/* User Info Header */}
				<div className="px-4 py-3 border-b border-slate-100">
					<div className="flex items-center space-x-3">
						<ProfileImage
							src={user.profileImage}
							alt={user.username}
							className="w-12 h-12 rounded-full object-cover"
						/>
						<div>
							<p className="font-semibold text-slate-900">
								{user.firstName} {user.lastName}
							</p>
							<p className="text-sm text-slate-500">{user.email}</p>
						</div>
					</div>
				</div>

				{/* Menu Items */}
				<div className="py-2">
					<NavigationItem
						to="/profile"
						icon={User}
						label="View Profile"
						onClick={onCloseMenu}
						className="text-slate-700 hover:bg-slate-50"
					/>

					<NavigationItem
						to={`/users/${user.id}/profile/update`}
						icon={Settings}
						label="Settings"
						onClick={onCloseMenu}
						className="text-slate-700 hover:bg-slate-50"
					/>

					<NavigationItem
						to="/profile-feed"
						icon={Users}
						label="Similar to You"
						onClick={onCloseMenu}
						className="text-slate-700 hover:bg-slate-50"
					/>
				</div>

				<div className="border-t border-slate-100 pt-2">
					<NavigationItem
						icon={LogOut}
						label="Sign Out"
						onClick={() => {
							onLogout();
							onCloseMenu();
						}}
						className="text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left"
					/>
				</div>
			</div>
		);
	},
);

UserMenu.displayName = "UserMenu";

// Helper function to safely extract user data
const extractUserData = (sessionData: SessionData): UserType | null => {
	if (!sessionData) return null;

	// Handle wrapped response structure
	if (
		typeof sessionData === "object" &&
		"user" in sessionData &&
		"authenticated" in sessionData &&
		sessionData.user &&
		sessionData.authenticated
	) {
		return sessionData.user;
	}

	// Handle direct user object - check for required user properties
	if (
		typeof sessionData === "object" &&
		"id" in sessionData &&
		"username" in sessionData &&
		typeof sessionData.id === "number" &&
		typeof sessionData.username === "string"
	) {
		return sessionData as UserType;
	}

	return null;
};

// Main Navigation component
const Navigation: React.FC = memo(() => {
	const rawSessionData = useSelector((state: RootState) => state.session.user);
	const sessionUser = extractUserData(rawSessionData);

	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const location = useLocation();

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);

	const profileRef = useRef<HTMLDivElement>(null);
	const mobileMenuRef = useRef<HTMLDivElement>(null);

	// Navigation links
	const navLinks = useMemo(() => {
		return sessionUser
			? [
					{ path: "/", label: "Home", icon: Home },
					{ path: "/groups", label: "Groups", icon: Users },
					{ path: "/events", label: "Events", icon: Calendar },
					{ path: "/posts-feed", label: "Feed", icon: StickyNote },
					{ path: "/profile-feed", label: "Similar To You", icon: Heart },
					{ path: "/posts/create", label: "Share Story", icon: PenTool },
			  ]
			: [
					{ path: "/", label: "Home", icon: Home },
					{ path: "/groups", label: "Groups", icon: Users },
					{ path: "/events", label: "Events", icon: Calendar },
			  ];
	}, [sessionUser]);

	// Event handlers
	const handleLogout = useCallback(async () => {
		try {
			await dispatch(thunkLogout());
			setIsProfileOpen(false);
			navigate("/", { replace: true });
		} catch (error) {
			console.error("Logout failed:", error);
		}
	}, [dispatch, navigate]);

	const toggleMobileMenu = useCallback(() => {
		setIsMenuOpen((prev) => !prev);
		setIsProfileOpen(false);
	}, []);

	const toggleProfileMenu = useCallback(() => {
		setIsProfileOpen((prev) => !prev);
		setIsMenuOpen(false);
	}, []);

	const closeMobileMenu = useCallback(() => {
		setIsMenuOpen(false);
	}, []);

	const closeProfileMenu = useCallback(() => {
		setIsProfileOpen(false);
	}, []);

	const isActivePath = useCallback(
		(path: string) => {
			return location.pathname === path;
		},
		[location.pathname],
	);

	// Handle scroll effect
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				profileRef.current &&
				!profileRef.current.contains(event.target as Node)
			) {
				setIsProfileOpen(false);
			}
			if (
				mobileMenuRef.current &&
				!mobileMenuRef.current.contains(event.target as Node)
			) {
				setIsMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Close menus on route change
	useEffect(() => {
		setIsMenuOpen(false);
		setIsProfileOpen(false);
	}, [location.pathname]);

	return (
		<>
			<nav
				className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
					isScrolled
						? "bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/50"
						: "bg-white/90 backdrop-blur-sm"
				}`}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16 lg:h-20">
						{/* Logo */}
						<Link to="/" className="flex items-center space-x-3 group">
							<Logo
								size="md"
								className="group-hover:scale-105 transition-transform duration-300 drop-shadow-lg group-hover:drop-shadow-xl"
							/>
							<div className="hidden sm:block">
								<h1 className="text-xl lg:text-2xl mb-0 font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
									MEN CRY TOO
								</h1>
							</div>
						</Link>

						{/* Desktop Navigation */}
						<div className="hidden lg:flex items-center space-x-1">
							{navLinks.map(({ path, label, icon }) => (
								<NavigationItem
									key={path}
									to={path}
									icon={icon}
									label={label}
									isActive={isActivePath(path)}
								/>
							))}
						</div>

						{/* Right Side Actions */}
						<div className="flex items-center space-x-3">
							{/* User Profile or Auth Buttons */}
							{sessionUser ? (
								<div className="relative" ref={profileRef}>
									<button
										onClick={toggleProfileMenu}
										className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 transition-all duration-200 group"
									>
										<div className="relative">
											<ProfileImage
												src={sessionUser.profileImage}
												alt={sessionUser.username}
												className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-slate-200 group-hover:border-orange-300 transition-all duration-200"
											/>
											<div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
										</div>
										<div className="hidden lg:block text-left">
											<p className="text-sm font-semibold text-slate-900">
												{sessionUser.firstName}
											</p>
											<p className="text-xs text-slate-500">
												@{sessionUser.username}
											</p>
										</div>
										<ChevronDown
											size={16}
											className={`hidden lg:block text-slate-400 transition-transform duration-200 ${
												isProfileOpen ? "rotate-180" : ""
											}`}
										/>
									</button>

									{/* Profile Dropdown */}
									{isProfileOpen && (
										<UserMenu
											user={sessionUser}
											onLogout={handleLogout}
											onCloseMenu={closeProfileMenu}
										/>
									)}
								</div>
							) : (
								<div className="hidden lg:flex items-center space-x-3">
									<OpenModalMenuItem
										itemText="Sign In"
										modalComponent={<LoginFormModal />}
										className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200 cursor-pointer"
									/>
									<Link
										to="/signup"
										className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
									>
										Sign Up
									</Link>
								</div>
							)}

							{/* Mobile Menu Button */}
							<button
								onClick={toggleMobileMenu}
								className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
								aria-label="Toggle mobile menu"
							>
								{isMenuOpen ? <X size={24} /> : <Menu size={24} />}
							</button>
						</div>
					</div>
				</div>

				{/* Mobile Menu */}
				{isMenuOpen && (
					<div
						ref={mobileMenuRef}
						className="lg:hidden bg-white border-t border-slate-200 shadow-lg animate-in slide-in-from-top-2 duration-200"
					>
						<div className="px-4 py-4 space-y-2">
							{/* Mobile Navigation Links */}
							{navLinks.map(({ path, label, icon }) => (
								<NavigationItem
									key={path}
									to={path}
									icon={icon}
									label={label}
									onClick={closeMobileMenu}
									isActive={isActivePath(path)}
									className={
										isActivePath(path)
											? "bg-orange-100 text-orange-700"
											: "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
									}
								/>
							))}

							{/* Mobile Auth Section */}
							{!sessionUser && (
								<div className="pt-4 border-t border-slate-200 space-y-3">
									<OpenModalMenuItem
										itemText="Sign In"
										modalComponent={<LoginFormModal />}
										className="flex items-center justify-center w-full px-4 py-3 text-slate-600 hover:text-slate-900 font-medium border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 cursor-pointer"
									/>
									<Link
										to="/signup"
										className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
										onClick={closeMobileMenu}
									>
										Sign Up
									</Link>
								</div>
							)}

							{/* Mobile User Section */}
							{sessionUser && (
								<UserMenu
									user={sessionUser}
									onLogout={handleLogout}
									onCloseMenu={closeMobileMenu}
									isMobile={true}
								/>
							)}
						</div>
					</div>
				)}
			</nav>

			{/* Spacer to prevent content from hiding behind fixed navbar */}
			<div className="h-16 lg:h-20"></div>
		</>
	);
});

Navigation.displayName = "Navigation";

export default Navigation;
