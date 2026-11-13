import React from "react";
import type { MediaDetection } from "../../utils/richText";

interface ChatAttachmentBubbleProps {
  attachment: MediaDetection;
  isMine: boolean;
  onImageClick?: (url: string) => void;
  isPureMedia?: boolean;
  onMediaLoaded?: () => void;
}

export function PaperclipIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export function UploadCloudIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
}

export function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function VideoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function DownloadIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function getBadgeStyle(ext?: string) {
  const e = ext?.toUpperCase() || "FILE";
  if (e === "PDF") {
    return { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" };
  }
  if (["ZIP", "RAR", "7Z", "TAR", "GZ"].includes(e)) {
    return { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" };
  }
  if (["DOC", "DOCX"].includes(e)) {
    return { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" };
  }
  if (["XLS", "XLSX", "CSV"].includes(e)) {
    return { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981" };
  }
  return { bg: "rgba(217, 119, 6, 0.15)", color: "var(--primary, #d97706)" };
}

export const ChatAttachmentBubble: React.FC<ChatAttachmentBubbleProps> = ({
  attachment,
  isMine,
  onImageClick,
  isPureMedia = false,
  onMediaLoaded,
}) => {
  // 1. VIDEO ATTACHMENT
  if (attachment.isVideo) {
    return (
      <div
        style={{
          position: "relative",
          borderRadius: isPureMedia ? 16 : 12,
          overflow: "hidden",
          maxWidth: 320,
          backgroundColor: "#000000",
          boxShadow: isPureMedia
            ? "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.18))"
            : "0 2px 8px rgba(0,0,0,0.12)",
          border: isPureMedia ? "1px solid var(--border-color)" : "none",
        }}
      >
        <video
          src={attachment.mediaUrl}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={onMediaLoaded}
          style={{
            maxWidth: "100%",
            maxHeight: 280,
            display: "block",
            borderRadius: isPureMedia ? 16 : 12,
            outline: "none",
            backgroundColor: "#000000",
          }}
        />
      </div>
    );
  }

  // 2. DOCUMENT / FILE ATTACHMENT
  if (attachment.isFile) {
    const badgeStyle = getBadgeStyle(attachment.fileExt);

    return (
      <div
        onClick={() => {
          window.open(attachment.mediaUrl, "_blank", "noopener,noreferrer");
        }}
        title={`Download ${attachment.fileName || "attachment"}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          borderRadius: 14,
          backgroundColor: isMine ? "var(--bg-card)" : "var(--bg-hover)",
          border: "1px solid var(--border-color)",
          maxWidth: 300,
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
          cursor: "pointer",
          transition: "border-color 0.15s ease, transform 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-color)";
        }}
      >
        {/* Extension Badge */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: badgeStyle.bg,
            color: badgeStyle.color,
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: 0.5,
            flexShrink: 0,
            border: `1px solid ${badgeStyle.color}40`,
          }}
        >
          {attachment.fileExt || "FILE"}
        </div>

        {/* File Name & Prompt */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: 13,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "var(--text-primary)",
            }}
            title={attachment.fileName || "File"}
          >
            {attachment.fileName || "Shared file"}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
            }}
          >
            Click to download
          </span>
        </div>

        {/* Download Button */}
        <a
          href={attachment.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={attachment.fileName}
          onClick={(e) => e.stopPropagation()}
          title="Download attachment"
          aria-label={`Download ${attachment.fileName || "file"}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 8,
            backgroundColor: "var(--bg-hover)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            cursor: "pointer",
            flexShrink: 0,
            textDecoration: "none",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--primary)";
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.transform = "scale(1.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <DownloadIcon size={16} />
        </a>
      </div>
    );
  }

  // 3. IMAGE / GIF ATTACHMENT
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onImageClick) {
          onImageClick(attachment.mediaUrl);
        } else {
          // Broadcast in-app modal event instead of navigating away
          window.dispatchEvent(
            new CustomEvent("open-media-lightbox", {
              detail: { url: attachment.mediaUrl },
            })
          );
        }
      }}
      title="Click to view full size"
      style={{
        position: "relative",
        borderRadius: isPureMedia ? 16 : 12,
        overflow: "hidden",
        maxWidth: 320,
        cursor: "pointer",
        backgroundColor: "rgba(0,0,0,0.12)",
        border: isPureMedia ? "1px solid var(--border-color)" : "none",
        boxShadow: isPureMedia
          ? "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.18))"
          : "none",
      }}
    >
      <img
        src={attachment.mediaUrl}
        alt="Shared media"
        loading="lazy"
        onLoad={onMediaLoaded}
        style={{
          maxWidth: "100%",
          maxHeight: 280,
          objectFit: "contain",
          display: "block",
          borderRadius: isPureMedia ? 16 : 12,
        }}
      />
    </div>
  );
};
