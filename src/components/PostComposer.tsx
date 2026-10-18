import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types/posts";

interface PostComposerProps {
  onPostCreated: (content: string) => Promise<Post>;
}

const MAX_CHAR_COUNT = 500;

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  if (!user) return null;

  const authorInitial = (user.name || "U").charAt(0).toUpperCase();
  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHAR_COUNT;
  const isNearLimit = charCount >= 450 && !isOverLimit;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await onPostCreated(content.trim());
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch {
      setError("Failed to create post. Please check your connection and try again.");
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
        backgroundColor: "#fff",
        border: "1px solid #e4e6eb",
        borderRadius: 8,
        padding: "16px 20px",
        marginBottom: 20,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Header: User avatar & details */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "#1877f2",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {authorInitial}
        </div>
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: "#050505",
              lineHeight: 1.2,
            }}
          >
            {user.name}
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "#65676b",
              backgroundColor: "#f0f2f5",
              padding: "2px 8px",
              borderRadius: 12,
              marginTop: 3,
            }}
          >
            <span>Public</span>
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
              border: isOverLimit ? "1.5px solid #e02424" : "1px solid #e4e6eb",
              borderRadius: 8,
              padding: "12px 14px",
              fontSize: 15,
              lineHeight: 1.5,
              color: "#1c1e21",
              backgroundColor: "#f8f9fa",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              transition: "border-color 0.15s ease, background-color 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              if (!isOverLimit) {
                e.currentTarget.style.borderColor = "#1877f2";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
              if (!isOverLimit) {
                e.currentTarget.style.borderColor = "#e4e6eb";
              }
            }}
          />
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
                : "#65676b",
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
              backgroundColor: canSubmit ? "#1877f2" : "#e4e6eb",
              color: canSubmit ? "#fff" : "#bcc0c4",
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
    </div>
  );
}
