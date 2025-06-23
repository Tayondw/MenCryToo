import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
	Menu,
	X,
	User,
	Settings,
	LogOut,
	Users,
	Calendar,
	PenTool,
	Home,
	ChevronDown,
	// Bell,
	// Search,
	Heart,
} from "lucide-react";
import { thunkLogout } from "../../store/session";
import { RootState, AppDispatch } from "../../types";
import OpenModalMenuItem from "./OpenModalMenuItem/OpenModalMenuItem";
import LoginFormModal from "../LoginFormModal";
import Logo from "./Logo";

const Navigation: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const location = useLocation();
	const sessionUser = useSelector((state: RootState) => state.session.user);

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);

	const profileRef = useRef<HTMLDivElement>(null);
	const mobileMenuRef = useRef<HTMLDivElement>(null);

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

	// Close mobile menu on route change
	useEffect(() => {
		setIsMenuOpen(false);
		setIsProfileOpen(false);
	}, [location.pathname]);

	const handleLogout = async () => {
		await dispatch(thunkLogout());
		setIsProfileOpen(false);
		navigate("/", { replace: true });
	};

	const toggleMobileMenu = () => {
		setIsMenuOpen(!isMenuOpen);
		setIsProfileOpen(false);
	};

	const toggleProfileMenu = () => {
		setIsProfileOpen(!isProfileOpen);
		setIsMenuOpen(false);
	};

	const isActivePath = (path: string) => {
		return location.pathname === path;
	};

	const navLinks = sessionUser
		? [
				{ path: "/", label: "Home", icon: Home },
				{ path: "/groups", label: "Groups", icon: Users },
				{ path: "/events", label: "Events", icon: Calendar },
				{ path: "/posts-feed", label: "Posts", icon: Heart },
				{ path: "/posts/create", label: "Share Story", icon: PenTool },
		  ]
		: [
				{ path: "/", label: "Home", icon: Home },
				{ path: "/groups", label: "Groups", icon: Users },
				{ path: "/events", label: "Events", icon: Calendar },
		  ];

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
							{navLinks.map(({ path, label, icon: Icon }) => (
								<Link
									key={path}
									to={path}
									className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
										isActivePath(path)
											? "bg-orange-100 text-orange-700 shadow-sm"
											: "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
									}`}
								>
									<Icon size={18} />
									<span>{label}</span>
								</Link>
							))}
						</div>

						{/* Right Side Actions */}
						<div className="flex items-center space-x-3">
							{/* Search Button - Desktop Only */}
							{/* {sessionUser && (
								<button className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200">
									<Search size={20} />
								</button>
							)} */}

							{/* Notifications - Desktop Only */}
							{/* {sessionUser && (
								<button className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 relative">
									<Bell size={20} />
									<span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></span>
								</button>
							)} */}

							{/* User Profile or Auth Buttons */}
							{sessionUser ? (
								<div className="relative" ref={profileRef}>
									<button
										onClick={toggleProfileMenu}
										className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 transition-all duration-200 group"
									>
										<div className="relative">
											<img
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
										<div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-0 zoom-in-95 duration-200">
											{/* User Info Header */}
											<div className="px-4 py-3 border-b border-slate-100">
												<div className="flex items-center space-x-3">
													<img
														src={sessionUser.profileImage}
														alt={sessionUser.username}
														className="w-12 h-12 rounded-full object-cover"
													/>
													<div>
														<p className="font-semibold text-slate-900">
															{sessionUser.firstName} {sessionUser.lastName}
														</p>
														<p className="text-sm text-slate-500">
															{sessionUser.email}
														</p>
													</div>
												</div>
											</div>

											{/* Menu Items */}
											<div className="py-2">
												<Link
													to="/profile"
													className="flex items-center space-x-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors duration-200"
													onClick={() => setIsProfileOpen(false)}
												>
													<User size={18} />
													<span>View Profile</span>
												</Link>
												<Link
													to={`/users/${sessionUser.id}/profile/update`}
													className="flex items-center space-x-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors duration-200"
													onClick={() => setIsProfileOpen(false)}
												>
													<Settings size={18} />
													<span>Settings</span>
												</Link>
												<Link
													to="/profile-feed"
													className="flex items-center space-x-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors duration-200"
													onClick={() => setIsProfileOpen(false)}
												>
													<Users size={18} />
													<span>Similar to You</span>
												</Link>
											</div>

											<div className="border-t border-slate-100 pt-2">
												<button
													onClick={handleLogout}
													className="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200 w-full text-left"
												>
													<LogOut size={18} />
													<span>Sign Out</span>
												</button>
											</div>
										</div>
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
							{navLinks.map(({ path, label, icon: Icon }) => (
								<Link
									key={path}
									to={path}
									className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
										isActivePath(path)
											? "bg-orange-100 text-orange-700"
											: "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
									}`}
									onClick={() => setIsMenuOpen(false)}
								>
									<Icon size={20} />
									<span>{label}</span>
								</Link>
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
										onClick={() => setIsMenuOpen(false)}
									>
										Sign Up
									</Link>
								</div>
							)}

							{/* Mobile User Section */}
							{sessionUser && (
								<div className="pt-4 border-t border-slate-200 space-y-2">
									<div className="flex items-center space-x-3 px-4 py-3">
										<img
											src={sessionUser.profileImage}
											alt={sessionUser.username}
											className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
										/>
										<div>
											<p className="font-semibold text-slate-900">
												{sessionUser.firstName} {sessionUser.lastName}
											</p>
											<p className="text-sm text-slate-500">
												@{sessionUser.username}
											</p>
										</div>
									</div>

									<Link
										to="/profile"
										className="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors duration-200"
										onClick={() => setIsMenuOpen(false)}
									>
										<User size={20} />
										<span>View Profile</span>
									</Link>

									<Link
										to={`/users/${sessionUser.id}/profile/update`}
										className="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors duration-200"
										onClick={() => setIsMenuOpen(false)}
									>
										<Settings size={20} />
										<span>Settings</span>
									</Link>

									<button
										onClick={handleLogout}
										className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 w-full text-left"
									>
										<LogOut size={20} />
										<span>Sign Out</span>
									</button>
								</div>
							)}
						</div>
					</div>
				)}
			</nav>

			{/* Spacer to prevent content from hiding behind fixed navbar */}
			<div className="h-16 lg:h-20"></div>
		</>
	);
};

export default Navigation;
