import React from "react";

interface MessageStatusProps {
  isSeen: boolean;
  variant?: "check" | "bullet";
  style?: React.CSSProperties;
}

/**
 * Renders consistent Sent vs Seen status indicators for chat messages.
 * "check": "✓ Seen" / "✓ Sent" (used in MessagesPage)
 * "bullet": "• Seen" / "• Sent" (used in FloatingChatDock)
 */
export function MessageStatus({
  isSeen,
  variant = "bullet",
  style,
}: MessageStatusProps) {
  const isBullet = variant === "bullet";
  const label = isBullet
    ? isSeen ? "• Seen" : "• Sent"
    : isSeen ? "✓ Seen" : "✓ Sent";

  const defaultColor = isSeen ? "var(--primary)" : isBullet ? "var(--text-tertiary)" : "var(--text-muted)";

  return (
    <span
      style={{
        color: defaultColor,
        fontWeight: isSeen ? 500 : 400,
        fontSize: isBullet ? 10 : 11,
        ...style,
      }}
    >
      {label}
    </span>
  );
}

