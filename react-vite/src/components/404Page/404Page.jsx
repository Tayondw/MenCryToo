import { Link } from "react-router-dom";
import "./404Page.css";

const FourZeroFourPage = () => {
	return (
		<div id="error-page">
			<h1 id="error-page-header">404 Page not found</h1>
			<p id="error-page-p">
				Not all those who wander are lost, but it seems you may have taken a
				wrong turn.
			</p>
			<Link to="/">
				<button id="update-group-cancel">HOME</button>
			</Link>
		</div>
	);
};

export default FourZeroFourPage;
