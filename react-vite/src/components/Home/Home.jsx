import { Link, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const Home = () => {
	const sessionUser = useSelector((state) => state.session.user);

	return (
		<div id="home-page">
			<div className="hero-section centered">
				<div className="w-layout-blockcontainer container centered w-container">
					<div
						data-w-id="1714dcca-e24e-17c8-e9ad-979ea4c1c526"
						style={{opacity: 0}}
						className="container w-container"
					>
						<h1 data-ix="fade-in-bottom-page-loads" className="hero-heading">
							MEN CRY TOO
						</h1>
						<div
							data-ix="fade-in-bottom-page-loads"
							className="hero-subheading"
						>
							It&#x27;s OKAY TO CRY
						</div>
					</div>
					<div className="w-layout-blockcontainer container-2 w-container">
						<div>
							<h4 className="heading-3">Take control of your mental health.</h4>
						</div>
						<div data-ix="fade-in-bottom-page-loads" className="div-block">
							<a href="#" className="button">
								TAKE INSPECTION
							</a>
							<a href="#" className="hollow-button all-caps">
								FIND SOMEONE LIKE YOU
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Home;
