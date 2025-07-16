import { createContext } from "react";
import { ModalContextType } from "../types";

// Create the modal context with undefined as default
export const ModalContext = createContext<ModalContextType | undefined>(
	undefined,
);
