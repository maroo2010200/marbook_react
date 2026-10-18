import type { RefObject, FormEvent } from "react";
import { Link } from "react-router-dom";

export interface CommentInputProps {
  isAuthenticated: boolean;
  replyingTo: { commentId: number; userName: string } | null;
  newComment: string;
  submitting: boolean;
  submitError: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onChangeComment: (val: string) => void;
  onCancelReply: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function CommentInput({
  isAuthenticated,
  replyingTo,
  newComment,
  submitting,
  submitError,
  inputRef,
  onChangeComment,
  onCancelReply,
  onSubmit,
}: CommentInputProps) {
  if (!isAuthenticated) {
    return (
      <div
        style={{
          borderTop: "1px solid #efefef",
          padding: "16px 18px",
          backgroundColor: "#fff",
          textAlign: "center",
          fontSize: 13,
          color: "#8e8e8e",
        }}
      >
        Please{" "}
        <Link
          to="/login"
          style={{
            color: "#0095f6",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Log In
        </Link>{" "}
        or{" "}
        <Link
          to="/register"
          style={{
            color: "#0095f6",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Register
        </Link>{" "}
        to leave a comment.
      </div>
    );
  }

  return (
    <div
      style={{
        borderTop: "1px solid #efefef",
        padding: "12px 18px",
        backgroundColor: "#fff",
      }}
    >
      <form onSubmit={onSubmit} style={{ margin: 0 }}>
        {/* Replying banner indicator */}
        {replyingTo && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 12px",
              backgroundColor: "#f0f2f5",
              borderRadius: 8,
              marginBottom: 8,
              fontSize: 13,
              color: "#65676b",
            }}
          >
            <span>
              Replying to{" "}
              <strong style={{ color: "#1c1e21" }}>
                @{replyingTo.userName}
              </strong>
            </span>
            <button
              type="button"
              onClick={onCancelReply}
              aria-label="Cancel reply"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#65676b",
                fontWeight: 700,
                fontSize: 14,
                padding: "0 4px",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Submission error message */}
        {submitError && (
          <div
            style={{
              color: "#e02424",
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            {submitError}
          </div>
        )}

        {/* Input & Submit button row */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            ref={inputRef}
            type="text"
            placeholder={
              replyingTo
                ? `Reply to @${replyingTo.userName}...`
                : "Add a comment..."
            }
            value={newComment}
            onChange={(e) => onChangeComment(e.target.value)}
            disabled={submitting}
            style={{
              flex: 1,
              border: "1px solid #dbdbdb",
              borderRadius: 20,
              padding: "8px 14px",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            style={{
              background: "none",
              border: "none",
              color:
                !newComment.trim() || submitting ? "#b2dffc" : "#0095f6",
              fontWeight: 600,
              fontSize: 14,
              cursor:
                !newComment.trim() || submitting ? "default" : "pointer",
              padding: "6px 10px",
            }}
          >
            {submitting
              ? replyingTo
                ? "Replying..."
                : "Posting..."
              : replyingTo
              ? "Reply"
              : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
