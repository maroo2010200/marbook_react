import React from "react";
import { CloseIcon, VideoIcon } from "./ChatAttachmentBubble";

export interface StagedAttachment {
  id: string;
  file: File;
  previewUrl?: string;
  type: "image" | "video" | "file";
  name: string;
  size: number;
}

interface ChatAttachmentStagingProps {
  stagedAttachments: StagedAttachment[];
  onRemove: (id: string) => void;
  isUploading?: boolean;
}

export const ChatAttachmentStaging: React.FC<ChatAttachmentStagingProps> = ({
  stagedAttachments,
  onRemove,
  isUploading = false,
}) => {
  if (stagedAttachments.length === 0) return null;

  return (
    <div
      style={{
        padding: "8px 12px",
        backgroundColor: "var(--bg-hover, rgba(0, 0, 0, 0.04))",
        borderTop: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        overflowX: "auto",
        maxWidth: "100%",
        scrollbarWidth: "thin",
      }}
    >
      {stagedAttachments.map((item) => (
        <div
          key={item.id}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px 5px 6px",
            borderRadius: 12,
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {item.type === "image" && item.previewUrl ? (
            <img
              src={item.previewUrl}
              alt={item.name}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : item.type === "video" ? (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: "#000000",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <VideoIcon size={18} />
            </div>
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: "var(--primary-light, rgba(217, 119, 6, 0.15))",
                color: "var(--primary, #d97706)",
                fontWeight: 800,
                fontSize: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                letterSpacing: 0.5,
              }}
            >
              {item.name.split(".").pop()?.toUpperCase() || "FILE"}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 130,
              minWidth: 60,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={item.name}
            >
              {item.name}
            </span>
            <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
              {(item.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>

          {!isUploading && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              title="Remove attachment"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <CloseIcon size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

