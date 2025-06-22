import React from "react";
import { useModal } from "../../../context-TSX/Modal";

interface OpenModalMenuItemProps {
	itemText: string;
	onItemClick?: () => void;
	modalComponent: React.ReactElement;
	className?: string;
}

const OpenModalMenuItem: React.FC<OpenModalMenuItemProps> = ({
	itemText,
	onItemClick,
	modalComponent,
	className = "",
}) => {
	const { setModalContent } = useModal();

	const handleClick = () => {
		if (onItemClick) {
			onItemClick();
		}
		setModalContent(modalComponent);
	};

	return (
		<span onClick={handleClick} className={className}>
			{itemText}
		</span>
	);
};

export default OpenModalMenuItem;
