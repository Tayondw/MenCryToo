import React, { useState, ReactNode } from "react";
import { ModalContext } from "../hooks/modalContext";
import "./Modal.css";

// Define the shape of the modal context
export interface ModalContextType {
	modalContent: ReactNode | null; // React component to render inside modal
	setModalContent: (content: ReactNode | null) => void; // function to set the React component to render inside modal
	closeModal: () => void; // function to close the modal
}

// Props interface for ModalProvider component
interface ModalProviderProps {
	children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
	// State to track what content should be displayed in the modal
	const [modalContent, setModalContent] = useState<ReactNode | null>(null);

	// Function to close the modal by clearing its content
	const closeModal = () => {
		setModalContent(null); // clear the modal contents
	};

	return (
		<ModalContext.Provider
			value={{ modalContent, setModalContent, closeModal }}
		>
			{children}
			{/* Conditionally render modal if modalContent exists */}
			{modalContent && (
				<div id="modal">
					{/* Background overlay that closes modal when clicked */}
					<div id="modal-background" onClick={closeModal} />
					{/* Container for the actual modal content */}
					<div id="modal-content">{modalContent}</div>
				</div>
			)}
		</ModalContext.Provider>
	);
};
