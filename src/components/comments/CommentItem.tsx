import { useState, useRef, useEffect } from "react";
import type { Comment } from "../../types/comments";

export interface CommentItemProps {
  comment: Comment;
  depth: number;
  expandedCommentIds: Set<number>;
  loadingRepliesCommentIds: Set<number>;
  onToggleReplies: (commentId: number) => void;
  onToggleLike: (commentId: number) => void;
  onStartReply: (commentId: number, userName: string) => void;
  currentUserId?: number;
  onEditComment?: (commentId: number, content: string) => Promise<Comment | void>;
  onDeleteComment?: (commentId: number) => Promise<void>;
}

const MAX_CHAR_COUNT = 300;

/**
 * Parses content to highlight @username mentions in blue (e.g. "@JohnDoe Hello")
 */
function renderCommentContent(content: string) {
  const mentionMatch = content.match(
    /^(@[\w\u0600-\u06FF]+(?:\s+[\w\u0600-\u06FF]+)?)([\s\S]*)$/
  );
  if (mentionMatch) {
    return (
      <>
        <span style={{ color: "#0095f6", fontWeight: 600, marginRight: 4 }}>
          {mentionMatch[1]}
        </span>
        {mentionMatch[2]}
      </>
    );
  }
  return content;
}

export function CommentItem({
  comment,
  depth,
  expandedCommentIds,
  loadingRepliesCommentIds,
  onToggleReplies,
  onToggleLike,
  onStartReply,
  currentUserId,
  onEditComment,
  onDeleteComment,
}: CommentItemProps) {
  const isAuthor = Boolean(currentUserId && currentUserId === comment.userId);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Dropdown menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const isExpanded = expandedCommentIds.has(comment.id);
  const isLoadingReplies = loadingRepliesCommentIds.has(comment.id);
  const isCommentLiked = Boolean(comment.liked);
  const commentLikeCount = comment.likeCount ?? 0;
  const replyCount = comment.replyCount ?? comment.replies?.length ?? 0;
  const hasReplies =
    replyCount > 0 || (comment.replies && comment.replies.length > 0);

  const cInitial = (comment.userName || "U").charAt(0).toUpperCase();
  const cDate = new Date(comment.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isEdited =
    Boolean(comment.updatedAt) &&
    new Date(comment.updatedAt).getTime() >
      new Date(comment.createdAt).getTime() + 3000;

  const avatarSize = depth === 0 ? 32 : 24;
  const avatarFontSize = depth === 0 ? 13 : 11;

  // Auto-resize edit textarea when entering edit mode
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.style.height = "auto";
      editTextareaRef.current.style.height = `${Math.min(
        editTextareaRef.current.scrollHeight,
        180
      )}px`;
      editTextareaRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setIsMenuOpen(false);
    setEditContent(comment.content);
    setEditError(null);
    setIsEditing(true);
  };

  const handleStartDelete = () => {
    setIsMenuOpen(false);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editContent.trim();
    if (!trimmed || trimmed.length > MAX_CHAR_COUNT || isSaving) return;

    if (trimmed === comment.content) {
      setIsEditing(false);
      return;
    }

    if (!onEditComment) return;

    setIsSaving(true);
    setEditError(null);

    try {
      await onEditComment(comment.id, trimmed);
      setIsEditing(false);
    } catch {
      setEditError("Failed to update comment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteComment || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onDeleteComment(comment.id);
      setIsDeleteModalOpen(false);
    } catch {
      setDeleteError("Failed to delete comment. Please try again.");
      setIsDeleting(false);
    }
  };

  const editCharCount = editContent.length;
  const isEditOverLimit = editCharCount > MAX_CHAR_COUNT;
  const canSave =
    editContent.trim().length > 0 && !isEditOverLimit && !isSaving;

  return (
    <div style={{ position: "relative" }}>
      {/* Main Comment Row */}
      <div
        style={{
          display: "flex",
          gap: depth === 0 ? 12 : 10,
          alignItems: "flex-start",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            backgroundColor: "#e4e6eb",
            color: "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: avatarFontSize,
            flexShrink: 0,
          }}
        >
          {cInitial}
        </div>

        {/* Content Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            /* Inline Edit Form */
            <form onSubmit={handleSaveEdit} style={{ marginTop: 2 }}>
              <textarea
                ref={editTextareaRef}
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  const target = e.target;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 180)}px`;
                }}
                rows={2}
                disabled={isSaving}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: isEditOverLimit
                    ? "1px solid #e02424"
                    : "1px solid #1877f2",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: depth === 0 ? 13 : 12,
                  lineHeight: 1.4,
                  color: "#262626",
                  backgroundColor: "#fff",
                  outline: "none",
                  resize: "none",
                  fontFamily: "inherit",
                }}
              />

              {editError && (
                <div
                  style={{
                    color: "#e02424",
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  {editError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: isEditOverLimit ? "#e02424" : "#8e8e8e",
                  }}
                >
                  {editCharCount}/{MAX_CHAR_COUNT}
                </span>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    style={{
                      background: "none",
                      border: "1px solid #ccd0d5",
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#65676b",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!canSave}
                    style={{
                      background: canSave ? "#1877f2" : "#e4e6eb",
                      color: canSave ? "#fff" : "#bcc0c4",
                      border: "none",
                      borderRadius: 4,
                      padding: "2px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: canSave ? "pointer" : "not-allowed",
                    }}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Normal Comment Content */
            <div
              style={{
                fontSize: depth === 0 ? 14 : 13,
                lineHeight: 1.4,
                color: "#262626",
              }}
            >
              <strong style={{ marginRight: 6 }}>{comment.userName}</strong>
              <span style={{ wordBreak: "break-word" }}>
                {renderCommentContent(comment.content)}
              </span>
            </div>
          )}

          {/* Action Row: Timestamp, Likes Count, Reply, Edit, Delete */}
          {!isEditing && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 4,
                fontSize: depth === 0 ? 12 : 11,
                color: "#8e8e8e",
              }}
            >
              <small>{cDate}</small>

              {isEdited && (
                <span style={{ fontStyle: "italic", fontSize: 11 }}>
                  • Edited
                </span>
              )}

              {commentLikeCount > 0 && (
                <span style={{ fontWeight: 600 }}>
                  {commentLikeCount} {commentLikeCount === 1 ? "like" : "likes"}
                </span>
              )}

              {/* Reply Button */}
              <button
                type="button"
                onClick={() => onStartReply(comment.id, comment.userName)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#65676b",
                  fontWeight: 600,
                  fontSize: depth === 0 ? 12 : 11,
                  cursor: "pointer",
                }}
              >
                Reply
              </button>

              {/* Author Actions: 3 dots menu */}
              {isAuthor && (
                <div
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  ref={menuRef}
                >
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    aria-label="Comment options"
                    style={{
                      background: "none",
                      border: "none",
                      padding: "0 2px",
                      color: isMenuOpen ? "#262626" : "#8e8e8e",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#262626")
                    }
                    onMouseLeave={(e) => {
                      if (!isMenuOpen) e.currentTarget.style.color = "#8e8e8e";
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <circle cx="12" cy="12" r="2.2" />
                      <circle cx="5" cy="12" r="2.2" />
                      <circle cx="19" cy="12" r="2.2" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        backgroundColor: "#fff",
                        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
                        borderRadius: 6,
                        border: "1px solid #e4e6eb",
                        minWidth: 105,
                        zIndex: 40,
                        overflow: "hidden",
                        padding: "3px 0",
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 12px",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          fontSize: 12,
                          color: "#1c1e21",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f0f2f5")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "transparent")
                        }
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleStartDelete}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 12px",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          fontSize: 12,
                          color: "#e02424",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#fde8e8")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "transparent")
                        }
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Heart / Like Button */}
        <button
          type="button"
          onClick={() => onToggleLike(comment.id)}
          aria-label={isCommentLiked ? "Unlike comment" : "Like comment"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: isCommentLiked ? "#ed4956" : "#8e8e8e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <svg
            width={depth === 0 ? "15" : "13"}
            height={depth === 0 ? "15" : "13"}
            viewBox="0 0 24 24"
            fill={isCommentLiked ? "#ed4956" : "none"}
            stroke={isCommentLiked ? "#ed4956" : "#8e8e8e"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* L-Shaped Branch Connector & "View X replies" Button */}
      {hasReplies && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
            marginTop: 4,
            marginBottom: 4,
          }}
        >
          {/* Curved branch line (elbow connector) matching YouTube/Facebook */}
          <div
            style={{
              width: 22,
              height: 18,
              borderLeft: "2px solid #8e8e8e",
              borderBottom: "2px solid #8e8e8e",
              borderBottomLeftRadius: 10,
              marginRight: 8,
              marginLeft: depth === 0 ? 15 : 11,
              marginTop: -8,
              flexShrink: 0,
            }}
          />
          <button
            type="button"
            onClick={() => onToggleReplies(comment.id)}
            style={{
              background: "none",
              border: "none",
              padding: "3px 6px",
              color: "#0095f6",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 4,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f2f5")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span>
              {isLoadingReplies
                ? "Loading replies..."
                : isExpanded
                ? "Hide replies"
                : `View ${replyCount} ${
                    replyCount === 1 ? "reply" : "replies"
                  }`}
            </span>
          </button>
        </div>
      )}

      {/* Nested Replies Tree (when expanded) */}
      {isExpanded && comment.replies && comment.replies.length > 0 && (
        <div
          style={{
            position: "relative",
            marginLeft: depth === 0 ? 15 : 11,
            borderLeft: "2px solid #e4e6eb",
            paddingLeft: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 4,
          }}
        >
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              expandedCommentIds={expandedCommentIds}
              loadingRepliesCommentIds={loadingRepliesCommentIds}
              onToggleReplies={onToggleReplies}
              onToggleLike={onToggleLike}
              onStartReply={onStartReply}
              currentUserId={currentUserId}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: 16,
          }}
          onClick={() => {
            if (!isDeleting) setIsDeleteModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              maxWidth: 400,
              width: "100%",
              padding: "24px 24px 20px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 18,
                fontWeight: 700,
                color: "#1c1e21",
              }}
            >
              Delete Comment?
            </h3>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 14,
                color: "#65676b",
                lineHeight: 1.4,
              }}
            >
              Are you sure you want to delete this comment? This action cannot be
              undone and will remove any replies.
            </p>

            {deleteError && (
              <div
                style={{
                  backgroundColor: "#fde8e8",
                  color: "#9b1c1c",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {deleteError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid #ccd0d5",
                  background: "#fff",
                  color: "#4b4f56",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: "8px 18px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "#e02424",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
