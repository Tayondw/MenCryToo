import React, { useState, useRef, useEffect } from "react";
import { Send, X, AtSign } from "lucide-react";
import { validateComment } from "../../../utils/commentUtils";
import type { CommentFormProps } from "../../../types/comments";

const CommentForm: React.FC<CommentFormProps> = ({
	postId,
	parentId = null,
	replyToUsername,
	onSubmit,
	onCancel,
	placeholder = "Write a comment...",
	autoFocus = false,
	isSubmitting = false,
}) => {
	const [commentText, setCommentText] = useState("");
	const [error, setError] = useState<string | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-focus when component mounts
	useEffect(() => {
		if (autoFocus && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [autoFocus]);

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, [commentText]);

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Validate comment
		const validation = validateComment(commentText);
		if (!validation.isValid) {
			setError(validation.error || "Invalid comment");
			return;
		}

		try {
			await onSubmit({
				comment: commentText.trim(),
				postId,
				parentId,
				replyToUsername,
			});

			// Clear form on success
			setCommentText("");
			setError(null);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Failed to post comment",
			);
		}
	};

	// Handle keyboard shortcuts
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSubmit(e);
		}

		if (e.key === "Escape" && onCancel) {
			e.preventDefault();
			onCancel();
		}
	};

	// Handle input change
	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setCommentText(e.target.value);
		if (error) setError(null);
	};

	const isReply = parentId !== null && replyToUsername;
	const buttonText = isReply ? "Reply" : "Comment";
	const charCount = commentText.length;
	const maxChars = 500;
	const isNearLimit = charCount > maxChars * 0.8;
	const isOverLimit = charCount > maxChars;

	return (
		<form onSubmit={handleSubmit} className="space-y-3">
			{/* Reply indicator */}
			{isReply && (
				<div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
					<AtSign size={14} />
					<span>
						Replying to <span className="font-medium">@{replyToUsername}</span>
					</span>
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
						>
							<X size={14} />
						</button>
					)}
				</div>
			)}

			{/* Comment input */}
			<div className="relative">
				<textarea
					ref={textareaRef}
					value={commentText}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					disabled={isSubmitting}
					className={`
            w-full px-4 py-3 pr-12 border rounded-lg resize-none transition-all duration-200
            min-h-[80px] max-h-[200px]
            ${
							error
								? "border-red-300 focus:border-red-500 focus:ring-red-200"
								: "border-gray-300 focus:border-orange-500 focus:ring-orange-200"
						}
            ${isSubmitting ? "bg-gray-50 cursor-not-allowed" : "bg-white"}
            focus:ring-2 focus:outline-none
          `}
					rows={3}
				/>

				{/* Submit button */}
				<button
					type="submit"
					disabled={!commentText.trim() || isSubmitting || isOverLimit}
					className={`
            absolute bottom-3 right-3 p-2 rounded-full transition-all duration-200
            ${
							commentText.trim() && !isOverLimit && !isSubmitting
								? "bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg"
								: "bg-gray-200 text-gray-400 cursor-not-allowed"
						}
          `}
					title={`${buttonText} (⌘+Enter)`}
				>
					{isSubmitting ? (
						<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
					) : (
						<Send size={16} />
					)}
				</button>
			</div>

			{/* Character count and error */}
			<div className="flex items-center justify-between text-sm">
				<div className="flex-1">
					{error && <span className="text-red-600 font-medium">{error}</span>}
				</div>

				<div
					className={`
          font-medium transition-colors
          ${
						isOverLimit
							? "text-red-600"
							: isNearLimit
							? "text-orange-600"
							: "text-gray-400"
					}
        `}
				>
					{charCount}/{maxChars}
				</div>
			</div>

			{/* Action buttons for replies */}
			{isReply && (
				<div className="flex items-center justify-end gap-2 pt-2">
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							disabled={isSubmitting}
							className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
					)}
					<button
						type="submit"
						disabled={!commentText.trim() || isSubmitting || isOverLimit}
						className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${
								commentText.trim() && !isOverLimit && !isSubmitting
									? "bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg"
									: "bg-gray-200 text-gray-400 cursor-not-allowed"
							}
            `}
					>
						{isSubmitting ? "Posting..." : buttonText}
					</button>
				</div>
			)}

			{/* Keyboard shortcuts hint */}
			<div className="text-xs text-gray-400 text-right">
				<span>⌘+Enter to post</span>
				{onCancel && <span> • Esc to cancel</span>}
			</div>
		</form>
	);
};

export default CommentForm;
