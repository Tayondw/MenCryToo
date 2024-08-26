import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ProfileButton from "./ProfileButton";
import "./Navigation.css";

function Navigation({ isLoaded }) {
	const sessionUser = useSelector((state) => state.session.user);
	const navigate = useNavigate();

	return (
		<div id="whole-navbar">
			<div
				data-collapse="medium"
				data-animation="default"
				data-duration="400"
				data-easing="ease"
				data-easing2="ease"
				role="banner"
				className="navigation-bar w-nav"
			>
				<h1 className="brand-text">MEN CRY TOO</h1>
				<div className="w-container">
					<a
						href="index.html"
						aria-current="page"
						className="brand-link w-nav-brand w--current"
					></a>
					<div className="hamburger-button w-nav-button">
						<div className="w-icon-nav-menu"></div>
					</div>
				</div>
				<nav role="navigation" className="navigation-menu w-nav-menu">
					<a
						href="index.html"
						aria-current="page"
						className="navigation-link w-nav-link w--current"
					>
						EXPLORE TOPICS
					</a>
					<a href="contact.html" className="navigation-link w-nav-link">
						GET HELP
					</a>
					<a href="contact.html" className="navigation-link w-nav-link">
						ABOUT
					</a>
					<a href="contact.html" className="navigation-link w-nav-link">
						LOGIN
					</a>
					<a href="contact.html" className="navigation-link current w-nav-link">
						CRISIS SUPPORT
					</a>
					{isLoaded && <ProfileButton user={sessionUser} navigate={navigate} />}
				</nav>
			</div>
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
