// import { Navigate } from "react-router-dom";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../types";

interface PrivateRouteProps {
	children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
	const sessionUser = useSelector((state: RootState) => state.session.user);

	if (!sessionUser) {
		// return <Navigate to="/" replace={true} />;
		window.location.href = "/";
		return null; // Return null while redirecting
	}

	return <>{children}</>;
};

export default PrivateRoute;
