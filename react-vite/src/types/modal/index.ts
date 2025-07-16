import { ReactNode } from "react";

// Define the shape of the modal context
export interface ModalContextType {
      modalContent: ReactNode | null; // React component to render inside modal
      setModalContent: (content: ReactNode | null) => void; // function to set the React component to render inside modal
      closeModal: () => void; // function to close the modal
}

// Props interface for ModalProvider component
export interface ModalProviderProps {
      children: ReactNode;
}

export interface OpenModalButtonProps {
      buttonText: string;
      modalComponent?: React.ReactElement;
      onButtonClick?: () => void;
      className?: string;
      style?: React.CSSProperties;
      children?: React.ReactNode;
}