import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type { Post, PostVisibility } from "../types/posts";

interface PostComposerProps {
  onPostCreated: (content: string, visibility?: PostVisibility) => Promise<Post>;
  defaultVisibility?: PostVisibility;
}

const MAX_CHAR_COUNT = 500;

interface AudienceOption {
  value: PostVisibility;
  title: string;
  subtitle: string;
  pillLabel: string;
}

const AUDIENCE_OPTIONS: AudienceOption[] = [
  {
    value: "Public",
    title: "Public",
    subtitle: "Anyone on or off Marbook",
    pillLabel: "Public",
  },
  {
    value: "Followers",
    title: "Followers only",
    subtitle: "Only people who follow you",
    pillLabel: "Followers",
  },
  {
    value: "Private",
    title: "Private (Only Me)",
    subtitle: "Only you can see this post",
    pillLabel: "Only Me",
  },
];

function AudienceIcon({
  visibility,
  size = 12,
}: {
  visibility: PostVisibility;
  size?: number;
}) {
  if (visibility === "Private") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    );
  }

  if (visibility === "Followers") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  // Public
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function PostComposer({
  onPostCreated,
  defaultVisibility = "Public",
}: PostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>(defaultVisibility);
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const audienceRef = useRef<HTMLDivElement | null>(null);

  // Sync visibility if defaultVisibility prop changes (e.g. switching feed tabs)
  useEffect(() => {
    setVisibility(defaultVisibility);
  }, [defaultVisibility]);

  // Close audience dropdown on outside click
  useEffect(() => {
    if (!isAudienceOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        audienceRef.current &&
        !audienceRef.current.contains(e.target as Node)
      ) {
        setIsAudienceOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAudienceOpen]);

  if (!user) return null;

  const authorInitial = (user.name || "U").charAt(0).toUpperCase();
  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHAR_COUNT;
  const isNearLimit = charCount >= 450 && !isOverLimit;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting;

  const currentOption =
    AUDIENCE_OPTIONS.find((opt) => opt.value === visibility) ||
    AUDIENCE_OPTIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await onPostCreated(content.trim(), visibility);
      setContent("");
      setVisibility(defaultVisibility);
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
      {/* Header: User avatar & details & Audience Switcher */}
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

          {/* Interactive Audience Pill Dropdown */}
          <div style={{ position: "relative" }} ref={audienceRef}>
            <button
              type="button"
              onClick={() => setIsAudienceOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isAudienceOpen}
              title="Select post audience"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
                color: "#4b4f56",
                backgroundColor: "#f0f2f5",
                border: "1px solid #dcdfe3",
                padding: "3px 8px",
                borderRadius: 6,
                marginTop: 4,
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#e4e6eb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#f0f2f5")
              }
            >
              <AudienceIcon visibility={visibility} size={12} />
              <span>{currentOption.pillLabel}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{
                  transform: isAudienceOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease",
                }}
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>

            {/* Audience Dropdown Popover */}
            {isAudienceOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 6,
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  border: "1px solid #e4e6eb",
                  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.15)",
                  width: 250,
                  zIndex: 30,
                  overflow: "hidden",
                  padding: "6px 0",
                }}
              >
                <div
                  style={{
                    padding: "6px 14px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#65676b",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "1px solid #f0f2f5",
                  }}
                >
                  Who can see your post?
                </div>

                {AUDIENCE_OPTIONS.map((opt) => {
                  const isSelected = visibility === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setVisibility(opt.value);
                        setIsAudienceOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        backgroundColor: isSelected ? "#e7f3ff" : "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "background-color 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "#f0f2f5";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected
                          ? "#e7f3ff"
                          : "transparent";
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          backgroundColor: isSelected ? "#1877f2" : "#f0f2f5",
                          color: isSelected ? "#fff" : "#050505",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <AudienceIcon
                          visibility={opt.value}
                          size={15}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? "#1877f2" : "#050505",
                            lineHeight: 1.25,
                          }}
                        >
                          {opt.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#65676b",
                            lineHeight: 1.3,
                            marginTop: 2,
                          }}
                        >
                          {opt.subtitle}
                        </div>
                      </div>

                      {isSelected && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#1877f2"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
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
