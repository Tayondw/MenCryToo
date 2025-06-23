import React from "react";

interface LogoProps {
	className?: string;
	size?: "sm" | "md" | "lg";
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "md" }) => {
	const sizeClasses = {
		sm: "w-8 h-8",
		md: "w-10 h-10",
		lg: "w-12 h-12",
	};

	return (
		<div className={`${sizeClasses[size]} ${className} relative`}>
			<svg
				viewBox="0 0 40 40"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="w-full h-full"
			>
				{/* Background Circle with Gradient */}
				<defs>
					<linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#f59e0b" />
						<stop offset="100%" stopColor="#d97706" />
					</linearGradient>
					<linearGradient
						id="heartGradient"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#ffffff" />
						<stop offset="100%" stopColor="#f8fafc" />
					</linearGradient>
					<filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
						<feDropShadow
							dx="0"
							dy="2"
							stdDeviation="2"
							floodColor="#000000"
							floodOpacity="0.1"
						/>
					</filter>
				</defs>

				{/* Main Circle Background */}
				<circle
					cx="20"
					cy="20"
					r="18"
					fill="url(#logoGradient)"
					filter="url(#dropShadow)"
					className="drop-shadow-lg"
				/>

				{/* Inner Circle for Depth */}
				<circle
					cx="20"
					cy="20"
					r="15"
					fill="none"
					stroke="rgba(255,255,255,0.2)"
					strokeWidth="0.5"
				/>

				{/* Heart Symbol - Representing Emotional Care */}
				<path
					d="M20 28c-1.5-1.2-6-4.8-6-9 0-2.2 1.8-4 4-4 1.1 0 2.1.4 2.8 1.2.7-.8 1.7-1.2 2.8-1.2 2.2 0 4 1.8 4 4 0 4.2-4.5 7.8-6 9z"
					fill="url(#heartGradient)"
					className="drop-shadow-sm"
				/>

				{/* Tear Drop - Representing "It's Okay to Cry" */}
				<ellipse
					cx="26"
					cy="14"
					rx="1.5"
					ry="2.5"
					fill="rgba(255,255,255,0.9)"
					className="animate-pulse"
					style={{
						animationDuration: "3s",
						animationDelay: "1s",
					}}
				/>

				{/* Supporting Hands - Representing Community Support */}
				<path
					d="M12 22c-1 0-2 .5-2 1.5s1 1.5 2 1.5h2v-3h-2z"
					fill="rgba(255,255,255,0.8)"
				/>
				<path
					d="M28 22c1 0 2 .5 2 1.5s-1 1.5-2 1.5h-2v-3h2z"
					fill="rgba(255,255,255,0.8)"
				/>

				{/* Subtle "M" Integration */}
				<path
					d="M16 12v4l2-2 2 2v-4"
					stroke="rgba(255,255,255,0.6)"
					strokeWidth="1"
					fill="none"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</div>
	);
};

export default Logo;
