import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { notificationsApi } from "../api/notifications";
import { getMediaUrl } from "../utils/media";

export function NotificationToast() {
  const { toastNotification, clearToast, setUnreadCount } = useNotifications();
  const navigate = useNavigate();

  if (!toastNotification) return null;

  const actorInitial = (toastNotification.actorName || "U")
    .charAt(0)
    .toUpperCase();
  const config = getToastConfig(toastNotification.type);

  const handleClick = async () => {
    const item = toastNotification;
    clearToast();

    // Mark as read optimistically
    try {
      await notificationsApi.markAsRead(item.id);
      const newCount = await notificationsApi.getUnreadCount();
      setUnreadCount(newCount);
    } catch {
      // ignore
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

      navigate(
        `/feed?postId=${item.targetPostId}${
          openComments ? "&openComments=true" : ""
        }`
      );
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 2000,
        backgroundColor: "#fff",
        borderRadius: 12,
        boxShadow:
          "0 12px 28px 0 rgba(0, 0, 0, 0.22), 0 2px 4px 0 rgba(0, 0, 0, 0.12)",
        border: "1px solid #e4e6eb",
        maxWidth: 380,
        width: "calc(100vw - 48px)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        cursor: "pointer",
        animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
      onClick={handleClick}
    >
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Avatar with Badge */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            backgroundColor: "#1877f2",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            fontWeight: 700,
            overflow: "hidden",
          }}
        >
          {toastNotification.actorAvatarUrl ? (
            <img
              src={getMediaUrl(toastNotification.actorAvatarUrl)}
              alt={toastNotification.actorName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            actorInitial
          )}
        </div>

        {/* Action Badge */}
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
            border: "2px solid #fff",
          }}
        >
          {config.icon}
        </div>
      </div>

      {/* Text Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#1877f2",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 2,
          }}
        >
          New Notification
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            lineHeight: 1.35,
            color: "#050505",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          <strong>{toastNotification.actorName}</strong> {config.label}
        </p>
        <span style={{ fontSize: 11.5, color: "#8a8d91" }}>Just now</span>
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        title="Dismiss"
        onClick={(e) => {
          e.stopPropagation();
          clearToast();
        }}
        style={{
          background: "none",
          border: "none",
          color: "#8a8d91",
          cursor: "pointer",
          padding: "4px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background-color 0.15s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#f0f2f5")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function getToastConfig(type: string): {
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
