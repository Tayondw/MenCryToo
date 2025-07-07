import React, { Suspense } from "react";
import PageLoader from "../PageLoader/PageLoader";

interface SuspenseWrapperProps {
	children: React.ReactNode;
}

const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({ children }) => (
	<Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export default SuspenseWrapper;
