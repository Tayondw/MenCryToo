import { Link, Outlet } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import "./NotAuthHome.css";

function HeroSection() {
	return (
		<div className="hero-section centered">
			<div className="w-layout-blockcontainer container centered">
				<div
					data-w-id="1714dcca-e24e-17c8-e9ad-979ea4c1c526"
					style={{ opacity: 1 }}
					className="container w-container"
				>
					<h1 data-ix="fade-in-bottom-page-loads" className="hero-heading">
						MEN CRY TOO
					</h1>
					<div data-ix="fade-in-bottom-page-loads" className="hero-subheading">
						IT&apos;s OKAY TO CRY
					</div>
				</div>
				<div className="w-layout-blockcontainer container-2 w-container">
					<div>
						<h4 className="heading-3">Take control of your mental health.</h4>
					</div>
					<div data-ix="fade-in-bottom-page-loads" className="div-block">
						<Link to="/mental-inspection" className="button">
							TAKE INSPECTION
						</Link>
						<Link to="/profile-feed" className="hollow-button all-caps">
							FIND SOMEONE LIKE YOU
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

function SectionOne() {
	const { allTags } = useLoaderData();
	console.log("here", allTags);
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
						<Link to={`/tags/${tag.id}/${tag.name}`} key={tag.id} className="w-button">
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
						<div
							data-w-id="270e8437-efa3-df11-d438-de69b23e41e9"
							style={{ opacity: 1 }}
							className="white-box"
						>
							<h3>FIND GROUPS</h3>
							<p>
								Lorem ipsum dolor sit amet, consectetur adipiscing elit.
								Suspendisse varius enim in eros elementum tristique.
							</p>
						</div>
					</div>
					<div className="w-col w-col-6">
						<div
							data-w-id="29c25774-570b-ddb2-69b5-f4ddbb194afd"
							style={{ opacity: 1 }}
							className="white-box"
						>
							<h3>FIND EVENTS</h3>
							<p>
								Lorem ipsum dolor sit amet, consectetur adipiscing elit.
								Suspendisse varius enim in eros elementum tristique.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function SectionTwo() {
	return (
		<section className="section-2">
			<div
				data-w-id="e464d218-f801-55d1-1f50-7da00b5bfb8f"
				style={{ opacity: 1 }}
				className="container bottom w-container"
			>
				<h2 className="heading-2 bottom">Its not me, it&apos;s you</h2>
				<h1 className="heading bottom">WORRIED ABOUT SOMEONE?</h1>
				<div data-ix="fade-in-bottom-page-loads" className="div-block">
					<a href="#" className="button">
						LET US HELP
					</a>
				</div>
			</div>
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
								src="images/city-scape.jpg"
								sizes="(max-width: 479px) 85vw, (max-width: 767px) 88vw, (max-width: 991px) 324px, 430px"
								srcSet="images/city-scape-p-500x334.jpeg 500w, images/city-scape-p-1080x721.jpeg 1080w, images/city-scape.jpg 1300w"
								alt=""
								className="fullwidth-image"
							/>
							<h3 className="white-text">ABOUT MEN CRY TOO</h3>
							<p className="white-text">
								Lorem ipsum dolor sit amet, consectetur adipiscing elit.
								Suspendisse varius enim in eros elementum tristique.
							</p>
							<a href="#" className="hollow-button">
								Learn more
							</a>
						</div>
					</div>
					<div className="w-col w-col-6">
						<div className="white-box transparent">
							<img
								src="images/photo-1416400639808-f41f0c149b09.jpg"
								sizes="(max-width: 479px) 85vw, (max-width: 767px) 88vw, (max-width: 991px) 324px, 430px"
								srcSet="images/photo-1416400639808-f41f0c149b09-p-1080x721.jpeg 1080w, images/photo-1416400639808-f41f0c149b09.jpg 1300w"
								alt=""
								className="fullwidth-image"
							/>
							<h3 className="white-text">PARTNERSHIP</h3>
							<p className="white-text">
								Lorem ipsum dolor sit amet, consectetur adipiscing elit.
								Suspendisse varius enim in eros elementum tristique.
							</p>
							<a href="#" className="hollow-button all-caps">
								GET STARTED
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

const NotAuthHome = () => {
	return (
		<>
			<HeroSection />
			<SectionOne />
			<SectionTwo />
			<AccentSection />
			<Outlet />
		</>
	);
};

export default NotAuthHome;
