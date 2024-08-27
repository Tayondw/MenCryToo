import { Outlet } from "react-router-dom";
import { RiTwitterXLine, RiFacebookLine } from "react-icons/ri";
import { PiPinterestLogo } from "react-icons/pi";
import { TiSocialGooglePlus } from "react-icons/ti";
import "../Home/NotAuthHome/NotAuthHome.css";

const Footer = () => {
	return (
		<div className="footer center">
			<div className="w-container">
				<RiTwitterXLine width={20} />
				<RiFacebookLine width={20} />
				<PiPinterestLogo width={20} />
				<TiSocialGooglePlus width={20} />
				<div className="footer-text">MEN CRY TOO COPYRIGHT 2024</div>
			</div>
			<Outlet />
		</div>
	);
};

export default Footer;
