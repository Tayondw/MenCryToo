import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import {
	MessageCircle,
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
import CommentLikeButton from "../../Likes/CommentLikesButton";
import type { Comment } from "../../../types/comments";

interface CommentThreadProps {
	comment: Comment;
	depth?: number;
	maxDepth?: number;

	// Session user data
	sessionUser?: {
		id: number;
		username: string;
		firstName?: string;
		lastName?: string;
		profileImage: string;
	} | null;

	// Post user data for mention linking
	postUser?: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		profileImage: string;
	};

	// All comments for mention linking
	allComments?: Comment[];

	// Reply state management
	replyToComment?: number | null;
	setReplyToComment?: (id: number | null) => void;
	replyText?: string;
	setReplyText?: (text: string) => void;
	isSubmitting?: boolean;

	// Show/hide replies state
	showAllReplies?: { [key: number]: boolean };
	toggleShowAllReplies?: (commentId: number) => void;

	// Action handlers - unified interface
	onReply?: (
		parentId: number,
		replyToUsername?: string,
	) => void | Promise<void>;
	onEdit?: (commentId: number, newText: string) => Promise<void>;
	onDelete?: (commentId: number) => Promise<void>;
	handleAddReply?: (parentId: number) => void | Promise<void>;

	// Like handlers
	onLikeToggle?: (
		commentId: number,
		isLiked: boolean,
		newCount: number,
	) => void;
	onShowLikes?: (commentId: number) => void;

	// Utility functions
	formatTimeAgo?: (date: string) => string;

	// Legacy props for backwards compatibility
	currentUserId?: number;
}

