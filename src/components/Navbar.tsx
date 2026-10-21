import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { getMediaUrl } from "../utils/media";
import { NotificationsDropdown } from "./NotificationsDropdown";
import type { NotificationItem } from "../types/notifications";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unreadCount, setUnreadCount } = useNotifications();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) return;

    if (location.pathname === "/feed") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.dispatchEvent(new CustomEvent("marbook:refresh-feed"));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setIsNotificationsOpen(false);

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
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 24px",
        backgroundColor: "#fff",
        borderBottom: "1px solid #e4e6eb",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <Link
        to={isAuthenticated ? "/feed" : "/"}
        onClick={handleLogoClick}
        title={isAuthenticated && location.pathname === "/feed" ? "Reload feed" : "Go to feed"}
        style={{
          textDecoration: "none",
          fontWeight: 800,
          fontSize: 22,
          color: "#1877f2",
          letterSpacing: "-0.5px",
          cursor: "pointer",
        }}
      >
        Marbook
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {isAuthenticated ? (
          <>
            {/* Notifications Bell */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                id="notifications-bell-btn"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                aria-label="Notifications"
                title="Notifications"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: isNotificationsOpen ? "#e7f3ff" : "#f0f2f5",
                  color: isNotificationsOpen ? "#1877f2" : "#050505",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isNotificationsOpen) {
                    e.currentTarget.style.backgroundColor = "#e4e6eb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isNotificationsOpen) {
                    e.currentTarget.style.backgroundColor = "#f0f2f5";
                  }
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                </svg>

                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -3,
                      backgroundColor: "#e41e3f",
                      color: "#fff",
                      borderRadius: 10,
                      padding: "1px 5px",
                      fontSize: 11,
                      fontWeight: 700,
                      minWidth: 16,
                      height: 16,
                      lineHeight: "14px",
                      textAlign: "center",
                      boxShadow: "0 0 0 2px #fff",
                      boxSizing: "border-box",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              <NotificationsDropdown
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                onNotificationClick={handleNotificationClick}
                onUnreadCountChanged={(count) => setUnreadCount(count)}
              />
            </div>

            <Link
              to="/profile/me"
              style={{
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
                color: "#1c1e21",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px 4px 6px",
                borderRadius: 20,
                backgroundColor: "#f0f2f5",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#e4e6eb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#f0f2f5")
              }
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "#1877f2",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  overflow: "hidden",
                }}
              >
                {user?.avatarUrl ? (
                  <img
                    src={getMediaUrl(user.avatarUrl)}
                    alt={user.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  (user?.name || "U")[0].toUpperCase()
                )}
              </div>
              <span>{user?.name ?? "Profile"}</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                backgroundColor: "transparent",
                border: "1px solid #ccd0d5",
                borderRadius: 6,
                padding: "6px 12px",
                color: "#65676b",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#ffebe8";
                e.currentTarget.style.color = "#e02424";
                e.currentTarget.style.borderColor = "#f97583";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#65676b";
                e.currentTarget.style.borderColor = "#ccd0d5";
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={{
                textDecoration: "none",
                color: "#1877f2",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Login
            </Link>
            <Link
              to="/register"
              style={{
                textDecoration: "none",
                backgroundColor: "#1877f2",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                padding: "6px 14px",
                borderRadius: 6,
              }}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
