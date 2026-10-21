import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Comment } from "../../types/comments";
import { mediaApi } from "../../api/media";
import { getMediaUrl } from "../../utils/media";
import { LightboxModal } from "../LightboxModal";
import { parseRichText } from "../../utils/richText";

export interface CommentItemProps {
  comment: Comment;
  depth: number;
  expandedCommentIds: Set<number>;
  loadingRepliesCommentIds: Set<number>;
  onToggleReplies: (commentId: number) => void;
  onToggleLike: (commentId: number) => void;
  onStartReply: (commentId: number, userName: string) => void;
  currentUserId?: number;
  onEditComment?: (
    commentId: number,
    content: string,
    imageUrl?: string | null
  ) => Promise<Comment | void>;
  onDeleteComment?: (commentId: number) => Promise<void>;
}

const MAX_CHAR_COUNT = 300;

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
  const [editImageUrl, setEditImageUrl] = useState<string | null>(
    comment.imageUrl ?? null
  );
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);

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

  // Parse mentions, autolinks, and media URLs from comment content
  const richParsed = parseRichText(comment.content);
  const allMediaUrls: string[] = [];
  if (comment.imageUrl) {
    allMediaUrls.push(comment.imageUrl);
  }
  for (const mUrl of richParsed.mediaUrls) {
    if (!allMediaUrls.includes(mUrl)) {
      allMediaUrls.push(mUrl);
    }
  }

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
    setEditImageUrl(comment.imageUrl ?? null);
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
    setEditImageUrl(comment.imageUrl ?? null);
    setEditError(null);
  };

  const handleEditFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingEditImage(true);
    setEditError(null);
    try {
      const url = await mediaApi.upload(file, "comments");
      setEditImageUrl(url);
    } catch {
      setEditError("Failed to upload image. Supported: JPG, PNG, WebP, GIF.");
    } finally {
      setIsUploadingEditImage(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editContent.trim();
    if (
      (!trimmed && !editImageUrl) ||
      trimmed.length > MAX_CHAR_COUNT ||
      isSaving ||
      isUploadingEditImage
    )
      return;

    const hasContentChanged = trimmed !== comment.content;
    const hasImageChanged = editImageUrl !== (comment.imageUrl ?? null);

    if (!hasContentChanged && !hasImageChanged) {
      setIsEditing(false);
      return;
    }

    if (!onEditComment) return;

    setIsSaving(true);
    setEditError(null);

    try {
      await onEditComment(comment.id, trimmed, editImageUrl);
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
  const hasContentChanged = editContent.trim() !== comment.content;
  const hasImageChanged = editImageUrl !== (comment.imageUrl ?? null);
  const canSave =
    (editContent.trim().length > 0 || Boolean(editImageUrl)) &&
    !isEditOverLimit &&
    !isSaving &&
    !isUploadingEditImage &&
    (hasContentChanged || hasImageChanged);

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
        <Link
          to={`/profile/${comment.userId}`}
          style={{ textDecoration: "none", flexShrink: 0 }}
          title={`View ${comment.userName}'s profile`}
        >
          <div
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: "50%",
              backgroundColor: "var(--primary)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: avatarFontSize,
              flexShrink: 0,
              cursor: "pointer",
              transition: "opacity 0.15s ease",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {comment.userAvatarUrl ? (
              <img
                src={getMediaUrl(comment.userAvatarUrl)}
                alt={comment.userName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              cInitial
            )}
          </div>
        </Link>

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
                    : "1px solid var(--border-color)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: depth === 0 ? 13 : 12,
                  lineHeight: 1.4,
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-input)",
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
                    color: isEditOverLimit ? "#e02424" : "var(--text-secondary)",
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
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!canSave}
                    style={{
                      background: canSave ? "var(--primary)" : "var(--border-color)",
                      color: canSave ? "#fff" : "var(--text-tertiary)",
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

              {/* Edit image staging */}
              {editImageUrl && (
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginTop: 6,
                    borderRadius: 6,
                    overflow: "hidden",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <img
                    src={getMediaUrl(editImageUrl)}
                    alt=""
                    style={{
                      width: 50,
                      height: 50,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditImageUrl(null)}
                    title="Remove image"
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: "rgba(0,0,0,0.65)",
                      color: "#fff",
                      border: "none",
                      fontSize: 9,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div style={{ marginTop: 4 }}>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleEditFileSelect}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  disabled={isUploadingEditImage}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#45bd62",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: 0,
                  }}
                >
                  📷{" "}
                  {isUploadingEditImage
                    ? "Uploading..."
                    : editImageUrl
                    ? "Change image"
                    : "Attach image"}
                </button>
              </div>
            </form>
          ) : (
            /* Normal Comment Content */
            <div>
              <div
                style={{
                  fontSize: depth === 0 ? 14 : 13,
                  lineHeight: 1.4,
                  color: "var(--text-primary)",
                }}
              >
                <Link
                  to={`/profile/${comment.userId}`}
                  style={{
                    fontWeight: 600,
                    marginRight: 6,
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.textDecoration = "underline")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.textDecoration = "none")
                  }
                >
                  {comment.userName}
                </Link>
                {richParsed.nodes.length > 0 && (
                  <span style={{ wordBreak: "break-word" }}>
                    {richParsed.nodes}
                  </span>
                )}
              </div>

              {/* Attached Image/GIF or Detected Link Media */}
              {allMediaUrls.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  {allMediaUrls.map((mediaUrl, idx) => {
                    const isGif =
                      mediaUrl.toLowerCase().includes(".gif") ||
                      mediaUrl.toLowerCase().includes("giphy") ||
                      mediaUrl.toLowerCase().includes("tenor");

                    return (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          borderRadius: 8,
                          overflow: "hidden",
                          maxWidth: depth === 0 ? 260 : 200,
                          cursor: "pointer",
                          backgroundColor: "var(--bg-hover)",
                          boxShadow: "var(--shadow-sm)",
                        }}
                        onClick={() => {
                          setLightboxImages([mediaUrl]);
                          setIsLightboxOpen(true);
                        }}
                      >
                        <img
                          src={getMediaUrl(mediaUrl)}
                          alt="Comment media attachment"
                          loading="lazy"
                          style={{
                            maxWidth: "100%",
                            maxHeight: 220,
                            borderRadius: 8,
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                        {isGif && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: 6,
                              left: 6,
                              backgroundColor: "rgba(0,0,0,0.72)",
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 5px",
                              borderRadius: 4,
                              letterSpacing: "0.5px",
                              pointerEvents: "none",
                              backdropFilter: "blur(2px)",
                            }}
                          >
                            GIF
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
                color: "var(--text-secondary)",
              }}
            >
              <small>{cDate}</small>

              {isEdited && (
                <span style={{ fontStyle: "italic", fontSize: 11, color: "var(--text-tertiary)" }}>
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
                  color: "var(--text-secondary)",
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
                      color: isMenuOpen ? "var(--text-primary)" : "var(--text-secondary)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--text-primary)")
                    }
                    onMouseLeave={(e) => {
                      if (!isMenuOpen) e.currentTarget.style.color = "var(--text-secondary)";
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
                        backgroundColor: "var(--bg-card)",
                        boxShadow: "var(--shadow-md)",
                        borderRadius: 6,
                        border: "1px solid var(--border-color)",
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
                          color: "var(--text-primary)",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
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
                          (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
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
            color: isCommentLiked ? "#ed4956" : "var(--text-secondary)",
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
            stroke={isCommentLiked ? "#ed4956" : "var(--text-secondary)"}
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
              borderLeft: "2px solid var(--text-tertiary)",
              borderBottom: "2px solid var(--text-tertiary)",
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
              color: "var(--primary)",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 4,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
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
                  : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"
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
            borderLeft: "2px solid var(--divider)",
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
            backgroundColor: "var(--modal-overlay)",
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
              backgroundColor: "var(--bg-card)",
              borderRadius: 10,
              maxWidth: 400,
              width: "100%",
              padding: "24px 24px 20px",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Delete Comment?
            </h3>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 14,
                color: "var(--text-secondary)",
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
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-hover)",
                  color: "var(--text-primary)",
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
      {/* Lightbox for comment image or detected GIF */}
      {lightboxImages.length > 0 && (
        <LightboxModal
          isOpen={isLightboxOpen}
          images={lightboxImages}
          initialIndex={0}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  );
}
