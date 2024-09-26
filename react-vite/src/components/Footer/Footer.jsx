import { Link } from "react-router-dom";
// import { RiTwitterXLine, RiFacebookLine } from "react-icons/ri";
// import { PiPinterestLogo } from "react-icons/pi";
// import { TiSocialGooglePlus } from "react-icons/ti";
import { FaFolder, FaGithub, FaLinkedin } from "react-icons/fa";
import { GrDocumentPdf } from "react-icons/gr";
import { Tooltip } from "react-tooltip";
import resume from "../../assets/Williams, Tayon SWE.pdf";
import "../Home/NotAuthHome/NotAuthHome.css";
// import "react-tooltip/dist/react-tooltip.css";

const Footer = () => {
	return (
		<div className="footer center">
			{/* <div className="footer-container">
				<div>
					<h3>WHERE YOU CAN FIND US</h3>
				</div>
				<div className="footer-logos">
					<RiTwitterXLine className="footer-link" style={{ cursor: `text` }} />
					<RiFacebookLine className="footer-link" style={{ cursor: `text` }} />
					<PiPinterestLogo className="footer-link" style={{ cursor: `text` }} />
					<TiSocialGooglePlus
						className="footer-link"
						style={{ cursor: `text` }}
					/>
				</div>
			</div> */}
			<div className="footer-links">
				<div id="personal-info-footer">
					<h2>MEET THE DEVELOPER</h2>
					<h3>Tayon Williams</h3>
					<p>tayondw@gmail.com</p>
				</div>
			</div>
			<div>
				<img
					src="https://mencrytoo.s3.amazonaws.com/Proffesional-headshot-1.jpg"
					alt="professional-headshot"
					height={200}
				/>
			</div>
			<div id="personal-profile-footer">
				<div>
					<Tooltip id="portfolio-tt" />
					<Link
						to="https://github.com/Tayondw/Tayondw"
						data-tooltip-id="portfolio-tt"
						data-tooltip-content="Portfolio"
						data-tooltip-place="top"
					>
						<FaFolder id="folder" />
					</Link>
				</div>
				<div>
					<Tooltip id="github-tt" />
					<Link
						to="https://github.com/Tayondw"
						data-tooltip-id="github-tt"
						data-tooltip-content="GitHub"
						data-tooltip-place="top"
					>
						<FaGithub id="github" />
					</Link>
				</div>
				<div>
					<Tooltip id="linkedin-tt" />
					<Link
						to="https://www.linkedin.com/in/tayon"
						data-tooltip-id="linkedin-tt"
						data-tooltip-content="LinkedIn"
						data-tooltip-place="top"
					>
						<FaLinkedin id="linkedin" />
					</Link>
				</div>
				<div>
					<Tooltip id="resume-tt" />
					<a
						href={resume}
						data-tooltip-id="resume-tt"
						data-tooltip-content="Resume"
						data-tooltip-place="top"
						className="resume-button"
						download="Williams, Tayon SWE.pdf"
					>
						<GrDocumentPdf id="resume" />
					</a>
				</div>
			</div>
			{/* <div id="middle-profile-footer"></div> */}
			<div className="footer-text">MEN CRY TOO COPYRIGHT 2024</div>
		</div>
	);
};

export default Footer;
