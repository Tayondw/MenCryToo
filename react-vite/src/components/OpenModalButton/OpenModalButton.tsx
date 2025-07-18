import React, { useState, useEffect } from "react";
import { OpenModalButtonProps } from "../../types";

const OpenModalButton: React.FC<OpenModalButtonProps> = ({
	buttonText,
	modalComponent,
	onButtonClick,
	className = "",
	style = {},
	children,
}) => {
	const [showModal, setShowModal] = useState(false);

	const handleClick = () => {
		if (onButtonClick) {
			onButtonClick();
		} else if (modalComponent) {
			setShowModal(true);
		}
	};

	const closeModal = () => {
		setShowModal(false);
	};

	// Close modal on Escape key
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closeModal();
			}
		};

		if (showModal) {
			document.addEventListener("keydown", handleEscape);
			// Prevent body scroll when modal is open
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "unset";
		};
	}, [showModal]);

	return (
		<>
			<button className={className} style={style} onClick={handleClick}>
				{children || buttonText}
			</button>

			{showModal && modalComponent && (
				<div
					className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
					onClick={closeModal}
				>
					<div
						className="relative max-h-[90vh] overflow-auto"
						onClick={(e) => e.stopPropagation()}
					>
						{React.cloneElement(modalComponent, { onClose: closeModal })}
					</div>
				</div>
			)}
		</>
	);
};

export default OpenModalButton;
