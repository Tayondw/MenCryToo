import React, { Suspense } from "react";
import PageLoader from "../PageLoader";
import { SuspenseWrapperProps } from "../../types";

const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({ children }) => (
	<Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export default SuspenseWrapper;
