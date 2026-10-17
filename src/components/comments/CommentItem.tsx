import type { Comment } from "../../types/comments";

export interface CommentItemProps {
  comment: Comment;
  depth: number;
  expandedCommentIds: Set<number>;
  loadingRepliesCommentIds: Set<number>;
  onToggleReplies: (commentId: number) => void;
  onToggleLike: (commentId: number) => void;
  onStartReply: (commentId: number, userName: string) => void;
}

/**
 * Parses content to highlight @username mentions in blue (e.g. "@JohnDoe Hello")
 */
function renderCommentContent(content: string) {
  const mentionMatch = content.match(
    /^(@[\w\u0600-\u06FF]+(?:\s+[\w\u0600-\u06FF]+)?)([\s\S]*)$/
  );
  if (mentionMatch) {
    return (
      <>
        <span style={{ color: "#0095f6", fontWeight: 600, marginRight: 4 }}>
          {mentionMatch[1]}
        </span>
        {mentionMatch[2]}
      </>
    );
  }
  return content;
}

export function CommentItem({
  comment,
  depth,
  expandedCommentIds,
  loadingRepliesCommentIds,
  onToggleReplies,
  onToggleLike,
  onStartReply,
}: CommentItemProps) {
  const isExpanded = expandedCommentIds.has(comment.id);
  const isLoadingReplies = loadingRepliesCommentIds.has(comment.id);
  const isCommentLiked = Boolean(comment.liked);
  const commentLikeCount = comment.likeCount ?? 0;
  const replyCount = comment.replyCount ?? comment.replies?.length ?? 0;
  const hasReplies =
    replyCount > 0 || (comment.replies && comment.replies.length > 0);

  const cInitial = (comment.userName || "U").charAt(0).toUpperCase();
  const cDate = new Date(comment.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const avatarSize = depth === 0 ? 32 : 24;
  const avatarFontSize = depth === 0 ? 13 : 11;

  return (
    <div style={{ position: "relative" }}>
      {/* Main Comment Row */}
      <div
        style={{
          display: "flex",
          gap: depth === 0 ? 12 : 10,
          alignItems: "flex-start",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            backgroundColor: "#e4e6eb",
            color: "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: avatarFontSize,
            flexShrink: 0,
          }}
        >
          {cInitial}
        </div>

        {/* Content Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: depth === 0 ? 14 : 13,
              lineHeight: 1.4,
              color: "#262626",
            }}
          >
            <strong style={{ marginRight: 6 }}>{comment.userName}</strong>
            <span style={{ wordBreak: "break-word" }}>
              {renderCommentContent(comment.content)}
            </span>
          </div>

          {/* Action Row: Timestamp, Likes Count, Reply Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 4,
              fontSize: depth === 0 ? 12 : 11,
              color: "#8e8e8e",
            }}
          >
            <small>{cDate}</small>
            {commentLikeCount > 0 && (
              <span style={{ fontWeight: 600 }}>
                {commentLikeCount} {commentLikeCount === 1 ? "like" : "likes"}
              </span>
            )}
            <button
              type="button"
              onClick={() => onStartReply(comment.id, comment.userName)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#65676b",
                fontWeight: 600,
                fontSize: depth === 0 ? 12 : 11,
                cursor: "pointer",
              }}
            >
              Reply
            </button>
          </div>
        </div>

        {/* Heart / Like Button */}
        <button
          type="button"
          onClick={() => onToggleLike(comment.id)}
          aria-label={isCommentLiked ? "Unlike comment" : "Like comment"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: isCommentLiked ? "#ed4956" : "#8e8e8e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <svg
            width={depth === 0 ? "15" : "13"}
            height={depth === 0 ? "15" : "13"}
            viewBox="0 0 24 24"
            fill={isCommentLiked ? "#ed4956" : "none"}
            stroke={isCommentLiked ? "#ed4956" : "#8e8e8e"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* L-Shaped Branch Connector & "View X replies" Button */}
      {hasReplies && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
            marginTop: 4,
            marginBottom: 4,
          }}
        >
          {/* Curved branch line (elbow connector) matching YouTube/Facebook */}
          <div
            style={{
              width: 22,
              height: 18,
              borderLeft: "2px solid #8e8e8e",
              borderBottom: "2px solid #8e8e8e",
              borderBottomLeftRadius: 10,
              marginRight: 8,
              marginLeft: depth === 0 ? 15 : 11, // centers under avatar
              marginTop: -8,
              flexShrink: 0,
            }}
          />
          <button
            type="button"
            onClick={() => onToggleReplies(comment.id)}
            style={{
              background: "none",
              border: "none",
              padding: "3px 6px",
              color: "#0095f6",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 4,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f2f5")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span>
              {isLoadingReplies
                ? "Loading replies..."
                : isExpanded
                ? "Hide replies"
                : `View ${replyCount} ${
                    replyCount === 1 ? "reply" : "replies"
                  }`}
            </span>
          </button>
        </div>
      )}

      {/* Nested Replies Tree (when expanded) */}
      {isExpanded && comment.replies && comment.replies.length > 0 && (
        <div
          style={{
            position: "relative",
            marginLeft: depth === 0 ? 15 : 11, // continuous line down from elbow connector
            borderLeft: "2px solid #e4e6eb", // vertical guide line along branch
            paddingLeft: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 4,
          }}
        >
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              expandedCommentIds={expandedCommentIds}
              loadingRepliesCommentIds={loadingRepliesCommentIds}
              onToggleReplies={onToggleReplies}
              onToggleLike={onToggleLike}
              onStartReply={onStartReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
