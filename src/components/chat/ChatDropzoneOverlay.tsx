import React from "react";
import { UploadCloudIcon } from "./ChatAttachmentBubble";

interface ChatDropzoneOverlayProps {
  isVisible: boolean;
  targetName?: string;
}

export const ChatDropzoneOverlay: React.FC<ChatDropzoneOverlayProps> = ({
  isVisible,
  targetName,
}) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 8,
        backgroundColor: "rgba(24, 21, 19, 0.82)",
        backdropFilter: "blur(6px)",
        borderRadius: 18,
        border: "2px dashed var(--primary, #d97706)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: "#ffffff",
        pointerEvents: "none",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: "var(--primary-light, rgba(217, 119, 6, 0.22))",
          color: "var(--primary, #f59e0b)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(245, 158, 11, 0.3)",
        }}
      >
        <UploadCloudIcon size={32} />
      </div>

      <div style={{ textAlign: "center", padding: "0 16px" }}>
        <p style={{ fontWeight: 700, fontSize: 16, margin: 0, color: "#ffffff" }}>
          Drop files to send {targetName ? `to ${targetName}` : ""}
        </p>
        <p
          style={{
            fontSize: 12.5,
            opacity: 0.8,
            margin: "4px 0 0 0",
            color: "rgba(255, 255, 255, 0.85)",
          }}
        >
          Photos, videos, or documents up to 100MB
        </p>
      </div>
    </div>
  );
};

