import React, { useState } from "react";

interface OpenModalButtonProps {
	buttonText: string;
	modalComponent?: React.ReactElement;
	onButtonClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
	children?: React.ReactNode;
}

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

	return (
		<>
			<button className={className} style={style} onClick={handleClick}>
				{children || buttonText}
			</button>

			{showModal && modalComponent && (
				<div className="modal-overlay" onClick={closeModal}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						{React.cloneElement(modalComponent, { onClose: closeModal })}
					</div>
				</div>
			)}
		</>
	);
};

export default OpenModalButton;
