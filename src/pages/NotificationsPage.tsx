import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../api/notifications";
import { useNotifications } from "../context/NotificationContext";
import { MainLayout } from "../components/layout/MainLayout";
import { Avatar } from "../components/Avatar";
import { formatRelativeTime } from "../utils/time";
import type { NotificationItem, NotificationType } from "../types/notifications";

function getNotificationConfig(type: NotificationType) {
  switch (type) {
    case "PostLiked":
      return {
        text: "liked your post",
        icon: "❤️",
        bgColor: "#ef4444",
      };
    case "CommentLiked":
      return {
        text: "liked your comment",
        icon: "❤️",
        bgColor: "#ef4444",
      };
    case "CommentCreated":
      return {
        text: "commented on your post",
        icon: "💬",
        bgColor: "#2563eb",
      };
    case "ReplyCreated":
      return {
        text: "replied to your comment",
        icon: "↩️",
        bgColor: "#2563eb",
      };
    case "UserFollowed":
      return {
        text: "started following you",
        icon: "👤",
        bgColor: "#10b981",
      };
    default:
      return {
        text: "interacted with you",
        icon: "🔔",
        bgColor: "var(--primary)",
      };
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { setUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (pageNum: number, unreadOnly: boolean) => {
    try {
      const res = await notificationsApi.getNotifications({
        pageNumber: pageNum,
        pageSize: 20,
        unreadOnly,
      });

      if (pageNum === 1) {
        setNotifications(res.items);
      } else {
        setNotifications((prev) => [...prev, ...res.items]);
      }
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchNotifications(1, filterUnread);
  }, [fetchNotifications, filterUnread]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await notificationsApi.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        const count = await notificationsApi.getUnreadCount();
        setUnreadCount(count);
      } catch {
        // ignore
      }
    }

    if (item.type === "UserFollowed") {
      navigate(`/profile/${item.actorUserId}`);
      return;
    }

    if (item.targetPostId) {
      const openComments =
        item.type === "CommentCreated" ||
        item.type === "ReplyCreated" ||
        item.type === "CommentLiked";
      navigate(`/feed?postId=${item.targetPostId}${openComments ? "&openComments=true" : ""}`);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const unreadItemsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <MainLayout>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Header Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Notifications
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
              Stay updated with your latest interactions and followers
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {unreadItemsCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                style={{
                  backgroundColor: "var(--bg-card)",
                  color: "var(--primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-full)",
                  padding: "7px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: markingAll ? "not-allowed" : "pointer",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card)")}
              >
                {markingAll ? "Marking..." : "✓ Mark all as read"}
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            backgroundColor: "var(--bg-card)",
            padding: "4px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-card)",
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            onClick={() => setFilterUnread(false)}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor: !filterUnread ? "var(--primary)" : "transparent",
              color: !filterUnread ? "#fff" : "var(--text-secondary)",
              fontWeight: !filterUnread ? 700 : 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            All Notifications
          </button>
          <button
            type="button"
            onClick={() => setFilterUnread(true)}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor: filterUnread ? "var(--primary)" : "transparent",
              color: filterUnread ? "#fff" : "var(--text-secondary)",
              fontWeight: filterUnread ? 700 : 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Unread Only
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
            <div
              style={{
                display: "inline-block",
                width: 28,
                height: 28,
                border: "3px solid var(--border-color)",
                borderTopColor: "var(--primary)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ marginTop: 12, fontSize: 14 }}>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="social-widget-card"
            style={{
              textAlign: "center",
              padding: "60px 24px",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                margin: "0 auto 16px",
              }}
            >
              🔔
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "var(--text-primary)" }}>
              {filterUnread ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", maxWidth: 360, marginInline: "auto" }}>
              {filterUnread
                ? "You're all caught up! Switch to 'All Notifications' to see your previous history."
                : "When other users like your posts, comment, or follow you, updates will show up here."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notifications.map((item) => {
              const config = getNotificationConfig(item.type);

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    backgroundColor: item.isRead ? "var(--bg-card)" : "var(--primary-light)",
                    border: "1px solid",
                    borderColor: item.isRead ? "var(--border-color)" : "var(--primary-light-hover)",
                    borderRadius: "var(--radius-lg)",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    cursor: "pointer",
                    boxShadow: "var(--shadow-card)",
                    transition: "all 0.15s ease",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-card)";
                  }}
                >
                  {/* Avatar with Action Badge */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar src={item.actorAvatarUrl} name={item.actorName} size={46} />
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
                        fontSize: 10,
                        border: "2px solid var(--bg-card)",
                      }}
                    >
                      {config.icon}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.4 }}>
                      <strong style={{ fontWeight: 700 }}>{item.actorName}</strong>{" "}
                      <span>{config.text}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
                      {formatRelativeTime(item.createdAt)}
                    </div>
                  </div>

                  {/* Right Action & Unread Dot */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {!item.isRead && (
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

                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(e, item.id)}
                      title="Delete notification"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-tertiary)",
                        cursor: "pointer",
                        padding: 6,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-tertiary)";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}

            {notifications.length < totalCount && (
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    setLoadingMore(true);
                    fetchNotifications(nextPage, filterUnread);
                  }}
                  disabled={loadingMore}
                  style={{
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-full)",
                    padding: "9px 24px",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: loadingMore ? "not-allowed" : "pointer",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {loadingMore ? "Loading more..." : "Load more notifications"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
