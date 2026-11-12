interface MessageEditBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isMine: boolean;
  compact?: boolean;
}

/**
 * Inline edit input with Enter/Escape shortcuts shared by MessagesPage and FloatingChatDock.
 */
export function MessageEditBox({
  value,
  onChange,
  onSave,
  onCancel,
  isSaving,
  isMine,
  compact = false,
}: MessageEditBoxProps) {
  return (
    <div style={{ minWidth: compact ? 175 : 220 }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSave();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: compact ? "5px 8px" : "6px 10px",
          borderRadius: 6,
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-hover)",
          color: "var(--text-primary)",
          fontSize: compact ? 13 : 14,
          outline: "none",
          marginBottom: 6,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 6,
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            border: "none",
            background: "none",
            color: isMine ? "#fff" : "var(--text-muted)",
            fontSize: compact ? 11.5 : 12,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !value.trim()}
          style={{
            backgroundColor: isMine ? "#fff" : "var(--primary)",
            color: isMine ? "var(--primary)" : "#fff",
            border: "none",
            borderRadius: 4,
            padding: compact ? "3px 8px" : "3px 10px",
            fontSize: compact ? 11.5 : 12,
            fontWeight: 600,
            cursor: isSaving || !value.trim() ? "not-allowed" : "pointer",
            opacity: isSaving || !value.trim() ? 0.6 : 1,
          }}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

