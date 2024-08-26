import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ProfileButton from "./ProfileButton";
import "./Navigation.css";

function Navigation({ isLoaded }) {
	const sessionUser = useSelector((state) => state.session.user);
	const navigate = useNavigate();

	return (
		<div id="whole-navbar">
			{!sessionUser ? (
				<div
					data-collapse="medium"
					data-animation="default"
					data-duration="400"
					data-easing="ease"
					data-easing2="ease"
					role="banner"
					className="navigation-bar w-nav"
				>
					<div className="w-container-nav-bar">
						<NavLink
							to="/"
							aria-current="page"
							className="brand-link w-nav-brand w--current"
						>
							<h1 className="brand-text">MEN CRY TOO</h1>
						</NavLink>
						<div className="hamburger-button w-nav-button">
							<div className="w-icon-nav-menu"></div>
						</div>
					</div>
					<nav role="navigation" className="navigation-menu w-nav-menu">
						<NavLink
							to="/tags"
							className="navigation-link w-nav-link"
							aria-current="page"
						>
							EXPLORE TAGS
						</NavLink>
						<NavLink to="/get-help" className="navigation-link w-nav-link">
							GET HELP
						</NavLink>
						<NavLink to="/about" className="navigation-link w-nav-link">
							ABOUT
						</NavLink>
						<NavLink className="navigation-link current w-nav-link">
							CRISIS SUPPORT
						</NavLink>
						{isLoaded && (
							<ProfileButton user={sessionUser} navigate={navigate} />
						)}
					</nav>
				</div>
			) : (
				<div
					data-collapse="medium"
					data-animation="default"
					data-duration="400"
					data-easing="ease"
					data-easing2="ease"
					role="banner"
					className="navigation-bar w-nav"
				>
					<div className="w-container">
						<NavLink
							to="/"
							aria-current="page"
							className="brand-link w-nav-brand w--current"
						>
							<h1 className="brand-text">MEN CRY TOO</h1>
						</NavLink>
						<div className="hamburger-button w-nav-button">
							<div className="w-icon-nav-menu"></div>
						</div>
					</div>
					<nav role="navigation" className="navigation-menu w-nav-menu">
						<NavLink
							to="/tags"
							className="navigation-link w-nav-link"
							aria-current="page"
						>
							EXPLORE TAGS
						</NavLink>
						<NavLink to="/get-help" className="navigation-link w-nav-link">
							GET HELP
						</NavLink>
						<NavLink to="/about" className="navigation-link w-nav-link">
							ABOUT
						</NavLink>
						<NavLink className="navigation-link current w-nav-link">
							CRISIS SUPPORT
						</NavLink>
						{isLoaded && (
							<ProfileButton user={sessionUser} navigate={navigate} />
						)}
					</nav>
				</div>
			)}
		</div>
		// <ul>
		// 	<li>
		// 		<NavLink to="/">Home</NavLink>
		// 	</li>

		// 	<li>
		// 		<ProfileButton />
		// 	</li>
		// </ul>
	);
}

export default Navigation;
