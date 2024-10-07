import { Link } from "react-router-dom";
import "./Success.css";

const Success = () => {
	return (
		<div id="success">
			<h1 id="success-header">
				Thank you for getting in touch! We appreciate you contacting us. One of
				our colleagues will get back in touch with you soon!
			</h1>
			<Link to="/">
				<button id="update-group-cancel">HOME</button>
			</Link>
		</div>
	);
};

export default Success;
