import React from "react";
import { useSelector } from "react-redux";
import { RootState, PrivateRouteProps } from "../../types";

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
	const sessionUser = useSelector((state: RootState) => state.session.user);

	if (!sessionUser) {
		window.location.href = "/";
		return null; // Return null while redirecting
	}

	return <>{children}</>;
};

export default PrivateRoute;
