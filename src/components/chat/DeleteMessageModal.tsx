import { useEffect } from "react";

interface DeleteMessageModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation modal shown before soft-deleting a chat message.
 * Rendered at zIndex 1200 so it layers cleanly above FloatingChatDock (zIndex 1000).
 */
export function DeleteMessageModal({
  isOpen,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: DeleteMessageModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--modal-overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        padding: 16,
      }}
      onClick={() => !isDeleting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-message-modal-title"
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
          id="delete-message-modal-title"
          style={{
            margin: "0 0 8px",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Delete Message?
        </h3>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.4,
          }}
        >
          Are you sure you want to delete this message? This action cannot be
          undone and will replace the message with &ldquo;This message was
          deleted&rdquo;.
        </p>

        {error && (
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
            {error}
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
            onClick={onClose}
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
            onClick={onConfirm}
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
  );
}

