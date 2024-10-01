import { useState, useEffect, useRef, useCallback } from "react";
import OpenModalButton from "../../OpenModalButton";
import DeletePost from "../CRUD/Delete";
import { FaEllipsis } from "react-icons/fa6";
import "./PostMenu.css";

const PostMenu = ({ navigate, post }) => {
	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef();
	const toggleMenu = useCallback((e) => {
		e.stopPropagation();
		setShowMenu((prev) => !prev);
	}, []);
	const closeMenu = useCallback(() => {
		setShowMenu(false);
	}, []);

	useEffect(() => {
		if (!showMenu) return;
		const handleClickOutside = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu();
		};
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, [showMenu, closeMenu]);

	return (
		<div className="post-menu" ref={menuRef}>
			<button className="post-button" onClick={toggleMenu}>
				<FaEllipsis />
			</button>
			{showMenu && (
				<div className="post-dropdown">
					<OpenModalButton
						className="logout"
						buttonText="Edit Post"
						onButtonClick={() => {
							closeMenu();
							navigate(`/posts/${post.id}/edit`);
						}}
						style={{
							color: `#223f5c`,
							backgroundColor: `#FAF5E4`,
						}}
					/>
					<OpenModalButton
						className="logout"
						buttonText="Delete Post"
						onButtonClick={() => {
							closeMenu();
						}}
						modalComponent={<DeletePost post={post} navigate={navigate} />}
						style={{
							color: `#223f5c`,
							backgroundColor: `#FAF5E4`,
						}}
					/>
				</div>
			)}
		</div>
	);
};

export default PostMenu;
