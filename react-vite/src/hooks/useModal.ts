import { useContext } from "react";
import { ModalContextType } from "../types";
import { ModalContext } from "./modalContext";

// Custom hook to access modal context
export const useModal = (): ModalContextType => {
	const context = useContext(ModalContext);
	// Throw error if hook is used outside of ModalProvider
	if (!context) {
		throw new Error("useModal must be used within a ModalProvider");
	}
	return context;
};
