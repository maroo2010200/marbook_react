import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type { Post, PostVisibility } from "../types/posts";
import { mediaApi } from "../api/media";
import { getMediaUrl } from "../utils/media";
import { ImageAdjustModal } from "./ImageAdjustModal";
import { Avatar } from "./Avatar";

interface PostComposerProps {
  onPostCreated: (
    content: string,
    visibility?: PostVisibility,
    imageUrls?: string[]
  ) => Promise<Post>;
  defaultVisibility?: PostVisibility;
}

const MAX_CHAR_COUNT = 500;

interface AudienceOption {
  value: PostVisibility;
  title: string;
  subtitle: string;
  pillLabel: string;
}

const AUDIENCE_OPTIONS: AudienceOption[] = [
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
  visibility: PostVisibility;
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

export function PostComposer({
  onPostCreated,
  defaultVisibility = "Public",
}: PostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>(defaultVisibility);
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Media attachments state
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [adjustingIndex, setAdjustingIndex] = useState<number | null>(null);

  // Auto-adjust modal for newly picked image before upload
  const [pendingAdjust, setPendingAdjust] = useState<{
    file: File;
    objectUrl: string;
    fileName: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const audienceRef = useRef<HTMLDivElement | null>(null);

  // Sync visibility if defaultVisibility prop changes (e.g. switching feed tabs)
  useEffect(() => {
    setVisibility(defaultVisibility);
  }, [defaultVisibility]);

  // Close audience dropdown on outside click
  useEffect(() => {
    if (!isAudienceOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        audienceRef.current &&
        !audienceRef.current.contains(e.target as Node)
      ) {
        setIsAudienceOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAudienceOpen]);

  if (!user) return null;

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHAR_COUNT;
  const isNearLimit = charCount >= 450 && !isOverLimit;

  // Can submit if there is text or at least one image attached
  const hasText = content.trim().length > 0;
  const hasImages = imageUrls.length > 0;
  const canSubmit =
    (hasText || hasImages) && !isOverLimit && !isSubmitting && !isUploading;

  const currentOption =
    AUDIENCE_OPTIONS.find((opt) => opt.value === visibility) ||
    AUDIENCE_OPTIONS[0];

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > 10) {
      setError("You can attach a maximum of 10 images per post.");
      e.target.value = "";
      return;
    }

    if (files.length === 1) {
      // Single image selected: immediately open adjuster modal so user can zoom, pan & adjust!
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);
      setPendingAdjust({
        file,
        objectUrl,
        fileName: file.name,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Multiple images: upload them all
    setIsUploading(true);
    setError(null);
    try {
      const newUrls = await mediaApi.uploadMultiple(Array.from(files), "posts");
      setImageUrls((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to upload image(s). Only JPG, PNG, WebP, and GIF under 10MB are supported."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAdjustConfirm = async (croppedFile: File) => {
    if (adjustingIndex === null) return;
    const targetIdx = adjustingIndex;
    setAdjustingIndex(null);
    setIsUploading(true);
    try {
      const url = await mediaApi.upload(croppedFile, "posts");
      setImageUrls((prev) =>
        prev.map((item, i) => (i === targetIdx ? url : item))
      );
    } catch {
      setError("Failed to upload adjusted image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePendingAdjustConfirm = async (croppedFile: File) => {
    if (!pendingAdjust) return;
    const { objectUrl } = pendingAdjust;
    URL.revokeObjectURL(objectUrl);
    setPendingAdjust(null);

    setIsUploading(true);
    setError(null);
    try {
      const url = await mediaApi.upload(croppedFile, "posts");
      setImageUrls((prev) => [...prev, url]);
    } catch {
      setError("Failed to upload adjusted image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePendingSkipCrop = async () => {
    if (!pendingAdjust) return;
    const { file, objectUrl } = pendingAdjust;
    URL.revokeObjectURL(objectUrl);
    setPendingAdjust(null);

    setIsUploading(true);
    setError(null);
    try {
      const url = await mediaApi.upload(file, "posts");
      setImageUrls((prev) => [...prev, url]);
    } catch {
      setError("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePendingCancel = () => {
    if (pendingAdjust) {
      URL.revokeObjectURL(pendingAdjust.objectUrl);
    }
    setPendingAdjust(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await onPostCreated(
        content.trim(),
        visibility,
        imageUrls.length > 0 ? imageUrls : undefined
      );
      setContent("");
      setImageUrls([]);
      setVisibility(defaultVisibility);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err: any) {
      const resp = err.response?.data;
      const message =
        typeof resp === "string"
          ? resp
          : resp?.message ||
            resp?.title ||
            "Failed to create post. Please check your connection and try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (error) setError(null);

    // Auto-grow textarea to fit content cleanly
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 220)}px`;
  };

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        padding: "16px 20px",
        marginBottom: 20,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header: User avatar & details & Audience Switcher */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Avatar src={user.avatarUrl} name={user.name} size={40} />
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            {user.name}
          </div>

          {/* Interactive Audience Pill Dropdown */}
          <div style={{ position: "relative" }} ref={audienceRef}>
            <button
              type="button"
              onClick={() => setIsAudienceOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isAudienceOpen}
              title="Select post audience"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-color)",
                padding: "3px 8px",
                borderRadius: 6,
                marginTop: 4,
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-input)")
              }
            >
              <AudienceIcon visibility={visibility} size={12} />
              <span>{currentOption.pillLabel}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{
                  transform: isAudienceOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease",
                }}
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isAudienceOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 6,
                  backgroundColor: "var(--bg-card)",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-md)",
                  width: 270,
                  zIndex: 30,
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
                  Who can see your post?
                </div>

                {AUDIENCE_OPTIONS.map((opt) => {
                  const isSelected = visibility === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setVisibility(opt.value);
                        setIsAudienceOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        backgroundColor: isSelected
                          ? "var(--primary-light)"
                          : "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "background-color 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-hover)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected
                          ? "var(--primary-light)"
                          : "transparent";
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
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
                        <AudienceIcon
                          visibility={opt.value}
                          size={15}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected
                              ? "var(--primary)"
                              : "var(--text-primary)",
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
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ position: "relative" }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            placeholder={`What's on your mind, ${user.name}?`}
            rows={3}
            disabled={isSubmitting}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: isOverLimit
                ? "1.5px solid #e02424"
                : "1px solid var(--border-color)",
              borderRadius: 8,
              padding: "12px 14px",
              fontSize: 15,
              lineHeight: 1.5,
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-input)",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              transition:
                "border-color 0.15s ease, background-color 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-card)";
              if (!isOverLimit) {
                e.currentTarget.style.borderColor = "var(--primary)";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-input)";
              if (!isOverLimit) {
                e.currentTarget.style.borderColor = "var(--border-color)";
              }
            }}
          />
        </div>

        {/* Attachment Previews Tray */}
        {imageUrls.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 10,
              padding: 8,
              backgroundColor: "var(--bg-hover)",
              borderRadius: 8,
            }}
          >
            {imageUrls.map((url, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  width: 88,
                  height: 88,
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-card)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <img
                  src={getMediaUrl(url)}
                  alt={`Attachment ${idx + 1}`}
                  onClick={() => setAdjustingIndex(idx)}
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
                  onClick={() => setAdjustingIndex(idx)}
                  title="Adjust (Zoom, Pan, Crop)"
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: 4,
                    right: 4,
                    height: 22,
                    borderRadius: 4,
                    backgroundColor: "rgba(0, 0, 0, 0.72)",
                    color: "#fff",
                    border: "none",
                    fontSize: 11,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    cursor: "pointer",
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <span>✂️</span>
                  <span>Adjust</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  title="Remove image"
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    backgroundColor: "rgba(0, 0, 0, 0.72)",
                    color: "#fff",
                    border: "none",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
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

        {/* Attachment Action Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-card)",
            transition: "background-color 0.2s ease, border-color 0.2s ease",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            Add to your post
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFilesSelected}
              style={{ display: "none" }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSubmitting || imageUrls.length >= 10}
              title="Attach photos"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 6,
                border: "none",
                backgroundColor: "transparent",
                cursor: imageUrls.length >= 10 ? "not-allowed" : "pointer",
                color: "#45bd62",
                fontWeight: 600,
                fontSize: 13,
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (imageUrls.length < 10)
                  e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              }}
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: "#45bd62" }}
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7-3 3.72L9 13l-3 4h12l-4-5z" />
              </svg>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {isUploading ? "Uploading..." : "Photo/image"}
              </span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              backgroundColor: "#fde8e8",
              color: "#9b1c1c",
              border: "1px solid #f8b4b4",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 13,
              marginTop: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              style={{
                background: "none",
                border: "none",
                color: "#9b1c1c",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                padding: 0,
                marginLeft: 8,
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Footer: Character Counter & Post Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          {/* Character counter */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: isOverLimit
                ? "#e02424"
                : isNearLimit
                ? "#f59e0b"
                : "var(--text-secondary)",
              transition: "color 0.15s ease",
            }}
          >
            {charCount}/{MAX_CHAR_COUNT}
          </span>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              backgroundColor: canSubmit ? "var(--primary)" : "var(--bg-hover)",
              color: canSubmit ? "#fff" : "var(--text-tertiary)",
              border: "none",
              borderRadius: 6,
              padding: "8px 20px",
              fontWeight: 600,
              fontSize: 14,
              cursor: canSubmit ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "background-color 0.15s ease, transform 0.1s ease",
            }}
            onMouseDown={(e) => {
              if (canSubmit) e.currentTarget.style.transform = "scale(0.97)";
            }}
            onMouseUp={(e) => {
              if (canSubmit) e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {isSubmitting ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255, 255, 255, 0.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span>Posting...</span>
              </>
            ) : (
              "Post"
            )}
          </button>
        </div>
      </form>
      {/* Re-adjust Existing Attached Image Modal */}
      <ImageAdjustModal
        isOpen={adjustingIndex !== null}
        imageSrc={
          adjustingIndex !== null && imageUrls[adjustingIndex]
            ? getMediaUrl(imageUrls[adjustingIndex])
            : ""
        }
        fileName="post-image.jpg"
        allowAspectChange={true}
        title="Adjust Post Picture"
        onConfirm={handleAdjustConfirm}
        onCancel={() => setAdjustingIndex(null)}
      />

      {/* Adjust Newly Selected Picture Before Upload */}
      <ImageAdjustModal
        isOpen={pendingAdjust !== null}
        imageSrc={pendingAdjust?.objectUrl || ""}
        fileName={pendingAdjust?.fileName || "post-image.jpg"}
        allowAspectChange={true}
        title="Adjust & Position Picture"
        onConfirm={handlePendingAdjustConfirm}
        onSkipCrop={handlePendingSkipCrop}
        onCancel={handlePendingCancel}
      />
    </div>
  );
}
