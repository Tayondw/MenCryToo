import { Link, Outlet } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import { useSelector } from "react-redux";
import OpenModalButton from "../../OpenModalButton";
import SignupFormModal from "../../SignupFormModal";
import Footer from "../../Footer";
import "./NotAuthHome.css";

function HeroSection() {
	return (
		<div className="hero-section centered">
			<div className="w-layout-blockcontainer container centered">
				<div style={{ opacity: 1 }} className="container w-container">
					<h1 className="hero-heading">MEN CRY TOO</h1>
					<div className="hero-subheading">IT&apos;s OKAY TO CRY</div>
				</div>
				<div className="w-layout-blockcontainer container-2 w-container">
					<div>
						<h4 className="heading-3">Take control of your mental health.</h4>
					</div>
					<div className="div-block">
						<Link to="/mental-inspection" className="button">
							TAKE INSPECTION
						</Link>
						<Link to="/profile-feed" className="hollow-button all-caps">
							FIND SOMEONE LIKE YOU
						</Link>
					</div>
				</div>
			</div>
			<Outlet />
		</div>
	);
}

function SectionOne() {
	const { allTags } = useLoaderData();
	return (
		<div className="section">
			<div className="w-container-tag-div">
				<div className="section-title-group">
					<h2 className="section-heading centered">GETLEMENTAL HEALTH 401</h2>
					<div className="section-subheading center">
						what a man has to know about mental health.
					</div>
				</div>
				<div className="div-block-2">
					{allTags.tags.map((tag) => (
						<Link
							to={`/tags/${tag.id}/${tag.name}`}
							key={tag.id}
							className="w-button"
						>
							{tag.name}
						</Link>
					))}
				</div>
			</div>
			<div className="w-container">
				<div className="section-title-group">
					<h2 className="section-heading centered">
						GET SUPPORT CLOSE TO HOME
					</h2>
					<div className="section-subheading center">
						LET&apos;S FIND GROUPS OR EVENTS NEAR YOU!
					</div>
				</div>
				<div className="w-row">
					<div className="w-col w-col-6">
						<div style={{ opacity: 1 }} className="white-box">
							<h3>FIND GROUPS</h3>
							<p>
								Lorem ipsum dolor sit amet, consectetur adipiscing elit.
								Suspendisse varius enim in eros elementum tristique.
							</p>
						</div>
					</div>
					<div className="w-col w-col-6">
						<div style={{ opacity: 1 }} className="white-box">
							<h3>FIND EVENTS</h3>
							<p>
								Lorem ipsum dolor sit amet, consectetur adipiscing elit.
								Suspendisse varius enim in eros elementum tristique.
							</p>
						</div>
					</div>
				</div>
			</div>
			<Outlet />
		</div>
	);
}

function SectionTwo() {
	return (
		<section className="section-2">
			<div style={{ opacity: 1 }} className="container bottom w-container">
				<h2 className="heading-2 bottom">Its not you, it&apos;s them</h2>
				<h1 className="heading bottom">WORRIED ABOUT SOMEONE?</h1>
				<div className="div-block">
					<a href="#" className="button">
						LET US HELP
					</a>
				</div>
			</div>
			<Outlet />
		</section>
	);
}

function AccentSection() {
	return (
		<div className="section2 accent">
			<div className="w-container">
				<div className="section-title-group">
					<div className="section-subheading center off-white"></div>
				</div>
				<div className="w-row">
					<div className="w-col w-col-6">
						<div className="white-box transparent">
							<img
								src="https://mencrytoo.s3.amazonaws.com/MENCRYTOO.PNG"
								sizes="(max-width: 479px) 85vw, (max-width: 767px) 88vw, (max-width: 991px) 324px, 430px"
								srcSet="https://mencrytoo.s3.amazonaws.com/MENCRYTOO.PNG 500w, https://mencrytoo.s3.amazonaws.com/MENCRYTOO.PNG 1080w, https://mencrytoo.s3.amazonaws.com/MENCRYTOO.PNG 1300w"
								alt=""
								className="fullwidth-image"
							/>
							<h3 className="white-text">ABOUT MEN CRY TOO</h3>
							<p className="white-text">
								Lorem ipsum dolor sit amet, consectetur adipiscing elit.
								Suspendisse varius enim in eros elementum tristique.
							</p>
							<Link to="/about" className="hollow-button">
								Learn more
							</Link>
						</div>
					</div>
					<div className="w-col w-col-6">
						<div className="white-box transparent">
							<img
								src="https://mencrytoo.s3.amazonaws.com/MENCRYTOO4.jpg"
								sizes="(max-width: 479px) 85vw, (max-width: 767px) 88vw, (max-width: 991px) 324px, 430px"
								srcSet="https://mencrytoo.s3.amazonaws.com/MENCRYTOO4.jpg 1080w, https://mencrytoo.s3.amazonaws.com/MENCRYTOO4.jpg 1300w"
								alt=""
								className="fullwidth-image"
							/>
							<h3 className="white-text">PARTNERSHIP</h3>
							<p className="white-text">
								Lorem ipsum dolor sit amet, consectetur adipiscing elit.
								Suspendisse varius enim in eros elementum tristique.
							</p>
							<Link to="/partnership" className="hollow-button all-caps">
								GET STARTED
							</Link>
						</div>
					</div>
				</div>
			</div>
			<Outlet />
		</div>
	);
}

const NotAuthHome = () => {
	const sessionUser = useSelector((state) => state.session.user);
	return (
		<>
			<HeroSection />
			<SectionOne />
			<SectionTwo />
			<AccentSection />
			<div id="section-4">
				{sessionUser ? null : (
					<OpenModalButton
						buttonText="Join Us"
						style={{
							background: `#223f5c`,
							width: `200px`,
							cursor: `pointer`,
							borderRadius: `4px`,
							color: `#fff`,
							textAlign: `center`,
							letterSpacing: `2px`,
							textTransform: `uppercase`,
							marginLeft: `10px`,
							marginRight: `10px`,
							padding: `12px 30px`,
							fontSize: `16px`,
							fontWeight: 600,
							lineHeight: `21px`,
							textDecoration: `none`,
							transition: `background-color 0.3s`,
							display: `inline-block`,
							border: 0,
						}}
						modalComponent={<SignupFormModal />}
					/>
				)}
			</div>
			<Footer />
		</>
	);
};

export default NotAuthHome;