const CommentThread: React.FC<CommentThreadProps> = ({
	comment,
	depth = 0,
	maxDepth = 5,
	sessionUser,
	postUser,
	allComments = [],
	replyToComment,
	setReplyToComment,
	replyText = "",
	setReplyText,
	isSubmitting = false,
	showAllReplies = {},
	toggleShowAllReplies,
	onReply,
	onEdit,
	onDelete,
	handleAddReply,
	onLikeToggle,
	onShowLikes,
	formatTimeAgo,
	currentUserId,
}) => {
	// Local state for the original CommentThread functionality
	const [isReplying, setIsReplying] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editText, setEditText] = useState(comment.comment);
	const [showReplies, setShowReplies] = useState(true);
	const [showMenu, setShowMenu] = useState(false);
	const [showAllRepliesLocal, setShowAllRepliesLocal] = useState(false);

	// Like state management
	const [localLikes, setLocalLikes] = useState(comment.likes || 0);
	const [localIsLiked, setLocalIsLiked] = useState(comment.isLiked || false);

	// Determine which mode we're in based on props
	const isEnhancedMode = !!(sessionUser && setReplyToComment && handleAddReply);
	const useCurrentUserId = currentUserId || sessionUser?.id;

	const canModify = canModifyComment(comment, useCurrentUserId);
	const hasReplies = comment.replies && comment.replies.length > 0;
	const shouldNestReplies = depth < maxDepth;
	const mentionedUser = extractMentionFromComment(comment.comment);

	// Reply visibility logic
	const maxVisibleReplies = isEnhancedMode ? 0 : 2;
	const hasMoreReplies =
		comment.replies && comment.replies.length > maxVisibleReplies;

	// Use provided showAllReplies or local state
	const shouldShowAll = showAllReplies?.[comment.id] ?? showAllRepliesLocal;
	const visibleReplies = shouldShowAll
		? comment.replies
		: comment.replies?.slice(0, maxVisibleReplies);

	useEffect(() => {
		console.log("CommentThread like state initialized:", {
			commentId: comment.id,
			commentLikes: comment.likes,
			commentIsLiked: comment.isLiked,
			localLikes,
			localIsLiked,
		});
	}, [comment.id, comment.likes, comment.isLiked, localLikes, localIsLiked]);

	// Calculate proper indentation based on depth
	const getIndentationClass = useCallback((currentDepth: number) => {
		if (currentDepth === 0) return "";
		switch (currentDepth) {
			case 1:
				return "ml-12"; // 48px
			case 2:
				return "ml-16"; // 64px
			case 3:
				return "ml-20"; // 80px
			case 4:
				return "ml-24"; // 96px
			default:
				return "ml-24"; // Max indentation
		}
	}, []);

	// Stable commenter data with proper fallbacks
	const commenterData = useMemo(() => {
		if (comment.commenter) {
			return {
				id: comment.commenter.id,
				username: comment.commenter.username || "Unknown User",
				firstName: comment.commenter.firstName || "",
				lastName: comment.commenter.lastName || "",
				profileImage: comment.commenter.profileImage || "/default-avatar.png",
			};
		}

		// Fallback to comment data
		return {
			id: comment.userId,
			username: "Unknown User",
			firstName: "",
			lastName: "",
			profileImage: "/default-avatar.png",
		};
	}, [comment.commenter, comment.userId]);

	// Helper function to render comments with clickable @ mentions
	const renderCommentWithMentions = useCallback(
		(commentText: string) => {
			if (!isEnhancedMode || !postUser || !allComments.length) {
				// Fallback to simple rendering with basic mention highlighting
				const mentionRegex = /@([\w-]+)/g;
				const parts = commentText.split(mentionRegex);

				return parts.map((part, index) => {
					if (index % 2 === 1) {
						// This is a username (odd indices after split)
						return (
							<span key={index} className="text-orange-600 font-medium">
								@{part}
							</span>
						);
					}
					return part;
				});
			}

			// Rendering with clickable links
			const mentionRegex = /@([\w-]+)/g;
			const parts = [];
			let lastIndex = 0;
			let match;

			while ((match = mentionRegex.exec(commentText)) !== null) {
				// Add text before the mention
				if (match.index > lastIndex) {
					parts.push(commentText.slice(lastIndex, match.index));
				}

				// Add the clickable mention
				const username = match[1];
				let userId = null;

				// Check if it's the session user
				if (sessionUser && username === sessionUser.username) {
					userId = sessionUser.id;
				}
				// Check if it's the post creator
				else if (username === postUser.username) {
					userId = postUser.id;
				}
				// Look through comments to find matching username
				else {
					const findUserInComments = (
						commentsList: Comment[],
					): number | null => {
						for (const comment of commentsList) {
							if (comment.commenter?.username === username) {
								return comment.commenter.id;
							}
							if (comment.replies) {
								const found = findUserInComments(comment.replies);
								if (found) return found;
							}
						}
						return null;
					};
					userId = findUserInComments(allComments);
				}

				parts.push(
					<Link
						key={`mention-${match.index}`}
						to={`/users/${userId || username}`}
						className="text-orange-600 hover:text-orange-700 font-medium"
					>
						@{username}
					</Link>,
				);

				lastIndex = match.index + match[0].length;
			}

			// Add remaining text after the last mention
			if (lastIndex < commentText.length) {
				parts.push(commentText.slice(lastIndex));
			}

			return parts.length === 0 ? commentText : parts;
		},
		[isEnhancedMode, postUser, allComments, sessionUser],
	);

	// Handle reply submission for original mode
	const handleReplySubmit = async () => {
		try {
			await onReply?.(comment.id, comment.commenter?.username || "");
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
			await onEdit?.(comment.id, editText.trim());
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
				await onDelete?.(comment.id);
			} catch (error) {
				console.error("Error deleting comment:", error);
			}
		}
		setShowMenu(false);
	};

	useEffect(() => {
		if (comment.likes !== undefined) {
			console.log("Updating local likes from comment props:", {
				commentId: comment.id,
				oldLikes: localLikes,
				newLikes: comment.likes,
			});
			setLocalLikes(comment.likes);
		}
		if (comment.isLiked !== undefined) {
			console.log("Updating local isLiked from comment props:", {
				commentId: comment.id,
				oldIsLiked: localIsLiked,
				newIsLiked: comment.isLiked,
			});
			setLocalIsLiked(comment.isLiked);
		}
	}, [comment.likes, comment.isLiked, comment.id, localIsLiked, localLikes]);

	// Handle like toggle with local state management
	const handleLikeToggle = useCallback(
		async (commentId: number, isLiked: boolean, newCount: number) => {
			console.log("CommentThread handleLikeToggle called:", {
				commentId,
				isLiked,
				newCount,
			});

			// Validate the parameters
			if (commentId !== comment.id) {
				console.warn(
					"CommentThread received like toggle for different comment",
					{
						expectedId: comment.id,
						receivedId: commentId,
					},
				);
				return;
			}

			if (isLiked === undefined || newCount === undefined) {
				console.error("CommentThread received undefined like data:", {
					commentId,
					isLiked,
					newCount,
				});
				return;
			}

			// Update local state immediately for responsiveness
			setLocalIsLiked(isLiked);
			setLocalLikes(newCount);

			// Notify parent component to sync state across the app
			if (onLikeToggle) {
				console.log("CommentThread notifying parent of like toggle:", {
					commentId,
					isLiked,
					newCount,
				});
				onLikeToggle(commentId, isLiked, newCount);
			}
		},
		[comment.id, onLikeToggle],
	);

	// Handle showing likes
	const handleShowLikes = useCallback(
		(commentId: number) => {
			if (onShowLikes) {
				onShowLikes(commentId);
			}
		},
		[onShowLikes],
	);

	// Handle reply button click in enhanced mode
	const handleEnhancedReplyClick = () => {
		if (setReplyToComment && setReplyText) {
			setReplyToComment(comment.id);
			// Pre-populate reply with mention
			if (!replyText.includes(`@${commenterData.username}`)) {
				setReplyText(`@${commenterData.username} `);
			}
		}
	};

	// Handle toggle show all replies
	const handleToggleShowAllReplies = () => {
		if (toggleShowAllReplies) {
			toggleShowAllReplies(comment.id);
		} else {
			setShowAllRepliesLocal(!showAllRepliesLocal);
		}
	};

	// Format time based on available formatter
	const getFormattedTime = () => {
		if (formatTimeAgo) {
			return formatTimeAgo(comment.createdAt);
		}
		return formatCommentTime(comment.createdAt);
	};

	console.log("CommentThread render state:", {
		commentId: comment.id,
		localLikes,
		localIsLiked,
		commentLikes: comment.likes,
		commentIsLiked: comment.isLiked,
	});

	return (
		<div className="space-y-3">
			{/* Main Comment */}
			<div
				className={`flex gap-3 ${depth > 0 ? getIndentationClass(depth) : ""} ${
					!isEnhancedMode ? "group" : ""
				}`}
			>
				{/* Avatar */}
				<div className="flex-shrink-0">
					<Link to={`/users/${commenterData.id}`}>
						<img
							src={commenterData.profileImage}
							alt={commenterData.username}
							className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 hover:border-orange-500 transition-colors"
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								if (target.src !== "/default-avatar.png") {
									target.src = "/default-avatar.png";
								}
							}}
						/>
					</Link>
				</div>

				{/* Comment content */}
				<div className="flex-1 min-w-0">
					{isEnhancedMode ? (
						// Enhanced mode layout
						<div className="bg-slate-50 rounded-lg p-3">
							<div className="flex items-center gap-2 mb-1">
								<Link
									to={`/users/${commenterData.id}`}
									className="font-semibold text-slate-900 text-sm hover:text-orange-600 transition-colors"
								>
									{commenterData.firstName && commenterData.lastName
										? `${commenterData.firstName} ${commenterData.lastName}`
										: commenterData.username}
								</Link>
								<span className="text-xs text-slate-500">
									{getFormattedTime()}
								</span>
							</div>
							<div className="text-slate-700 text-sm mb-2">
								{renderCommentWithMentions(comment.comment)}
							</div>

							{/* Action buttons for enhanced mode */}
							<div className="flex items-center gap-4 text-xs text-slate-500">
								{/* Like Button */}
								{sessionUser && (
									<CommentLikeButton
										commentId={comment.id}
										initialLikeCount={localLikes}
										initialIsLiked={localIsLiked}
										onLikeToggle={handleLikeToggle}
										onLikesClick={handleShowLikes}
										size={12}
										showCount={true}
									/>
								)}

								{/* Reply Button */}
								{sessionUser && (
									<button
										onClick={handleEnhancedReplyClick}
										className="flex items-center gap-1 hover:text-orange-600 transition-colors"
									>
										<Reply size={12} />
										Reply
									</button>
								)}

								{/* Show replies button for enhanced mode */}
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
						</div>
					) : (
						// Original mode layout
						<>
							{/* Header */}
							<div className="flex items-center gap-2 mb-1">
								<span className="font-semibold text-gray-900 text-sm">
									{commenterData.firstName} {commenterData.lastName}
								</span>
								<span className="text-gray-500 text-sm">
									@{commenterData.username}
								</span>
								<span className="text-gray-400 text-xs">
									{getFormattedTime()}
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
												? comment.comment
														.replace(`@${mentionedUser}`, "")
														.trim()
												: comment.comment}
										</span>
									</div>
								)}
							</div>
						</>
					)}

					{/* Action buttons for original mode */}
					{!isEditing && !isEnhancedMode && (
						<div className="flex items-center gap-4 text-xs text-slate-500">
							{/* Like Button for original mode */}
							{sessionUser && (
								<CommentLikeButton
									commentId={comment.id}
									initialLikeCount={localLikes}
									initialIsLiked={localIsLiked}
									onLikeToggle={handleLikeToggle}
									onLikesClick={handleShowLikes}
									size={12}
									showCount={true}
								/>
							)}

							{sessionUser && (
								<button
									onClick={() => setIsReplying(true)}
									className="flex items-center gap-1 hover:text-orange-600 transition-colors"
								>
									<Reply size={12} />
									Reply
								</button>
							)}

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

					{/* Reply form - Original mode */}
					{isReplying && !isEnhancedMode && (
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

					{/* Reply form - Enhanced mode */}
					{replyToComment === comment.id &&
						isEnhancedMode &&
						sessionUser &&
						setReplyText && (
							<div className={`flex gap-3 mt-3 ${getIndentationClass(1)}`}>
								<Link to={`/users/${sessionUser.id}`} className="flex-shrink-0">
									<img
										src={sessionUser.profileImage || "/default-avatar.png"}
										alt={sessionUser.username}
										className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 hover:border-orange-500 transition-colors"
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											if (target.src !== "/default-avatar.png") {
												target.src = "/default-avatar.png";
											}
										}}
									/>
								</Link>
								<div className="flex-1">
									<div className="relative">
										<textarea
											value={replyText}
											onChange={(e) => setReplyText(e.target.value)}
											placeholder={`Reply to @${commenterData.username}...`}
											className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
											rows={2}
											onFocus={() => {
												// Auto-add mention when focusing on reply if not already present
												if (!replyText.includes(`@${commenterData.username}`)) {
													setReplyText(`@${commenterData.username} `);
												}
											}}
										/>
										<div className="flex items-center justify-between mt-2">
											<button
												onClick={() => {
													setReplyToComment(null);
													setReplyText("");
												}}
												className="text-xs text-slate-500 hover:text-slate-700"
											>
												Cancel
											</button>
											<button
												onClick={() => {
													// Ensure mention is present before submitting
													let finalReplyText = replyText.trim();
													if (
														!finalReplyText.includes(
															`@${commenterData.username}`,
														)
													) {
														finalReplyText = `@${commenterData.username} ${finalReplyText}`;
													}
													setReplyText(finalReplyText);
													handleAddReply?.(comment.id);
												}}
												disabled={!replyText.trim() || isSubmitting}
												className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
											>
												{isSubmitting ? "Posting..." : "Reply"}
											</button>
										</div>
									</div>
								</div>
							</div>
						)}

					{/* Nested replies */}
					{hasReplies &&
						(showReplies || isEnhancedMode) &&
						shouldNestReplies && (
							<div className="mt-3 space-y-3">
								{/* Show limited replies initially */}
								{visibleReplies?.map((reply) => (
									<CommentThread
										key={reply.id}
										comment={reply}
										depth={depth + 1}
										maxDepth={maxDepth}
										sessionUser={sessionUser}
										postUser={postUser}
										allComments={allComments}
										replyToComment={replyToComment}
										setReplyToComment={setReplyToComment}
										replyText={replyText}
										setReplyText={setReplyText}
										isSubmitting={isSubmitting}
										showAllReplies={showAllReplies}
										toggleShowAllReplies={toggleShowAllReplies}
										onReply={onReply}
										onEdit={onEdit}
										onDelete={onDelete}
										handleAddReply={handleAddReply}
										onLikeToggle={onLikeToggle} // Critical: pass this down
										onShowLikes={onShowLikes} // Critical: pass this down
										formatTimeAgo={formatTimeAgo}
										currentUserId={currentUserId}
									/>
								))}

								{/* Show more/less replies buttons */}
								{hasMoreReplies && (
									<div
										className={
											isEnhancedMode ? getIndentationClass(depth + 1) : "mt-2"
										}
									>
										{!shouldShowAll ? (
											<button
												onClick={handleToggleShowAllReplies}
												className="text-sm text-orange-600 hover:text-orange-700 font-medium"
											>
												View {comment.replies!.length - maxVisibleReplies} more
												replies
											</button>
										) : (
											<button
												onClick={handleToggleShowAllReplies}
												className="text-sm text-slate-600 hover:text-slate-700 font-medium"
											>
												Show less
											</button>
										)}
									</div>
								)}
							</div>
						)}

					{/* Show replies as flat list if max depth reached */}
					{hasReplies &&
						(showReplies || isEnhancedMode) &&
						!shouldNestReplies &&
						!isEnhancedMode && (
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
											<span className="text-gray-700 ml-2">
												{reply.comment}
											</span>
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

// import React, { useState, useMemo, useCallback } from "react";
// import { Link } from "react-router-dom";
// import {
// 	MessageCircle,
// 	Heart,
// 	MoreHorizontal,
// 	Edit3,
// 	Trash2,
// 	Reply,
// 	ChevronDown,
// 	ChevronRight,
// 	AtSign,
// } from "lucide-react";
// import {
// 	formatCommentTime,
// 	canModifyComment,
// 	extractMentionFromComment,
// } from "../../../utils/commentUtils";
// import CommentForm from "../CommentForm";
// import type { Comment } from "../../../types/comments";

// interface CommentThreadProps {
// 	comment: Comment;
// 	depth?: number;
// 	maxDepth?: number;

// 	// Session user data
// 	sessionUser?: {
// 		id: number;
// 		username: string;
// 		firstName?: string;
// 		lastName?: string;
// 		profileImage: string;
// 	} | null;

// 	// Post user data for mention linking
// 	postUser?: {
// 		id: number;
// 		username: string;
// 		firstName: string;
// 		lastName: string;
// 		profileImage: string;
// 	};

// 	// All comments for mention linking
// 	allComments?: Comment[];

// 	// Reply state management
// 	replyToComment?: number | null;
// 	setReplyToComment?: (id: number | null) => void;
// 	replyText?: string;
// 	setReplyText?: (text: string) => void;
// 	isSubmitting?: boolean;

// 	// Show/hide replies state
// 	showAllReplies?: { [key: number]: boolean };
// 	toggleShowAllReplies?: (commentId: number) => void;

// 	// Action handlers - unified interface
// 	onReply?: (
// 		parentId: number,
// 		replyToUsername?: string,
// 	) => void | Promise<void>;
// 	onEdit?: (commentId: number, newText: string) => Promise<void>;
// 	onDelete?: (commentId: number) => Promise<void>;
// 	handleAddReply?: (parentId: number) => void | Promise<void>;

// 	// Utility functions
// 	formatTimeAgo?: (date: string) => string;

// 	// Legacy props for backwards compatibility
// 	currentUserId?: number;
// }

// const CommentThread: React.FC<CommentThreadProps> = ({
// 	comment,
// 	depth = 0,
// 	maxDepth = 5,
// 	sessionUser,
// 	postUser,
// 	allComments = [],
// 	replyToComment,
// 	setReplyToComment,
// 	replyText = "",
// 	setReplyText,
// 	isSubmitting = false,
// 	showAllReplies = {},
// 	toggleShowAllReplies,
// 	onReply,
// 	onEdit,
// 	onDelete,
// 	handleAddReply,
// 	formatTimeAgo,
// 	currentUserId,
// }) => {
// 	// Local state for the original CommentThread functionality
// 	const [isReplying, setIsReplying] = useState(false);
// 	const [isEditing, setIsEditing] = useState(false);
// 	const [editText, setEditText] = useState(comment.comment);
// 	const [showReplies, setShowReplies] = useState(true);
// 	const [showMenu, setShowMenu] = useState(false);
// 	const [isLiked, setIsLiked] = useState(false);
// 	const [likeCount, setLikeCount] = useState(0);
// 	const [showAllRepliesLocal, setShowAllRepliesLocal] = useState(false);

// 	// Determine which mode we're in based on props
// 	const isEnhancedMode = !!(sessionUser && setReplyToComment && handleAddReply);
// 	const useCurrentUserId = currentUserId || sessionUser?.id;

// 	const canModify = canModifyComment(comment, useCurrentUserId);
// 	const hasReplies = comment.replies && comment.replies.length > 0;
// 	const shouldNestReplies = depth < maxDepth;
// 	const mentionedUser = extractMentionFromComment(comment.comment);

// 	// Reply visibility logic
// 	const maxVisibleReplies = isEnhancedMode ? 0 : 2;
// 	const hasMoreReplies =
// 		comment.replies && comment.replies.length > maxVisibleReplies;

// 	// Use provided showAllReplies or local state
// 	const shouldShowAll = showAllReplies?.[comment.id] ?? showAllRepliesLocal;
// 	const visibleReplies = shouldShowAll
// 		? comment.replies
// 		: comment.replies?.slice(0, maxVisibleReplies);

// 	// Calculate proper indentation based on depth
// 	const getIndentationClass = useCallback((currentDepth: number) => {
// 		if (currentDepth === 0) return "";
// 		switch (currentDepth) {
// 			case 1:
// 				return "ml-12"; // 48px
// 			case 2:
// 				return "ml-16"; // 64px
// 			case 3:
// 				return "ml-20"; // 80px
// 			case 4:
// 				return "ml-24"; // 96px
// 			default:
// 				return "ml-24"; // Max indentation
// 		}
// 	}, []);

// 	// Stable commenter data with proper fallbacks
// 	const commenterData = useMemo(() => {
// 		if (comment.commenter) {
// 			return {
// 				id: comment.commenter.id,
// 				username: comment.commenter.username || "Unknown User",
// 				firstName: comment.commenter.firstName || "",
// 				lastName: comment.commenter.lastName || "",
// 				profileImage: comment.commenter.profileImage || "/default-avatar.png",
// 			};
// 		}

// 		// Fallback to comment data
// 		return {
// 			id: comment.userId,
// 			username: "Unknown User",
// 			firstName: "",
// 			lastName: "",
// 			profileImage: "/default-avatar.png",
// 		};
// 	}, [comment.commenter, comment.userId]);

// 	// Helper function to render comments with clickable @ mentions
// 	const renderCommentWithMentions = useCallback(
// 		(commentText: string) => {
// 			if (!isEnhancedMode || !postUser || !allComments.length) {
// 				// Fallback to simple rendering with basic mention highlighting
// 				const mentionRegex = /@([\w-]+)/g;
// 				const parts = commentText.split(mentionRegex);

// 				return parts.map((part, index) => {
// 					if (index % 2 === 1) {
// 						// This is a username (odd indices after split)
// 						return (
// 							<span key={index} className="text-orange-600 font-medium">
// 								@{part}
// 							</span>
// 						);
// 					}
// 					return part;
// 				});
// 			}

// 			// Enhanced rendering with clickable links
// 			const mentionRegex = /@([\w-]+)/g;
// 			const parts = [];
// 			let lastIndex = 0;
// 			let match;

// 			while ((match = mentionRegex.exec(commentText)) !== null) {
// 				// Add text before the mention
// 				if (match.index > lastIndex) {
// 					parts.push(commentText.slice(lastIndex, match.index));
// 				}

// 				// Add the clickable mention
// 				const username = match[1];
// 				let userId = null;

// 				// Check if it's the session user
// 				if (sessionUser && username === sessionUser.username) {
// 					userId = sessionUser.id;
// 				}
// 				// Check if it's the post creator
// 				else if (username === postUser.username) {
// 					userId = postUser.id;
// 				}
// 				// Look through comments to find matching username
// 				else {
// 					const findUserInComments = (
// 						commentsList: Comment[],
// 					): number | null => {
// 						for (const comment of commentsList) {
// 							if (comment.commenter?.username === username) {
// 								return comment.commenter.id;
// 							}
// 							if (comment.replies) {
// 								const found = findUserInComments(comment.replies);
// 								if (found) return found;
// 							}
// 						}
// 						return null;
// 					};
// 					userId = findUserInComments(allComments);
// 				}

// 				parts.push(
// 					<Link
// 						key={`mention-${match.index}`}
// 						to={`/users/${userId || username}`}
// 						className="text-orange-600 hover:text-orange-700 font-medium"
// 					>
// 						@{username}
// 					</Link>,
// 				);

// 				lastIndex = match.index + match[0].length;
// 			}

// 			// Add remaining text after the last mention
// 			if (lastIndex < commentText.length) {
// 				parts.push(commentText.slice(lastIndex));
// 			}

// 			return parts.length === 0 ? commentText : parts;
// 		},
// 		[isEnhancedMode, postUser, allComments, sessionUser],
// 	);

// 	// Handle reply submission for original mode
// 	const handleReplySubmit = async () => {
// 		try {
// 			await onReply?.(comment.id, comment.commenter?.username || "");
// 			setIsReplying(false);
// 		} catch (error) {
// 			console.error("Error submitting reply:", error);
// 			throw error;
// 		}
// 	};

// 	// Handle edit submission
// 	const handleEditSubmit = async () => {
// 		if (editText.trim() === comment.comment) {
// 			setIsEditing(false);
// 			return;
// 		}

// 		try {
// 			await onEdit?.(comment.id, editText.trim());
// 			setIsEditing(false);
// 		} catch (error) {
// 			console.error("Error editing comment:", error);
// 			setEditText(comment.comment); // Reset on error
// 		}
// 	};

// 	// Handle delete
// 	const handleDelete = async () => {
// 		if (window.confirm("Are you sure you want to delete this comment?")) {
// 			try {
// 				await onDelete?.(comment.id);
// 			} catch (error) {
// 				console.error("Error deleting comment:", error);
// 			}
// 		}
// 		setShowMenu(false);
// 	};

// 	// Handle like toggle
// 	const handleLikeToggle = async () => {
// 		try {
// 			// Optimistic update
// 			setIsLiked(!isLiked);
// 			setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
// 		} catch (error) {
// 			// Revert on error
// 			setIsLiked(isLiked);
// 			setLikeCount(likeCount);
// 			console.error("Error toggling like:", error);
// 		}
// 	};

// 	// Handle reply button click in enhanced mode
// 	const handleEnhancedReplyClick = () => {
// 		if (setReplyToComment && setReplyText) {
// 			setReplyToComment(comment.id);
// 			// Pre-populate reply with mention
// 			if (!replyText.includes(`@${commenterData.username}`)) {
// 				setReplyText(`@${commenterData.username} `);
// 			}
// 		}
// 	};

// 	// Handle toggle show all replies
// 	const handleToggleShowAllReplies = () => {
// 		if (toggleShowAllReplies) {
// 			toggleShowAllReplies(comment.id);
// 		} else {
// 			setShowAllRepliesLocal(!showAllRepliesLocal);
// 		}
// 	};

// 	// Format time based on available formatter
// 	const getFormattedTime = () => {
// 		if (formatTimeAgo) {
// 			return formatTimeAgo(comment.createdAt);
// 		}
// 		return formatCommentTime(comment.createdAt);
// 	};

// 	return (
// 		<div className="space-y-3">
// 			{/* Main Comment */}
// 			<div
// 				className={`flex gap-3 ${depth > 0 ? getIndentationClass(depth) : ""} ${
// 					!isEnhancedMode ? "group" : ""
// 				}`}
// 			>
// 				{/* Avatar */}
// 				<div className="flex-shrink-0">
// 					<Link to={`/users/${commenterData.id}`}>
// 						<img
// 							src={commenterData.profileImage}
// 							alt={commenterData.username}
// 							className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 hover:border-orange-500 transition-colors"
// 							onError={(e) => {
// 								const target = e.target as HTMLImageElement;
// 								if (target.src !== "/default-avatar.png") {
// 									target.src = "/default-avatar.png";
// 								}
// 							}}
// 						/>
// 					</Link>
// 				</div>

// 				{/* Comment content */}
// 				<div className="flex-1 min-w-0">
// 					{isEnhancedMode ? (
// 						// Mode layout
// 						<div className="bg-slate-50 rounded-lg p-3">
// 							<div className="flex items-center gap-2 mb-1">
// 								<Link
// 									to={`/users/${commenterData.id}`}
// 									className="font-semibold text-slate-900 text-sm hover:text-orange-600 transition-colors"
// 								>
// 									{commenterData.firstName && commenterData.lastName
// 										? `${commenterData.firstName} ${commenterData.lastName}`
// 										: commenterData.username}
// 								</Link>
// 								<span className="text-xs text-slate-500">
// 									{getFormattedTime()}
// 								</span>
// 							</div>
// 							<div className="text-slate-700 text-sm">
// 								{renderCommentWithMentions(comment.comment)}
// 							</div>
// 						</div>
// 					) : (
// 						// Original mode layout
// 						<>
// 							{/* Header */}
// 							<div className="flex items-center gap-2 mb-1">
// 								<span className="font-semibold text-gray-900 text-sm">
// 									{commenterData.firstName} {commenterData.lastName}
// 								</span>
// 								<span className="text-gray-500 text-sm">
// 									@{commenterData.username}
// 								</span>
// 								<span className="text-gray-400 text-xs">
// 									{getFormattedTime()}
// 								</span>

// 								{/* Actions menu */}
// 								{canModify && (
// 									<div className="relative ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
// 										<button
// 											onClick={() => setShowMenu(!showMenu)}
// 											className="p-1 hover:bg-gray-100 rounded-full transition-colors"
// 										>
// 											<MoreHorizontal size={14} />
// 										</button>

// 										{showMenu && (
// 											<div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
// 												<button
// 													onClick={() => {
// 														setIsEditing(true);
// 														setShowMenu(false);
// 													}}
// 													className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
// 												>
// 													<Edit3 size={14} />
// 													Edit
// 												</button>
// 												<button
// 													onClick={handleDelete}
// 													className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
// 												>
// 													<Trash2 size={14} />
// 													Delete
// 												</button>
// 											</div>
// 										)}
// 									</div>
// 								)}
// 							</div>

// 							{/* Comment text */}
// 							<div className="mb-2">
// 								{isEditing ? (
// 									<div className="space-y-2">
// 										<textarea
// 											value={editText}
// 											onChange={(e) => setEditText(e.target.value)}
// 											className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
// 											rows={2}
// 											autoFocus
// 										/>
// 										<div className="flex items-center gap-2">
// 											<button
// 												onClick={handleEditSubmit}
// 												disabled={!editText.trim()}
// 												className="px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:bg-gray-300"
// 											>
// 												Save
// 											</button>
// 											<button
// 												onClick={() => {
// 													setIsEditing(false);
// 													setEditText(comment.comment);
// 												}}
// 												className="px-3 py-1 text-gray-600 text-sm hover:text-gray-800"
// 											>
// 												Cancel
// 											</button>
// 										</div>
// 									</div>
// 								) : (
// 									<div className="text-gray-800 text-sm leading-relaxed">
// 										{mentionedUser && (
// 											<span className="inline-flex items-center gap-1 text-orange-600 font-medium mr-1">
// 												<AtSign size={12} />
// 												{mentionedUser}
// 											</span>
// 										)}
// 										<span>
// 											{mentionedUser
// 												? comment.comment
// 														.replace(`@${mentionedUser}`, "")
// 														.trim()
// 												: comment.comment}
// 										</span>
// 									</div>
// 								)}
// 							</div>
// 						</>
// 					)}

// 					{/* Action buttons */}
// 					{!isEditing && (
// 						<div
// 							className={`flex items-center ${
// 								isEnhancedMode ? "mt-2" : "gap-4"
// 							} text-xs text-slate-500`}
// 						>
// 							{!isEnhancedMode && (
// 								<button
// 									onClick={handleLikeToggle}
// 									className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
// 										isLiked ? "text-red-500" : ""
// 									}`}
// 								>
// 									<Heart size={12} fill={isLiked ? "currentColor" : "none"} />
// 									{likeCount > 0 && <span>{likeCount}</span>}
// 								</button>
// 							)}

// 							{sessionUser && (
// 								<button
// 									onClick={
// 										isEnhancedMode
// 											? handleEnhancedReplyClick
// 											: () => setIsReplying(true)
// 									}
// 									className="flex items-center gap-1 hover:text-orange-600 transition-colors"
// 								>
// 									<Reply size={12} />
// 									Reply
// 								</button>
// 							)}

// 							{hasReplies && !isEnhancedMode && (
// 								<button
// 									onClick={() => setShowReplies(!showReplies)}
// 									className="flex items-center gap-1 hover:text-blue-500 transition-colors"
// 								>
// 									{showReplies ? (
// 										<ChevronDown size={12} />
// 									) : (
// 										<ChevronRight size={12} />
// 									)}
// 									{comment.replies?.length}{" "}
// 									{comment.replies?.length === 1 ? "reply" : "replies"}
// 								</button>
// 							)}
// 						</div>
// 					)}

// 					{/* Reply form - Original mode */}
// 					{isReplying && !isEnhancedMode && (
// 						<div className="mt-3">
// 							<CommentForm
// 								postId={comment.postId}
// 								parentId={comment.id}
// 								replyToUsername={comment.commenter?.username}
// 								onSubmit={handleReplySubmit}
// 								onCancel={() => setIsReplying(false)}
// 								placeholder={`Reply to @${comment.commenter?.username}...`}
// 								autoFocus
// 							/>
// 						</div>
// 					)}

// 					{/* Reply form - Enhanced mode */}
// 					{replyToComment === comment.id &&
// 						isEnhancedMode &&
// 						sessionUser &&
// 						setReplyText && (
// 							<div className={`flex gap-3 mt-3 ${getIndentationClass(1)}`}>
// 								<Link to={`/users/${sessionUser.id}`} className="flex-shrink-0">
// 									<img
// 										src={sessionUser.profileImage || "/default-avatar.png"}
// 										alt={sessionUser.username}
// 										className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 hover:border-orange-500 transition-colors"
// 										onError={(e) => {
// 											const target = e.target as HTMLImageElement;
// 											if (target.src !== "/default-avatar.png") {
// 												target.src = "/default-avatar.png";
// 											}
// 										}}
// 									/>
// 								</Link>
// 								<div className="flex-1">
// 									<div className="relative">
// 										<textarea
// 											value={replyText}
// 											onChange={(e) => setReplyText(e.target.value)}
// 											placeholder={`Reply to @${commenterData.username}...`}
// 											className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
// 											rows={2}
// 											onFocus={() => {
// 												// Auto-add mention when focusing on reply if not already present
// 												if (!replyText.includes(`@${commenterData.username}`)) {
// 													setReplyText(`@${commenterData.username} `);
// 												}
// 											}}
// 										/>
// 										<div className="flex items-center justify-between mt-2">
// 											<button
// 												onClick={() => {
// 													setReplyToComment(null);
// 													setReplyText("");
// 												}}
// 												className="text-xs text-slate-500 hover:text-slate-700"
// 											>
// 												Cancel
// 											</button>
// 											<button
// 												onClick={() => {
// 													// Ensure mention is present before submitting
// 													let finalReplyText = replyText.trim();
// 													if (
// 														!finalReplyText.includes(
// 															`@${commenterData.username}`,
// 														)
// 													) {
// 														finalReplyText = `@${commenterData.username} ${finalReplyText}`;
// 													}
// 													setReplyText(finalReplyText);
// 													handleAddReply?.(comment.id);
// 												}}
// 												disabled={!replyText.trim() || isSubmitting}
// 												className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
// 											>
// 												{isSubmitting ? "Posting..." : "Reply"}
// 											</button>
// 										</div>
// 									</div>
// 								</div>
// 							</div>
// 						)}

// 					{/* Nested replies */}
// 					{hasReplies &&
// 						(showReplies || isEnhancedMode) &&
// 						shouldNestReplies && (
// 							<div className="mt-3 space-y-3">
// 								{/* Show limited replies initially */}
// 								{visibleReplies?.map((reply) => (
// 									<CommentThread
// 										key={reply.id}
// 										comment={reply}
// 										depth={depth + 1}
// 										maxDepth={maxDepth}
// 										sessionUser={sessionUser}
// 										postUser={postUser}
// 										allComments={allComments}
// 										replyToComment={replyToComment}
// 										setReplyToComment={setReplyToComment}
// 										replyText={replyText}
// 										setReplyText={setReplyText}
// 										isSubmitting={isSubmitting}
// 										showAllReplies={showAllReplies}
// 										toggleShowAllReplies={toggleShowAllReplies}
// 										onReply={onReply}
// 										onEdit={onEdit}
// 										onDelete={onDelete}
// 										handleAddReply={handleAddReply}
// 										formatTimeAgo={formatTimeAgo}
// 										currentUserId={currentUserId}
// 									/>
// 								))}

// 								{/* Show more/less replies buttons */}
// 								{hasMoreReplies && (
// 									<div
// 										className={
// 											isEnhancedMode ? getIndentationClass(depth + 1) : "mt-2"
// 										}
// 									>
// 										{!shouldShowAll ? (
// 											<button
// 												onClick={handleToggleShowAllReplies}
// 												className="text-sm text-orange-600 hover:text-orange-700 font-medium"
// 											>
// 												View {comment.replies!.length - maxVisibleReplies} more
// 												replies
// 											</button>
// 										) : (
// 											<button
// 												onClick={handleToggleShowAllReplies}
// 												className="text-sm text-slate-600 hover:text-slate-700 font-medium"
// 											>
// 												Show less
// 											</button>
// 										)}
// 									</div>
// 								)}
// 							</div>
// 						)}

// 					{/* Show replies as flat list if max depth reached */}
// 					{hasReplies &&
// 						(showReplies || isEnhancedMode) &&
// 						!shouldNestReplies &&
// 						!isEnhancedMode && (
// 							<div className="mt-3 p-3 bg-gray-50 rounded-lg">
// 								<div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
// 									<MessageCircle size={12} />
// 									{comment.replies?.length} more{" "}
// 									{comment.replies?.length === 1 ? "reply" : "replies"}
// 								</div>
// 								<div className="space-y-2">
// 									{comment.replies?.slice(0, 3).map((reply) => (
// 										<div key={reply.id} className="text-sm">
// 											<span className="font-medium text-gray-900">
// 												@{reply.commenter?.username}
// 											</span>
// 											<span className="text-gray-700 ml-2">
// 												{reply.comment}
// 											</span>
// 										</div>
// 									))}
// 									{comment.replies && comment.replies.length > 3 && (
// 										<button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
// 											View all {comment.replies.length} replies
// 										</button>
// 									)}
// 								</div>
// 							</div>
// 						)}
// 				</div>
// 			</div>

// 			{/* Click outside handler for menu */}
// 			{showMenu && (
// 				<div className="fixed inset-0 z-5" onClick={() => setShowMenu(false)} />
// 			)}
// 		</div>
// 	);
// };

// export default CommentThread;
