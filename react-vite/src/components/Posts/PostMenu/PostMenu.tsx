import React, { useState, useEffect, useRef, useCallback } from "react";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { PostMenuProps } from "../../../types";
import DeletePost from "../CRUD/Delete/DeletePost";

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
		},
		[closeMenu],
	);

	const closeDeleteModal = useCallback(() => {
		setShowDeleteModal(false);
	}, []);

	// Handle clicking outside the modal to close it
	const handleModalOverlayClick = useCallback(
		(e: React.MouseEvent) => {
			// Only close if clicking on the overlay itself, not the modal content
			if (e.target === e.currentTarget) {
				closeDeleteModal();
			}
		},
		[closeDeleteModal],
	);

	// Handle escape key to close modal
	useEffect(() => {
		if (!showDeleteModal) return;

		const handleEscapeKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				closeDeleteModal();
			}
		};

		document.addEventListener("keydown", handleEscapeKey);
		return () => document.removeEventListener("keydown", handleEscapeKey);
	}, [showDeleteModal, closeDeleteModal]);

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
			<div className="relative" ref={menuRef}>
				{/* Post Menu Button */}
				<button
					className="bg-transparent border-none text-gray-600 cursor-pointer p-2 rounded-xl transition-all duration-200 ease-in-out flex items-center justify-center w-10 h-10 flex-shrink-0 hover:bg-gray-200 hover:text-orange-500 hover:scale-105 focus:outline-2 focus:outline-orange-500 focus:outline-offset-2"
					onClick={toggleMenu}
					aria-label="Post options"
					aria-expanded={showMenu}
				>
					<MoreHorizontal size={20} />
				</button>

				{showMenu && (
					<div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-[1000] min-w-[160px] overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
						<button
							className="flex items-center gap-4 w-full px-6 py-4 border-none bg-transparent cursor-pointer text-sm font-semibold transition-all duration-200 ease-in-out text-left border-b border-gray-200 last:border-b-0 focus:outline-none text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:translate-x-0.5"
							onClick={handleEditPost}
							aria-label="Edit post"
						>
							<Edit size={16} className="flex-shrink-0" />
							<span>Edit Post</span>
						</button>

						<button
							className="flex items-center gap-4 w-full px-6 py-4 border-none bg-transparent cursor-pointer text-sm font-semibold transition-all duration-200 ease-in-out text-left border-b border-gray-200 last:border-b-0 focus:outline-none text-red-500 hover:bg-red-50 hover:text-red-700 hover:translate-x-0.5"
							onClick={handleDeletePost}
							aria-label="Delete post"
						>
							<Trash2 size={16} className="flex-shrink-0" />
							<span>Delete Post</span>
						</button>
					</div>
				)}
			</div>

			{/* Delete Confirmation Modal */}
			{showDeleteModal && (
				<div
					className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-6 animate-in fade-in-0 duration-200"
					onClick={handleModalOverlayClick}
				>
					<div
						className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300"
						onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on modal content
					>
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
