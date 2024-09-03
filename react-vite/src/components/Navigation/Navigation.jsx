import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
// import { useLoaderData } from "react-router-dom";
import ProfileButton from "./ProfileButton";
import "./Navigation.css";

function Navigation({ isLoaded }) {
	const sessionUser = useSelector((state) => state.session.user);
	const navigate = useNavigate();
	// const { allTags } = useLoaderData();

	// console.log("tags", allTags);

	return (
		<div id="whole-navbar">
			{!sessionUser ? (
				<div className="navigation-bar w-nav">
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
						<p
							to="/tags"
							className="navigation-link w-nav-link"
							aria-current="page"
						>
							EXPLORE TAGS
						</p>
						<p to="/get-help" className="navigation-link w-nav-link">
							GET HELP
						</p>
						<p to="/about" className="navigation-link w-nav-link">
							ABOUT
						</p>
						{/* <p to="/partner" className="navigation-link w-nav-link">
							BECOME A PARTNER
						</p> */}
						<p
							to="/i-believe-campaign"
							className="navigation-link w-nav-link"
						>
							&ldquo;I BELIEVE&ldquo; CAMPAIGN
						</p>
						{/* <p to="/posts/create" className="navigation-link w-nav-link">
							SHARE YOUR STORY
						</p> */}
						<p className="navigation-link current w-nav-link">
							CRISIS SUPPORT
						</p>
						{isLoaded && (
							<ProfileButton user={sessionUser} navigate={navigate} />
						)}
					</nav>
				</div>
			) : (
				<div className="navigation-bar w-nav">
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
						<p
							to="/tags"
							className="navigation-link w-nav-link"
							aria-current="page"
						>
							EXPLORE TAGS
						</p>
						<p to="/get-help" className="navigation-link w-nav-link">
							GET HELP
						</p>
						<p to="/about" className="navigation-link w-nav-link">
							ABOUT
						</p>
						<p to="/partner" className="navigation-link w-nav-link">
							BECOME A PARTNER
						</p>
						<p
							to="/i-believe-campaign"
							className="navigation-link w-nav-link"
						>
							&ldquo;I BELIEVE&ldquo; CAMPAIGN
						</p>
						<p to="/posts/create" className="navigation-link w-nav-link">
							SHARE YOUR STORY
						</p>
						<p className="navigation-link current w-nav-link">
							CRISIS SUPPORT
						</p>
						{isLoaded && (
							<ProfileButton user={sessionUser} navigate={navigate} />
						)}
					</nav>
				</div>
			)}
		</div>
	);
}

export default Navigation;
