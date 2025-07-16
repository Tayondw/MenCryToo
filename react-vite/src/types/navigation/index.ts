export interface OpenModalMenuItemProps {
	itemText: string;
	onItemClick?: () => void;
	modalComponent: React.ReactElement;
	className?: string;
}

export interface LogoProps {
      className?: string;
      size?: "sm" | "md" | "lg";
}