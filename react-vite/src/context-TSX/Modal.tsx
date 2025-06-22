import React, { createContext, useContext, useState, ReactNode } from "react";
import "./Modal.css";

interface ModalContextType {
	modalContent: ReactNode | null;
	setModalContent: (content: ReactNode | null) => void;
	closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = (): ModalContextType => {
	const context = useContext(ModalContext);
	if (!context) {
		throw new Error("useModal must be used within a ModalProvider");
	}
	return context;
};

interface ModalProviderProps {
	children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
	const [modalContent, setModalContent] = useState<ReactNode | null>(null);

	const closeModal = () => {
		setModalContent(null);
	};

	return (
		<ModalContext.Provider
			value={{ modalContent, setModalContent, closeModal }}
		>
			{children}
			{modalContent && (
				<div id="modal">
					<div id="modal-background" onClick={closeModal} />
					<div id="modal-content">{modalContent}</div>
				</div>
			)}
		</ModalContext.Provider>
	);
};
