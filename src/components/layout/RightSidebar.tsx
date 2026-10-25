import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usersApi } from "../../api/users";
import { followsApi } from "../../api/follows";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { Avatar } from "../Avatar";
import { formatMessageSnippet } from "../../utils/richText";
import type { UserSearchResult } from "../../types/user";

export function RightSidebar() {
  const { user } = useAuth();
  const { conversations, openFloatingChat, unreadChatCount } = useChat();
  const [suggestedUsers, setSuggestedUsers] = useState<UserSearchResult[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());
  const [loadingFollowId, setLoadingFollowId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    usersApi
      .searchUsers("", 1, 5)
      .then((res) => {
        if (!isMounted) return;
        const filtered = (res.items || []).filter((u) => u.id !== user?.id).slice(0, 4);
        setSuggestedUsers(filtered);
      })
      .catch(() => {
        // Fallback silently if offline or search endpoint empty
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleToggleFollow = async (targetUserId: number) => {
    const isCurrentlyFollowed = followedIds.has(targetUserId);
    setLoadingFollowId(targetUserId);

    // Optimistic state
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFollowed) next.delete(targetUserId);
      else next.add(targetUserId);
      return next;
    });

    try {
      if (isCurrentlyFollowed) {
        await followsApi.unfollow(targetUserId);
      } else {
        await followsApi.follow(targetUserId);
      }
    } catch {
      // Revert on error
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowed) next.add(targetUserId);
        else next.delete(targetUserId);
        return next;
      });
    } finally {
      setLoadingFollowId(null);
    }
  };

  return (
    <aside className="app-right-rail" aria-label="Explore and Suggestions">
      {/* Contacts / Conversations (Facebook style) */}
      <div className="social-widget-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 className="social-widget-title" style={{ margin: 0 }}>
              Contacts
            </h3>
            {unreadChatCount.totalUnreadMessages > 0 && (
              <span
                style={{
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "var(--radius-full)",
                }}
              >
                {unreadChatCount.totalUnreadMessages}
              </span>
            )}
          </div>
          <Link
            to="/messages"
            style={{
              fontSize: 12,
              color: "var(--primary)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            See all
          </Link>
        </div>

        {conversations.length === 0 ? (
          <div
            style={{
              padding: "16px 8px",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: 13,
            }}
          >
            No active chats yet. Start chatting from anyone's profile!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {conversations.slice(0, 8).map((c) => {
              const other = c.otherParticipant;
              const lastMsg = c.lastMessage;

              let snippet = "Started a chat";
              if (lastMsg) {
                if (lastMsg.isDeleted) {
                  snippet = "Message deleted";
                } else {
                  const formatted = formatMessageSnippet(lastMsg.content);
                  snippet = lastMsg.isMine ? `You: ${formatted}` : formatted;
                }
              }

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openFloatingChat(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 8px",
                    borderRadius: "var(--radius-md)",
                    background: "transparent",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar src={other.avatarUrl} name={other.name} size={36} />
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: "#22c55e",
                        border: "2px solid var(--bg-card)",
                      }}
                    />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: c.unreadCount > 0 ? 700 : 600,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.25,
                      }}
                    >
                      {other.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: c.unreadCount > 0 ? "var(--primary)" : "var(--text-secondary)",
                        fontWeight: c.unreadCount > 0 ? 600 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginTop: 2,
                        lineHeight: 1.2,
                      }}
                    >
                      {snippet}
                    </div>
                  </div>

                  {c.unreadCount > 0 && (
                    <span
                      style={{
                        backgroundColor: "var(--primary)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "var(--radius-full)",
                        flexShrink: 0,
                      }}
                    >
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggested Users / Who to Follow */}
      {suggestedUsers.length > 0 && (
        <div className="social-widget-card">
          <h3 className="social-widget-title">Who to Follow</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {suggestedUsers.map((item) => {
              const isFollowing = followedIds.has(item.id);
              const isLoading = loadingFollowId === item.id;

              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <Link
                    to={`/profile/${item.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textDecoration: "none",
                      color: "inherit",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <Avatar src={item.avatarUrl} name={item.name} size={38} />
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        @{item.username || "user"}
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(item.id)}
                    disabled={isLoading}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "var(--radius-full)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: isLoading ? "not-allowed" : "pointer",
                      border: isFollowing ? "1px solid var(--border-color)" : "none",
                      backgroundColor: isFollowing ? "var(--bg-card)" : "var(--primary)",
                      color: isFollowing ? "var(--text-primary)" : "#fff",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mini Footer Snippet */}
      <div style={{ padding: "0 8px", fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.6 }}>
        <div>Terms of Service · Privacy Policy · Cookie Policy</div>
        <div>© 2026 Marbook, Inc. Socialio Edition</div>
      </div>
    </aside>
  );
}
