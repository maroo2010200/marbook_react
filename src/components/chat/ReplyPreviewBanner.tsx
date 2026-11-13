import type { Message } from "../../types/chat";
import { ReplyIcon, CloseIcon } from "./ChatIcons";

interface ReplyPreviewBannerProps {
  replyTo: Message | null;
  onCancel: () => void;
  compact?: boolean;
}

export function ReplyPreviewBanner({
  replyTo,
  onCancel,
  compact = false,
}: ReplyPreviewBannerProps) {
  if (!replyTo) return null;

  // Clean snippet: replace line breaks with spaces
  const snippet = replyTo.isDeleted
    ? "This message was deleted"
    : replyTo.content.replace(/\s+/g, " ").trim();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: compact ? "6px 10px" : "8px 14px",
        backgroundColor: "var(--bg-hover)",
        borderLeft: "4px solid var(--primary)",
        borderTop: "1px solid var(--border-color)",
        borderRadius: "8px 8px 0 0",
        position: "relative",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          flex: 1,
        }}
      >
        <span
          style={{
            color: "var(--primary)",
            display: "inline-flex",
            flexShrink: 0,
          }}
        >
          <ReplyIcon size={compact ? 13 : 15} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: compact ? 11 : 12,
              fontWeight: 700,
              color: "var(--primary)",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Replying to {replyTo.senderName || "User"}
          </div>
          <div
            style={{
              fontSize: compact ? 11 : 12,
              color: "var(--text-secondary)",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontStyle: replyTo.isDeleted ? "italic" : "normal",
            }}
          >
            {snippet || "(attachment)"}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        title="Cancel reply"
        aria-label="Cancel reply"
        style={{
          width: compact ? 22 : 24,
          height: compact ? 22 : 24,
          borderRadius: "50%",
          border: "none",
          backgroundColor: "transparent",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          padding: 0,
          transition: "background-color 0.15s ease, color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.08)";
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "var(--text-muted)";
        }}
      >
        <CloseIcon size={compact ? 13 : 14} />
      </button>
    </div>
  );
}

