import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../api/notifications";
import { useNotifications } from "../context/NotificationContext";
import type { NotificationItem } from "../types/notifications";
import { Avatar } from "./Avatar";
import { formatRelativeTime } from "../utils/time";

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick: (item: NotificationItem) => void;
  onUnreadCountChanged?: (count: number) => void;
}

export function NotificationsDropdown({
  isOpen,
  onClose,
  onNotificationClick,
  onUnreadCountChanged,
}: NotificationsDropdownProps) {
  const navigate = useNavigate();
  const { subscribeToNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to live incoming SignalR notifications
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToNotifications((incoming) => {
      setNotifications((prev) => [
        incoming,
        ...prev.filter((n) => n.id !== incoming.id),
      ]);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, subscribeToNotifications]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    // Use capture so it handles clicks before stopPropagation
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Fetch notifications for the active tab
  const fetchNotifications = useCallback(
    async (pageNum: number, isInitial = false) => {
      if (isInitial) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await notificationsApi.getNotifications({
          pageNumber: pageNum,
          pageSize: 15,
          unreadOnly: activeTab === "unread",
        });

        if (pageNum === 1) {
          setNotifications(res.items);
        } else {
          setNotifications((prev) => [...prev, ...res.items]);
        }

        setPage(pageNum);
        const loadedCount = (pageNum - 1) * 15 + res.items.length;
        setHasMore(loadedCount < res.totalCount);
      } catch (err: any) {
        setError("Failed to load notifications.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab]
  );

  // Trigger load when opened or tab changes
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, true);
    }
  }, [isOpen, activeTab, fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
      if (activeTab === "unread") {
        setNotifications([]);
      }
      onUnreadCountChanged?.(0);
    } catch {
      // ignore
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      // Optimistic read status update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      try {
        await notificationsApi.markAsRead(item.id);
        const unreadCount = await notificationsApi.getUnreadCount();
        onUnreadCountChanged?.(unreadCount);
      } catch {
        // ignore
      }
    }
    onNotificationClick(item);
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const itemToDelete = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await notificationsApi.deleteNotification(id);
      if (itemToDelete && !itemToDelete.isRead) {
        const unreadCount = await notificationsApi.getUnreadCount();
        onUnreadCountChanged?.(unreadCount);
      }
    } catch {
      // Revert if error
      if (itemToDelete) {
        setNotifications((prev) => [itemToDelete, ...prev]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: 375,
        maxHeight: 520,
        backgroundColor: "var(--bg-card)",
        borderRadius: 12,
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border-color)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 10px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.4px",
          }}
        >
          Notifications
        </h3>

        <button
          type="button"
          onClick={handleMarkAllAsRead}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: 6,
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--primary-light)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "8px 16px",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          style={{
            border: "none",
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            backgroundColor:
              activeTab === "all" ? "var(--primary-light)" : "var(--bg-hover)",
            color:
              activeTab === "all" ? "var(--primary)" : "var(--text-secondary)",
            transition: "all 0.15s ease",
          }}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          style={{
            border: "none",
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            backgroundColor:
              activeTab === "unread"
                ? "var(--primary-light)"
                : "var(--bg-hover)",
            color:
              activeTab === "unread"
                ? "var(--primary)"
                : "var(--text-secondary)",
            transition: "all 0.15s ease",
          }}
        >
          Unread
        </button>
      </div>

      {/* Notification items list */}
      <div
        style={{
          overflowY: "auto",
          flex: 1,
          padding: "4px 8px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {loading && (
          <div
            style={{
              padding: "36px 16px",
              textAlign: "center",
              color: "#65676b",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                border: "2px solid #e4e6eb",
                borderTopColor: "#1877f2",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span style={{ fontSize: 13 }}>Loading notifications...</span>
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: "#e02424",
              fontSize: 13,
            }}
          >
            <p style={{ margin: "0 0 8px" }}>{error}</p>
            <button
              type="button"
              onClick={() => fetchNotifications(1, true)}
              style={{
                backgroundColor: "#e7f3ff",
                color: "#1877f2",
                border: "none",
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--text-secondary)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                backgroundColor: "var(--bg-hover)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                fontSize: 22,
                color: "var(--text-tertiary)",
              }}
            >
              🔔
            </div>
            <p
              style={{
                margin: "0 0 4px",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--text-primary)",
              }}
            >
              {activeTab === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </p>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {activeTab === "unread"
                ? "You have caught up with all your alerts!"
                : "When friends interact with your posts or profile, you'll see them here."}
            </span>
          </div>
        )}

        {!loading &&
          notifications.map((item) => {
            const config = getActionBadgeConfig(item.type);
            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 10px",
                  borderRadius: 8,
                  backgroundColor: item.isRead
                    ? "transparent"
                    : "var(--primary-light)",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = item.isRead
                    ? "var(--bg-hover)"
                    : "var(--primary-light-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = item.isRead
                    ? "transparent"
                    : "var(--primary-light)")
                }
              >
                {/* Avatar with Action Badge */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Avatar src={item.actorAvatarUrl} name={item.actorName} size={44} />

                  {/* Overlaid type icon badge */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: config.bgColor,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid var(--bg-card)",
                    }}
                  >
                    {config.icon}
                  </div>
                </div>

                {/* Content */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13.5,
                      lineHeight: 1.35,
                      color: "var(--text-primary)",
                      overflowWrap: "break-word",
                    }}
                  >
                    <strong style={{ fontWeight: 600 }}>{item.actorName}</strong>{" "}
                    <span
                      style={{
                        color: item.isRead
                          ? "var(--text-secondary)"
                          : "var(--text-primary)",
                      }}
                    >
                      {config.label}
                    </span>
                  </p>
                  <span
                    style={{
                      fontSize: 12,
                      color: item.isRead
                        ? "var(--text-tertiary)"
                        : "var(--primary)",
                      fontWeight: item.isRead ? 400 : 600,
                    }}
                  >
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                {/* Status Dot & Delete Action */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {!item.isRead && (
                    <div
                      title="Unread"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "var(--primary)",
                      }}
                    />
                  )}

                  <button
                    type="button"
                    title="Remove notification"
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-tertiary)",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.6,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.color = "#e02424";
                      e.currentTarget.style.backgroundColor =
                        "rgba(224, 36, 36, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0.6";
                      e.currentTarget.style.color = "var(--text-tertiary)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

        {/* Load more button */}
        {hasMore && !loading && (
          <button
            type="button"
            onClick={() => fetchNotifications(page + 1)}
            disabled={loadingMore}
            style={{
              margin: "8px 0 4px",
              padding: "8px",
              backgroundColor: "var(--bg-hover)",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--primary)",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--bg-active)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
            }
          >
            {loadingMore ? "Loading..." : "See previous notifications"}
          </button>
        )}
      </div>

      {/* Footer: Show All Notifications */}
      <div
        style={{
          borderTop: "1px solid var(--border-color)",
          padding: "10px 16px",
          textAlign: "center",
          backgroundColor: "var(--bg-card)",
        }}
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate("/notifications");
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary)",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: 6,
            transition: "background-color 0.15s ease",
            width: "100%",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          Show all
        </button>
      </div>
    </div>
  );
}

function getActionBadgeConfig(type: string): {
  label: string;
  bgColor: string;
  icon: React.ReactNode;
} {
  switch (type) {
    case "PostLiked":
      return {
        label: "liked your post.",
        bgColor: "#e41e3f",
        icon: (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ),
      };

    case "CommentLiked":
      return {
        label: "liked your comment.",
        bgColor: "#e41e3f",
        icon: (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ),
      };

    case "CommentCreated":
      return {
        label: "commented on your post.",
        bgColor: "#1877f2",
        icon: (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      };

    case "ReplyCreated":
      return {
        label: "replied to your comment.",
        bgColor: "#7c3aed",
        icon: (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 17 4 12 9 7" />
            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
          </svg>
        ),
      };

    case "UserFollowed":
      return {
        label: "started following you.",
        bgColor: "#10b981",
        icon: (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        ),
      };

    default:
      return {
        label: "sent you a notification.",
        bgColor: "#1877f2",
        icon: (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
      };
  }
}
