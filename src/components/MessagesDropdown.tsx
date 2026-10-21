import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { getMediaUrl } from "../utils/media";
import { formatRelativeTime } from "../utils/time";
import { formatMessageSnippet } from "../utils/richText";
import type { ConversationSummary } from "../types/chat";

interface MessagesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagesDropdown({ isOpen, onClose }: MessagesDropdownProps) {
  const { user: currentUser } = useAuth();
  const { conversations, refreshConversations } = useChat();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const refreshConversationsRef = useRef(refreshConversations);
  refreshConversationsRef.current = refreshConversations;

  // Fetch conversations once when dropdown opens
  useEffect(() => {
    if (!isOpen) return;
    refreshConversationsRef.current();
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onCloseRef.current();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectConversation = (conversation: ConversationSummary) => {
    onClose();
    navigate(`/messages?conversationId=${conversation.id}`);
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: 48,
        right: 0,
        width: 360,
        maxHeight: 520,
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        boxShadow: "var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.2))",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        overflow: "hidden",
        animation: "dropdownFadeIn 0.15s ease-out",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Chats
        </span>
      </div>

      {/* Conversations List */}
      <div
        style={{
          overflowY: "auto",
          maxHeight: 400,
          padding: "6px 0",
        }}
      >
        {conversations.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              No messages yet
            </div>
            <div>Visit a user's profile and click "Message" to start a chat!</div>
          </div>
        ) : (
          conversations.map((c) => {
            const hasUnread = c.unreadCount > 0;
            const other = c.otherParticipant;
            const lastMsg = c.lastMessage;

            let snippet = "Started a conversation";
            if (lastMsg) {
              const isLastMine = currentUser
                ? lastMsg.senderUserId === currentUser.id
                : lastMsg.isMine;

              if (lastMsg.isDeleted) {
                snippet = "This message was deleted";
              } else {
                const formatted = formatMessageSnippet(lastMsg.content);
                if (isLastMine) {
                  snippet = `You: ${formatted}`;
                } else {
                  snippet = formatted;
                }
              }
            }

            return (
              <div
                key={c.id}
                onClick={() => handleSelectConversation(c)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  cursor: "pointer",
                  backgroundColor: hasUnread
                    ? "var(--bg-hover)"
                    : "transparent",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--bg-active)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = hasUnread
                    ? "var(--bg-hover)"
                    : "transparent")
                }
              >
                {/* Avatar */}
                <div
                  style={{
                    position: "relative",
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    backgroundColor: "var(--primary)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {other.avatarUrl ? (
                    <img
                      src={getMediaUrl(other.avatarUrl)}
                      alt={other.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    (other.name || "U")[0].toUpperCase()
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: hasUnread ? 700 : 600,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {other.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: hasUnread ? "var(--primary)" : "var(--text-muted)",
                        fontWeight: hasUnread ? 600 : 400,
                        flexShrink: 0,
                      }}
                    >
                      {formatRelativeTime(c.updatedAt)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: hasUnread
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                        fontWeight: hasUnread ? 600 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontStyle:
                          lastMsg?.isDeleted ? "italic" : "normal",
                      }}
                    >
                      {snippet}
                    </span>

                    {hasUnread && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: "var(--primary)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
