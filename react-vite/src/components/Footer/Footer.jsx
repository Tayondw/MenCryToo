import { Outlet } from "react-router-dom";
import { RiTwitterXLine, RiFacebookLine } from "react-icons/ri";
import { PiPinterestLogo } from "react-icons/pi";
import { TiSocialGooglePlus } from "react-icons/ti";
import "../Home/NotAuthHome/NotAuthHome.css";

const Footer = () => {
	return (
		<div className="footer center">
			<div className="footer-container">
				<RiTwitterXLine className="footer-link" />
				<RiFacebookLine className="footer-link" />
				<PiPinterestLogo className="footer-link" />
				<TiSocialGooglePlus className="footer-link" />
			</div>
			<div className="footer-text">MEN CRY TOO COPYRIGHT 2024</div>
			<Outlet />
		</div>
	);
};

export default Footer;
