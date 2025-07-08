import React, { useState } from "react";
import {
	MessageCircle,
	Heart,
	MoreHorizontal,
	Edit3,
	Trash2,
	Reply,
	ChevronDown,
	ChevronRight,
	AtSign,
} from "lucide-react";
import {
	formatCommentTime,
	canModifyComment,
	extractMentionFromComment,
} from "../../../utils/commentUtils";
import CommentForm from "../CommentForm";
import type {
	CommentThreadProps,
} from "../../../types/comments";

const CommentThread: React.FC<CommentThreadProps> = ({
	comment,
	depth = 0,
	maxDepth = 5,
	onReply,
	onEdit,
	onDelete,
	currentUserId,
}) => {
	const [isReplying, setIsReplying] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editText, setEditText] = useState(comment.comment);
	const [showReplies, setShowReplies] = useState(true);
	const [showMenu, setShowMenu] = useState(false);
	const [isLiked, setIsLiked] = useState(false);
	const [likeCount, setLikeCount] = useState(0);
	const [showAllReplies, setShowAllReplies] = useState(false);

	const canModify = canModifyComment(comment, currentUserId);
	const hasReplies = comment.replies && comment.replies.length > 0;
	const shouldNestReplies = depth < maxDepth;
	const mentionedUser = extractMentionFromComment(comment.comment);

	// Reply visibility logic
	const maxVisibleReplies = 2;
	const hasMoreReplies =
		comment.replies && comment.replies.length > maxVisibleReplies;
	const visibleReplies = showAllReplies
		? comment.replies
		: comment.replies?.slice(0, maxVisibleReplies);

	// Handle reply submission
	const handleReplySubmit = async () => {
		try {
			// Call the parent's onReply function
			await onReply(comment.id, comment.commenter?.username || "");
			setIsReplying(false);
		} catch (error) {
			console.error("Error submitting reply:", error);
			throw error;
		}
	};

	// Handle edit submission
	const handleEditSubmit = async () => {
		if (editText.trim() === comment.comment) {
			setIsEditing(false);
			return;
		}

		try {
			await onEdit(comment.id, editText.trim());
			setIsEditing(false);
		} catch (error) {
			console.error("Error editing comment:", error);
			setEditText(comment.comment); // Reset on error
		}
	};

	// Handle delete
	const handleDelete = async () => {
		if (window.confirm("Are you sure you want to delete this comment?")) {
			try {
				await onDelete(comment.id);
			} catch (error) {
				console.error("Error deleting comment:", error);
			}
		}
		setShowMenu(false);
	};

	// Handle like toggle
	const handleLikeToggle = async () => {
		try {
			// Optimistic update
			setIsLiked(!isLiked);
			setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

			// TODO: Call API to toggle like
			// await commentApi.toggleCommentLike(comment.id);
		} catch (error) {
			// Revert on error
			setIsLiked(isLiked);
			setLikeCount(likeCount);
			console.error("Error toggling like:", error);
		}
	};

	return (
		<div className={`comment-thread ${depth > 0 ? "ml-8" : ""}`}>
			<div className="flex gap-3 group">
				{/* Avatar */}
				<div className="flex-shrink-0">
					<img
						src={comment.commenter?.profileImage || "/default-avatar.png"}
						alt={comment.commenter?.username}
						className="w-8 h-8 rounded-full object-cover border border-gray-200"
					/>
				</div>

				{/* Comment content */}
				<div className="flex-1 min-w-0">
					{/* Header */}
					<div className="flex items-center gap-2 mb-1">
						<span className="font-semibold text-gray-900 text-sm">
							{comment.commenter?.firstName} {comment.commenter?.lastName}
						</span>
						<span className="text-gray-500 text-sm">
							@{comment.commenter?.username}
						</span>
						<span className="text-gray-400 text-xs">
							{formatCommentTime(comment.createdAt)}
						</span>

						{/* Actions menu */}
						{canModify && (
							<div className="relative ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									onClick={() => setShowMenu(!showMenu)}
									className="p-1 hover:bg-gray-100 rounded-full transition-colors"
								>
									<MoreHorizontal size={14} />
								</button>

								{showMenu && (
									<div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
										<button
											onClick={() => {
												setIsEditing(true);
												setShowMenu(false);
											}}
											className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
										>
											<Edit3 size={14} />
											Edit
										</button>
										<button
											onClick={handleDelete}
											className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
										>
											<Trash2 size={14} />
											Delete
										</button>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Comment text */}
					<div className="mb-2">
						{isEditing ? (
							<div className="space-y-2">
								<textarea
									value={editText}
									onChange={(e) => setEditText(e.target.value)}
									className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
									rows={2}
									autoFocus
								/>
								<div className="flex items-center gap-2">
									<button
										onClick={handleEditSubmit}
										disabled={!editText.trim()}
										className="px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:bg-gray-300"
									>
										Save
									</button>
									<button
										onClick={() => {
											setIsEditing(false);
											setEditText(comment.comment);
										}}
										className="px-3 py-1 text-gray-600 text-sm hover:text-gray-800"
									>
										Cancel
									</button>
								</div>
							</div>
						) : (
							<div className="text-gray-800 text-sm leading-relaxed">
								{mentionedUser && (
									<span className="inline-flex items-center gap-1 text-orange-600 font-medium mr-1">
										<AtSign size={12} />
										{mentionedUser}
									</span>
								)}
								<span>
									{mentionedUser
										? comment.comment.replace(`@${mentionedUser}`, "").trim()
										: comment.comment}
								</span>
							</div>
						)}
					</div>

					{/* Action buttons */}
					{!isEditing && (
						<div className="flex items-center gap-4 text-xs text-gray-500">
							<button
								onClick={handleLikeToggle}
								className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
									isLiked ? "text-red-500" : ""
								}`}
							>
								<Heart size={12} fill={isLiked ? "currentColor" : "none"} />
								{likeCount > 0 && <span>{likeCount}</span>}
							</button>

							<button
								onClick={() => setIsReplying(true)}
								className="flex items-center gap-1 hover:text-orange-500 transition-colors"
							>
								<Reply size={12} />
								Reply
							</button>

							{hasReplies && (
								<button
									onClick={() => setShowReplies(!showReplies)}
									className="flex items-center gap-1 hover:text-blue-500 transition-colors"
								>
									{showReplies ? (
										<ChevronDown size={12} />
									) : (
										<ChevronRight size={12} />
									)}
									{comment.replies?.length}{" "}
									{comment.replies?.length === 1 ? "reply" : "replies"}
								</button>
							)}
						</div>
					)}

					{/* Reply form */}
					{isReplying && (
						<div className="mt-3">
							<CommentForm
								postId={comment.postId}
								parentId={comment.id}
								replyToUsername={comment.commenter?.username}
								onSubmit={handleReplySubmit}
								onCancel={() => setIsReplying(false)}
								placeholder={`Reply to @${comment.commenter?.username}...`}
								autoFocus
							/>
						</div>
					)}

					{/* Nested replies */}
					{hasReplies && showReplies && shouldNestReplies && (
						<div className="mt-3 space-y-3">
							{/* Show limited replies initially */}
							{visibleReplies?.map((reply) => (
								<CommentThread
									key={reply.id}
									comment={reply}
									depth={depth + 1}
									maxDepth={maxDepth}
									onReply={onReply}
									onEdit={onEdit}
									onDelete={onDelete}
									currentUserId={currentUserId}
								/>
							))}

							{/* Show more/less replies buttons */}
							{hasMoreReplies && (
								<div className="mt-2">
									{!showAllReplies ? (
										<button
											onClick={() => setShowAllReplies(true)}
											className="text-sm text-orange-600 hover:text-orange-700 font-medium"
										>
											View {comment.replies!.length - maxVisibleReplies} more
											replies
										</button>
									) : (
										<button
											onClick={() => setShowAllReplies(false)}
											className="text-sm text-gray-600 hover:text-gray-700 font-medium"
										>
											Show less
										</button>
									)}
								</div>
							)}
						</div>
					)}

					{/* Show replies as flat list if max depth reached */}
					{hasReplies && showReplies && !shouldNestReplies && (
						<div className="mt-3 p-3 bg-gray-50 rounded-lg">
							<div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
								<MessageCircle size={12} />
								{comment.replies?.length} more{" "}
								{comment.replies?.length === 1 ? "reply" : "replies"}
							</div>
							<div className="space-y-2">
								{comment.replies?.slice(0, 3).map((reply) => (
									<div key={reply.id} className="text-sm">
										<span className="font-medium text-gray-900">
											@{reply.commenter?.username}
										</span>
										<span className="text-gray-700 ml-2">{reply.comment}</span>
									</div>
								))}
								{comment.replies && comment.replies.length > 3 && (
									<button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
										View all {comment.replies.length} replies
									</button>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Click outside handler for menu */}
			{showMenu && (
				<div className="fixed inset-0 z-5" onClick={() => setShowMenu(false)} />
			)}
		</div>
	);
};

export default CommentThread;