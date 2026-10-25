import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Post, PostVisibility } from "../types/posts";
import { postsApi } from "../api/posts";
import { mediaApi } from "../api/media";
import { getMediaUrl } from "../utils/media";
import { PostImagesGrid } from "./PostImagesGrid";
import { LightboxModal } from "./LightboxModal";
import { ImageAdjustModal } from "./ImageAdjustModal";
import { Avatar } from "./Avatar";
import { parseRichText } from "../utils/richText";

interface PostCardProps {
  post: Post;
  isLiked: boolean;
  currentUserId?: number;
  onToggleLike: (postId: number) => void;
  onOpenComments: (post: Post) => void;
  onPostUpdated: (updatedPost: Post) => void;
  onPostDeleted: (postId: number) => void;
}

const MAX_CHAR_COUNT = 500;

const AUDIENCE_OPTIONS: {
  value: PostVisibility;
  title: string;
  subtitle: string;
  pillLabel: string;
}[] = [
  {
    value: "Public",
    title: "Public",
    subtitle: "Anyone on or off Marbook",
    pillLabel: "Public",
  },
  {
    value: "Followers",
    title: "Followers only",
    subtitle: "Only people who follow you",
    pillLabel: "Followers",
  },
  {
    value: "Private",
    title: "Private (Only Me)",
    subtitle: "Only you can see this post",
    pillLabel: "Only Me",
  },
];

