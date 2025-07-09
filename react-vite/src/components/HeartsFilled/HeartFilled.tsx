import React from "react";

interface HeartFilledProps {
	size?: number;
	className?: string;
	color?: string;
}

const HeartFilled: React.FC<HeartFilledProps> = ({
	size = 24,
	className = "",
	color = "currentColor",
}) => {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color}
			className={className}
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
				fill={color}
			/>
		</svg>
	);
};

export default HeartFilled;
