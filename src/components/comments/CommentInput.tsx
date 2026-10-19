import { useRef, type RefObject, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { mediaApi } from "../../api/media";
import { getMediaUrl } from "../../utils/media";
import { extractMediaUrlFromLink } from "../../utils/richText";

export interface CommentInputProps {
  isAuthenticated: boolean;
  replyingTo: { commentId: number; userName: string } | null;
  newComment: string;
  submitting: boolean;
  submitError: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onChangeComment: (val: string) => void;
  onCancelReply: () => void;
  onSubmit: (e: FormEvent) => void;
  attachedImageUrl: string | null;
  onAttachImage: (url: string | null) => void;
  isUploadingImage: boolean;
  onUploadingChange: (uploading: boolean) => void;
}

export function CommentInput({
  isAuthenticated,
  replyingTo,
  newComment,
  submitting,
  submitError,
  inputRef,
  onChangeComment,
  onCancelReply,
  onSubmit,
  attachedImageUrl,
  onAttachImage,
  isUploadingImage,
  onUploadingChange,
}: CommentInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isAuthenticated) {
    return (
      <div
        style={{
          borderTop: "1px solid #efefef",
          padding: "16px 18px",
          backgroundColor: "#fff",
          textAlign: "center",
          fontSize: 13,
          color: "#8e8e8e",
        }}
      >
        Please{" "}
        <Link
          to="/login"
          style={{
            color: "#0095f6",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Log In
        </Link>{" "}
        or{" "}
        <Link
          to="/register"
          style={{
            color: "#0095f6",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Register
        </Link>{" "}
        to leave a comment.
      </div>
    );
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onUploadingChange(true);
    try {
      const url = await mediaApi.upload(file, "comments");
      onAttachImage(url);
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          "Failed to upload image. Supported: JPG, PNG, WebP, GIF under 10MB."
      );
    } finally {
      onUploadingChange(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const canSubmit =
    (newComment.trim().length > 0 || Boolean(attachedImageUrl)) &&
    !submitting &&
    !isUploadingImage;

  return (
    <div
      style={{
        borderTop: "1px solid #efefef",
        padding: "12px 18px",
        backgroundColor: "#fff",
      }}
    >
      <form onSubmit={onSubmit} style={{ margin: 0 }}>
        {/* Replying banner indicator */}
        {replyingTo && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 12px",
              backgroundColor: "#f0f2f5",
              borderRadius: 8,
              marginBottom: 8,
              fontSize: 13,
              color: "#65676b",
            }}
          >
            <span>
              Replying to{" "}
              <strong style={{ color: "#1c1e21" }}>
                @{replyingTo.userName}
              </strong>
            </span>
            <button
              type="button"
              onClick={onCancelReply}
              aria-label="Cancel reply"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#65676b",
                fontWeight: 700,
                fontSize: 14,
                padding: "0 4px",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Attached Image/GIF Thumbnail Preview */}
        {attachedImageUrl && (
          <div
            style={{
              position: "relative",
              display: "inline-block",
              marginBottom: 8,
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid #dbdbdb",
              backgroundColor: "#f0f2f5",
            }}
          >
            <img
              src={getMediaUrl(attachedImageUrl)}
              alt="Attached comment preview"
              style={{
                width: 60,
                height: 60,
                objectFit: "cover",
                display: "block",
              }}
            />
            <button
              type="button"
              onClick={() => onAttachImage(null)}
              title="Remove attachment"
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "rgba(0, 0, 0, 0.65)",
                color: "#fff",
                border: "none",
                fontSize: 10,
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

        {/* Submission error message */}
        {submitError && (
          <div
            style={{
              color: "#e02424",
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            {submitError}
          </div>
        )}

        {/* Input & Action Buttons Row */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Hidden image file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          {/* Attach Image / GIF button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting || isUploadingImage}
            title="Attach image or GIF"
            style={{
              background: "none",
              border: "none",
              cursor: submitting || isUploadingImage ? "not-allowed" : "pointer",
              padding: "6px",
              color: isUploadingImage ? "#94b8ea" : "#45bd62",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f2f5")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7-3 3.72L9 13l-3 4h12l-4-5z" />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder={
              replyingTo
                ? `Reply to @${replyingTo.userName}...`
                : "Write a comment or attach GIF/image..."
            }
            value={newComment}
            onChange={(e) => {
              const val = e.target.value;
              onChangeComment(val);
              if (!attachedImageUrl) {
                const detected = extractMediaUrlFromLink(val.trim());
                if (detected) {
                  onAttachImage(detected.mediaUrl);
                  onChangeComment("");
                }
              }
            }}
            disabled={submitting}
            style={{
              flex: 1,
              border: "1px solid #dbdbdb",
              borderRadius: 20,
              padding: "8px 14px",
              fontSize: 14,
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              background: "none",
              border: "none",
              color: !canSubmit ? "#b2dffc" : "#0095f6",
              fontWeight: 600,
              fontSize: 14,
              cursor: !canSubmit ? "default" : "pointer",
              padding: "6px 10px",
            }}
          >
            {submitting
              ? replyingTo
                ? "Replying..."
                : "Posting..."
              : isUploadingImage
              ? "Uploading..."
              : replyingTo
              ? "Reply"
              : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
