import React, { useState, useEffect, useRef, useCallback } from "react";
import { Edit3, Edit, Trash2 } from "lucide-react";
import { Post } from "../../../types";
import DeletePost from "../CRUD-TSX/Delete/Delete";
import "./PostMenu.css";

interface PostMenuProps {
	navigate: (path: string) => void;
	post: Post;
}

const PostMenu: React.FC<PostMenuProps> = ({ navigate, post }) => {
	const [showMenu, setShowMenu] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const toggleMenu = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setShowMenu((prev) => !prev);
	}, []);

	const closeMenu = useCallback(() => {
		setShowMenu(false);
	}, []);

	const handleEditPost = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			closeMenu();
			navigate(`/posts/${post.id}/edit`);
		},
		[navigate, post.id, closeMenu],
	);

	const handleDeletePost = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			closeMenu();
			setShowDeleteModal(true);
			// if (window.confirm("Are you sure you want to delete this post?")) {
			// 	// Add your delete logic here
			// 	console.log("Deleting post:", post.id);
			// }
		},
		[closeMenu],
	);

	const closeDeleteModal = useCallback(() => {
		setShowDeleteModal(false);
	}, []);

	useEffect(() => {
		if (!showMenu) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				closeMenu();
			}
		};

		const handleEscapeKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				closeMenu();
			}
		};

		document.addEventListener("click", handleClickOutside);
		document.addEventListener("keydown", handleEscapeKey);

		return () => {
			document.removeEventListener("click", handleClickOutside);
			document.removeEventListener("keydown", handleEscapeKey);
		};
	}, [showMenu, closeMenu]);

	return (
		<>
			<div className="post-menu" ref={menuRef}>
				<button
					className="post-menu-trigger"
					onClick={toggleMenu}
					aria-label="Post options"
					aria-expanded={showMenu}
				>
					<Edit3 size={20} />
				</button>

				{showMenu && (
					<div className="post-menu-dropdown">
						<button
							className="post-menu-item edit-button"
							onClick={handleEditPost}
							aria-label="Edit post"
						>
							<Edit size={16} />
							<span>Edit Post</span>
						</button>

						<button
							className="post-menu-item delete-button"
							onClick={handleDeletePost}
							aria-label="Delete post"
						>
							<Trash2 size={16} />
							<span>Delete Post</span>
						</button>
					</div>
				)}
			</div>
			{/* Delete Confirmation Modal */}
			{showDeleteModal && (
				<div className="modal-overlay">
					<div className="modal-container">
						<DeletePost
							post={post}
							navigate={navigate}
							onClose={closeDeleteModal}
						/>
					</div>
				</div>
			)}
		</>
	);
};

export default PostMenu;
