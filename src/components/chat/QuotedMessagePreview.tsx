import type { MessageReply } from "../../types/chat";

interface QuotedMessagePreviewProps {
  replyTo: MessageReply | null | undefined;
  isMine?: boolean;
  onJumpToMessage?: (messageId: number) => void;
  compact?: boolean;
}

export function QuotedMessagePreview({
  replyTo,
  isMine = false,
  onJumpToMessage,
  compact = false,
}: QuotedMessagePreviewProps) {
  if (!replyTo) return null;

  const snippet = replyTo.isDeleted
    ? "This message was deleted"
    : replyTo.content.replace(/\s+/g, " ").trim();

  const handleClick = () => {
    if (onJumpToMessage) {
      onJumpToMessage(replyTo.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      title="Click to jump to quoted message"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: compact ? "4px 8px" : "6px 10px",
        marginBottom: 6,
        borderRadius: 8,
        borderLeft: isMine
          ? "3.5px solid rgba(255, 255, 255, 0.9)"
          : "3.5px solid var(--primary)",
        backgroundColor: isMine
          ? "rgba(0, 0, 0, 0.15)"
          : "rgba(0, 0, 0, 0.05)",
        color: isMine ? "#ffffff" : "var(--text-primary)",
        cursor: "pointer",
        textAlign: "left",
        maxWidth: "100%",
        overflow: "hidden",
        transition: "opacity 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.85";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
    >
      <div
        style={{
          fontSize: compact ? 11 : 12,
          fontWeight: 700,
          color: isMine ? "#f1f5f9" : "var(--primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
        }}
      >
        {replyTo.senderName || "User"}
      </div>
      <div
        style={{
          fontSize: compact ? 11 : 12,
          opacity: 0.85,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.3,
          fontStyle: replyTo.isDeleted ? "italic" : "normal",
        }}
      >
        {snippet || "(attachment)"}
      </div>
    </div>
  );
}

