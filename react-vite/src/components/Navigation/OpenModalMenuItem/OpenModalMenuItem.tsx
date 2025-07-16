import React from "react";
import { useModal } from "../../../hooks/useModal";
import { OpenModalMenuItemProps } from "../../../types";

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
