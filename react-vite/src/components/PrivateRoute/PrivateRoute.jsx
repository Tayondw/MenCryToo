import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PrivateRoute = ({ children }) => {
	const sessionUser = useSelector((state) => state.session.user);

	if (!sessionUser) {
            return <Navigate to="/" replace />;
            // window.location.href = "/"
	}

	return children;
};

export default PrivateRoute;