function AudienceIcon({
  visibility,
  size = 12,
}: {
  visibility?: PostVisibility;
  size?: number;
}) {
  if (visibility === "Private") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    );
  }

  if (visibility === "Followers") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  // Public
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function formatCount(count: number): string {
  if (count <= 0) return "";
  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (count >= 1_000) {
    return (count / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return count.toString();
}

export function PostCard({
  post,
  isLiked,
  currentUserId,
  onToggleLike,
  onOpenComments,
  onPostUpdated,
  onPostDeleted,
}: PostCardProps) {
  const isAuthor = Boolean(currentUserId && currentUserId === post.userId);

  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editVisibility, setEditVisibility] = useState<PostVisibility>(
    post.visibility || "Public"
  );
  const [isEditAudienceOpen, setIsEditAudienceOpen] = useState(false);
  const editAudienceRef = useRef<HTMLDivElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Edit images state & Lightbox state
  const [editImageUrls, setEditImageUrls] = useState<string[]>(
    post.imageUrls || []
  );
  const [isUploadingEditImages, setIsUploadingEditImages] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const [adjustingEditIndex, setAdjustingEditIndex] = useState<number | null>(
    null
  );
  const [pendingEditAdjust, setPendingEditAdjust] = useState<{
    file: File;
    objectUrl: string;
    fileName: string;
  } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Close dropdown on outside click
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

  // Close edit audience dropdown on outside click
  useEffect(() => {
    if (!isEditAudienceOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        editAudienceRef.current &&
        !editAudienceRef.current.contains(e.target as Node)
      ) {
        setIsEditAudienceOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditAudienceOpen]);

  // Adjust textarea height on entering edit mode
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.style.height = "auto";
      editTextareaRef.current.style.height = `${Math.min(
        editTextareaRef.current.scrollHeight,
        240
      )}px`;
      editTextareaRef.current.focus();
    }
  }, [isEditing]);

  const createdDateObj = new Date(post.createdAt);
  const updatedDateObj = post.updatedAt ? new Date(post.updatedAt) : null;

  const postDate = createdDateObj.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Considered edited if updatedAt is at least 3 seconds after createdAt
  const isEdited =
    Boolean(updatedDateObj) &&
    updatedDateObj!.getTime() > createdDateObj.getTime() + 3000;

  const editedDate = isEdited && updatedDateObj
    ? (() => {
        const isSameDay =
          createdDateObj.getFullYear() === updatedDateObj.getFullYear() &&
          createdDateObj.getMonth() === updatedDateObj.getMonth() &&
          createdDateObj.getDate() === updatedDateObj.getDate();

        if (isSameDay) {
          return updatedDateObj.toLocaleTimeString(undefined, {
            timeStyle: "short",
          });
        }
        return updatedDateObj.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });
      })()
    : null;

  const likesCount = post.likesCount ?? (isLiked ? 1 : 0);
  const commentsCount = post.commentsCount ?? 0;

  // Edit handlers
  const handleStartEdit = () => {
    setIsMenuOpen(false);
    setEditContent(post.content);
    setEditVisibility(post.visibility || "Public");
    setEditImageUrls(post.imageUrls || []);
    setIsEditAudienceOpen(false);
    setEditError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
    setEditVisibility(post.visibility || "Public");
    setEditImageUrls(post.imageUrls || []);
    setIsEditAudienceOpen(false);
    setEditError(null);
  };

  const handleEditFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (editImageUrls.length + files.length > 10) {
      setEditError("You can attach a maximum of 10 images per post.");
      e.target.value = "";
      return;
    }

    if (files.length === 1) {
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);
      setPendingEditAdjust({
        file,
        objectUrl,
        fileName: file.name,
      });
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      return;
    }

    setIsUploadingEditImages(true);
    setEditError(null);
    try {
      const newUrls = await mediaApi.uploadMultiple(Array.from(files), "posts");
      setEditImageUrls((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setEditError(
        err.response?.data?.message ||
          "Failed to upload image(s). Only JPG, PNG, WebP, and GIF under 10MB are supported."
      );
    } finally {
      setIsUploadingEditImages(false);
      if (editFileInputRef.current) {
        editFileInputRef.current.value = "";
      }
    }
  };

  const handleAdjustEditConfirm = async (croppedFile: File) => {
    if (adjustingEditIndex === null) return;
    const targetIdx = adjustingEditIndex;
    setAdjustingEditIndex(null);
    setIsUploadingEditImages(true);
    try {
      const url = await mediaApi.upload(croppedFile, "posts");
      setEditImageUrls((prev) =>
        prev.map((item, i) => (i === targetIdx ? url : item))
      );
    } catch {
      setEditError("Failed to upload adjusted image.");
    } finally {
      setIsUploadingEditImages(false);
    }
  };

  const handlePendingEditAdjustConfirm = async (croppedFile: File) => {
    if (!pendingEditAdjust) return;
    const { objectUrl } = pendingEditAdjust;
    URL.revokeObjectURL(objectUrl);
    setPendingEditAdjust(null);

    setIsUploadingEditImages(true);
    setEditError(null);
    try {
      const url = await mediaApi.upload(croppedFile, "posts");
      setEditImageUrls((prev) => [...prev, url]);
    } catch {
      setEditError("Failed to upload adjusted image.");
    } finally {
      setIsUploadingEditImages(false);
    }
  };

  const handlePendingEditSkipCrop = async () => {
    if (!pendingEditAdjust) return;
    const { file, objectUrl } = pendingEditAdjust;
    URL.revokeObjectURL(objectUrl);
    setPendingEditAdjust(null);

    setIsUploadingEditImages(true);
    setEditError(null);
    try {
      const url = await mediaApi.upload(file, "posts");
      setEditImageUrls((prev) => [...prev, url]);
    } catch {
      setEditError("Failed to upload image.");
    } finally {
      setIsUploadingEditImages(false);
    }
  };

  const handlePendingEditCancel = () => {
    if (pendingEditAdjust) {
      URL.revokeObjectURL(pendingEditAdjust.objectUrl);
    }
    setPendingEditAdjust(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editContent.trim();
    if (
      trimmed.length > MAX_CHAR_COUNT ||
      isSaving ||
      isUploadingEditImages
    )
      return;
    if (!trimmed && editImageUrls.length === 0) return;

    const hasContentChanged = trimmed !== post.content;
    const hasVisibilityChanged =
      editVisibility !== (post.visibility || "Public");
    const hasImagesChanged =
      JSON.stringify(editImageUrls) !== JSON.stringify(post.imageUrls || []);

    if (!hasContentChanged && !hasVisibilityChanged && !hasImagesChanged) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const updated = await postsApi.updatePost(
        post.id,
        trimmed,
        editVisibility,
        editImageUrls
      );
      onPostUpdated(updated);
      setIsEditing(false);
    } catch {
      setEditError("Failed to update post. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handlers
  const handleOpenDeleteModal = () => {
    setIsMenuOpen(false);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await postsApi.deletePost(post.id);
      setIsDeleteModalOpen(false);
      onPostDeleted(post.id);
    } catch {
      setDeleteError("Failed to delete post. Please try again.");
      setIsDeleting(false);
    }
  };

  const editCharCount = editContent.length;
  const isEditOverLimit = editCharCount > MAX_CHAR_COUNT;
  const hasContentChanged = editContent.trim() !== post.content;
  const hasVisibilityChanged =
    editVisibility !== (post.visibility || "Public");
  const hasImagesChanged =
    JSON.stringify(editImageUrls) !== JSON.stringify(post.imageUrls || []);
  const canSave =
    (editContent.trim().length > 0 || editImageUrls.length > 0) &&
    !isEditOverLimit &&
    !isSaving &&
    !isUploadingEditImages &&
    (hasContentChanged || hasVisibilityChanged || hasImagesChanged);

  return (
    <article
      id={`post-${post.id}`}
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-lg)",
        padding: "18px 20px",
        marginBottom: 16,
        boxShadow: "var(--shadow-card)",
        position: "relative",
        transition: "all 0.2s ease",
      }}
    >
      {/* Header: Avatar, author name, timestamp, and optional author actions menu */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            to={`/profile/${post.userId}`}
            style={{ textDecoration: "none", flexShrink: 0 }}
            title={`View ${post.userName}'s profile`}
          >
            <Avatar
              src={post.userAvatarUrl}
              name={post.userName}
              size={40}
              style={{ cursor: "pointer", transition: "opacity 0.15s ease" }}
            />
          </Link>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Link
              to={`/profile/${post.userId}`}
              style={{
                fontWeight: 600,
                fontSize: 15,
                color: "var(--text-primary)",
                lineHeight: 1.25,
                textDecoration: "none",
                display: "inline-block",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.textDecoration = "underline")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.textDecoration = "none")
              }
            >
              {post.userName}
            </Link>
            <small
              style={{
                color: "var(--text-secondary)",
                fontSize: 12,
                lineHeight: 1.3,
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              <span>{postDate}</span>
              <span style={{ margin: "0 2px", color: "var(--text-tertiary)" }}>•</span>
              <span
                title={
                  post.visibility === "Private"
                    ? "Audience: Only me (Private)"
                    : post.visibility === "Followers"
                    ? "Audience: Followers only"
                    : "Audience: Public"
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  color: "var(--text-secondary)",
                  cursor: "help",
                }}
              >
                <AudienceIcon visibility={post.visibility} size={11} />
                <span>
                  {post.visibility === "Private"
                    ? "Only Me"
                    : post.visibility === "Followers"
                    ? "Followers"
                    : "Public"}
                </span>
              </span>
              {isEdited && editedDate && (
                <span
                  title={`Edited at ${new Date(post.updatedAt).toLocaleString(
                    undefined,
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )}`}
                  style={{
                    color: "var(--text-tertiary)",
                    fontStyle: "italic",
                    cursor: "help",
                  }}
                >
                  • Edited at {editedDate}
                </span>
              )}
            </small>
          </div>
        </div>

        {/* Three dots menu for post author */}
        {isAuthor && (
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Post options"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 8px",
                borderRadius: "50%",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="2" />
                <circle cx="6" cy="12" r="2" />
                <circle cx="18" cy="12" r="2" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  backgroundColor: "var(--bg-card)",
                  boxShadow: "var(--shadow-md)",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  width: 150,
                  zIndex: 20,
                  overflow: "hidden",
                  padding: "4px 0",
                }}
              >
                <button
                  type="button"
                  onClick={handleStartEdit}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: 14,
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
                    width="16"
                    height="16"
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
                  <span>Edit post</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenDeleteModal}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: 14,
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
                    width="16"
                    height="16"
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
                  <span>Delete post</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Body: Normal text OR Inline Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} style={{ marginTop: 8 }}>
          <textarea
            ref={editTextareaRef}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              const target = e.target;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 240)}px`;
            }}
            rows={3}
            disabled={isSaving}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: isEditOverLimit
                ? "1.5px solid #e02424"
                : "1.5px solid var(--border-color)",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 15,
              lineHeight: 1.5,
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
                backgroundColor: "#fde8e8",
                color: "#9b1c1c",
                padding: "6px 10px",
                borderRadius: 4,
                fontSize: 13,
                marginTop: 6,
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
              marginTop: 10,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Audience Selector Dropdown in Edit Mode */}
              <div style={{ position: "relative" }} ref={editAudienceRef}>
                <button
                  type="button"
                  onClick={() => setIsEditAudienceOpen((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={isEditAudienceOpen}
                  title="Change audience"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    padding: "4px 9px",
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-card)")
                  }
                >
                  <AudienceIcon visibility={editVisibility} size={12} />
                  <span>
                    {editVisibility === "Private"
                      ? "Only Me"
                      : editVisibility === "Followers"
                      ? "Followers"
                      : "Public"}
                  </span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{
                      transform: isEditAudienceOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </button>

                {isEditAudienceOpen && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: 0,
                      marginBottom: 6,
                      backgroundColor: "var(--bg-card)",
                      borderRadius: 8,
                      border: "1px solid var(--border-color)",
                      boxShadow: "var(--shadow-md)",
                      width: 250,
                      zIndex: 35,
                      overflow: "hidden",
                      padding: "6px 0",
                    }}
                  >
                    <div
                      style={{
                        padding: "6px 14px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: "1px solid var(--divider)",
                      }}
                    >
                      Change audience
                    </div>

                    {AUDIENCE_OPTIONS.map((opt) => {
                      const isSelected = editVisibility === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setEditVisibility(opt.value);
                            setIsEditAudienceOpen(false);
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "9px 14px",
                            backgroundColor: isSelected
                              ? "var(--bg-hover)"
                              : "transparent",
                            border: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "background-color 0.12s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = isSelected
                              ? "var(--bg-hover)"
                              : "transparent";
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              backgroundColor: isSelected
                                ? "var(--primary)"
                                : "var(--bg-hover)",
                              color: isSelected ? "#fff" : "var(--text-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <AudienceIcon visibility={opt.value} size={14} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: isSelected ? 700 : 600,
                                color: isSelected ? "var(--primary)" : "var(--text-primary)",
                                lineHeight: 1.25,
                              }}
                            >
                              {opt.title}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--text-secondary)",
                                lineHeight: 1.3,
                                marginTop: 2,
                              }}
                            >
                              {opt.subtitle}
                            </div>
                          </div>

                          {isSelected && (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--primary)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <span
                style={{
                  fontSize: 12,
                  color: isEditOverLimit ? "#e02424" : "var(--text-secondary)",
                }}
              >
                {editCharCount}/{MAX_CHAR_COUNT}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-hover)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canSave}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: canSave ? "var(--primary)" : "var(--border-color)",
                  color: canSave ? "#fff" : "var(--text-tertiary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: canSave ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          {/* Edit images staging tray */}
          {editImageUrls.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
                padding: 8,
                backgroundColor: "var(--bg-hover)",
                borderRadius: 8,
              }}
            >
              {editImageUrls.map((url, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-card)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <img
                    src={getMediaUrl(url)}
                    alt=""
                    onClick={() => setAdjustingEditIndex(idx)}
                    title="Click to adjust & crop"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustingEditIndex(idx)}
                    title="Adjust (Zoom, Pan, Crop)"
                    style={{
                      position: "absolute",
                      bottom: 3,
                      left: 3,
                      right: 3,
                      height: 20,
                      borderRadius: 4,
                      backgroundColor: "rgba(0, 0, 0, 0.72)",
                      color: "#fff",
                      border: "none",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    <span>✂️</span>
                    <span>Adjust</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditImageUrls((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    title="Remove image"
                    style={{
                      position: "absolute",
                      top: 3,
                      right: 3,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "rgba(0,0,0,0.72)",
                      color: "#fff",
                      border: "none",
                      fontSize: 11,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add image button in edit mode */}
          <div style={{ marginTop: 8 }}>
            <input
              ref={editFileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleEditFilesSelected}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => editFileInputRef.current?.click()}
              disabled={
                isUploadingEditImages || editImageUrls.length >= 10
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: 6,
                border: "1px solid var(--border-color)",
                background: "var(--bg-hover)",
                cursor:
                  editImageUrls.length >= 10 ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: "#45bd62",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7-3 3.72L9 13l-3 4h12l-4-5z" />
              </svg>
              <span style={{ color: "var(--text-secondary)" }}>
                {isUploadingEditImages ? "Uploading..." : "Add photos"}
              </span>
            </button>
          </div>
        </form>
      ) : (
        <>
          {post.content && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 15,
                lineHeight: 1.5,
                color: "var(--text-primary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {parseRichText(post.content, { linkColor: "#1877f2", hidePureMediaUrl: false }).nodes}
            </p>
          )}

          {post.imageUrls && post.imageUrls.length > 0 && (
            <PostImagesGrid
              images={post.imageUrls}
              onImageClick={(idx) => setLightboxIndex(idx)}
            />
          )}
        </>
      )}

      {/* Post Actions: Like & Comment */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid var(--divider)",
        }}
      >
        {/* Heart / Like Button */}
        <button
          type="button"
          onClick={() => onToggleLike(post.id)}
          aria-label={isLiked ? "Unlike post" : "Like post"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 7,
            color: isLiked ? "#ed4956" : "var(--text-secondary)",
            transition: "transform 0.1s ease",
          }}
          onMouseDown={(e) =>
            (e.currentTarget.style.transform = "scale(0.92)")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.transform = "scale(1)")
          }
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={isLiked ? "#ed4956" : "none"}
            stroke={isLiked ? "#ed4956" : "var(--text-secondary)"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: "fill 0.15s ease, stroke 0.15s ease",
            }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likesCount > 0 && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: isLiked ? "#ed4956" : "var(--text-secondary)",
              }}
            >
              {formatCount(likesCount)}
            </span>
          )}
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={() => onOpenComments(post)}
          aria-label="Comment on post"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 7,
            color: "var(--text-secondary)",
            transition: "transform 0.1s ease",
          }}
          onMouseDown={(e) =>
            (e.currentTarget.style.transform = "scale(0.92)")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.transform = "scale(1)")
          }
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-secondary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          {commentsCount > 0 && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              {formatCount(commentsCount)}
            </span>
          )}
        </button>
      </div>

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
            zIndex: 1100,
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
              maxWidth: 420,
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
              Delete Post?
            </h3>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.4,
              }}
            >
              Are you sure you want to delete this post? This action cannot be
              undone and will remove all associated comments and likes.
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
      <LightboxModal
        isOpen={lightboxIndex !== null}
        images={post.imageUrls || []}
        initialIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />

      {/* Re-adjust Existing Attached Image in Edit Mode */}
      <ImageAdjustModal
        isOpen={adjustingEditIndex !== null}
        imageSrc={
          adjustingEditIndex !== null && editImageUrls[adjustingEditIndex]
            ? getMediaUrl(editImageUrls[adjustingEditIndex])
            : ""
        }
        fileName="post-image.jpg"
        allowAspectChange={true}
        title="Adjust Post Picture"
        onConfirm={handleAdjustEditConfirm}
        onCancel={() => setAdjustingEditIndex(null)}
      />

      {/* Adjust Newly Added Picture Before Uploading to Post */}
      <ImageAdjustModal
        isOpen={pendingEditAdjust !== null}
        imageSrc={pendingEditAdjust?.objectUrl || ""}
        fileName={pendingEditAdjust?.fileName || "post-image.jpg"}
        allowAspectChange={true}
        title="Adjust & Position Picture"
        onConfirm={handlePendingEditAdjustConfirm}
        onSkipCrop={handlePendingEditSkipCrop}
        onCancel={handlePendingEditCancel}
      />
    </article>
  );
}
