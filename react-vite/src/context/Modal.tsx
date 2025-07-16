import React, { useState, ReactNode } from "react";
import { ModalContext } from "../hooks/modalContext";
import { ModalProviderProps } from "../types";
import "./Modal.css";

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
