import { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useChat } from "../context/ChatContext";
import { useTheme } from "../context/ThemeContext";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { MessagesDropdown } from "./MessagesDropdown";
import { ChatIcon } from "./ChatIcon";
import { SearchBar } from "./SearchBar";
import { Avatar } from "./Avatar";
import type { NotificationItem } from "../types/notifications";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const { unreadCount, setUnreadCount } = useNotifications();
  const { unreadChatCount } = useChat();

  const handleCloseMessages = useCallback(() => {
    setIsMessagesOpen(false);
  }, []);

  const handleCloseNotifications = useCallback(() => {
    setIsNotificationsOpen(false);
  }, []);

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
        backgroundColor: "var(--bg-card)",
        borderBottom: "1px solid var(--border-color)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "var(--shadow-sm)",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, maxWidth: 500 }}>
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
            flexShrink: 0,
          }}
        >
          Marbook
        </Link>

        {isAuthenticated && <SearchBar />}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Dark Mode Toggle Button */}
        <button
          type="button"
          id="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            backgroundColor: "var(--bg-hover)",
            color: isDark ? "#facc15" : "var(--text-secondary)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-active)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
          }}
        >
          {isDark ? (
            /* Sun Icon */
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            /* Moon Icon */
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {isAuthenticated ? (
          <>
            {/* Messenger */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                id="navbar-messenger-btn"
                onClick={() => {
                  setIsNotificationsOpen(false);
                  setIsMessagesOpen((prev) => !prev);
                }}
                aria-label="Messages"
                title="Messages"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: isMessagesOpen
                    ? "var(--primary-light)"
                    : "var(--bg-hover)",
                  color: isMessagesOpen
                    ? "var(--primary)"
                    : "var(--text-primary)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isMessagesOpen) {
                    e.currentTarget.style.backgroundColor = "var(--bg-active)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMessagesOpen) {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  }
                }}
              >
                <ChatIcon size={20} />

                {unreadChatCount.totalUnreadMessages > 0 && (
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
                      boxShadow: "0 0 0 2px var(--bg-card)",
                      boxSizing: "border-box",
                    }}
                  >
                    {unreadChatCount.totalUnreadMessages > 99
                      ? "99+"
                      : unreadChatCount.totalUnreadMessages}
                  </span>
                )}
              </button>

              <MessagesDropdown
                isOpen={isMessagesOpen}
                onClose={handleCloseMessages}
              />
            </div>

            {/* Notifications Bell */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                id="notifications-bell-btn"
                onClick={() => {
                  setIsMessagesOpen(false);
                  setIsNotificationsOpen((prev) => !prev);
                }}
                aria-label="Notifications"
                title="Notifications"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: isNotificationsOpen
                    ? "var(--primary-light)"
                    : "var(--bg-hover)",
                  color: isNotificationsOpen
                    ? "var(--primary)"
                    : "var(--text-primary)",
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
                    e.currentTarget.style.backgroundColor = "var(--bg-active)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isNotificationsOpen) {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
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
                      boxShadow: "0 0 0 2px var(--bg-card)",
                      boxSizing: "border-box",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              <NotificationsDropdown
                isOpen={isNotificationsOpen}
                onClose={handleCloseNotifications}
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
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px 4px 6px",
                borderRadius: 20,
                backgroundColor: "var(--bg-hover)",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-active)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
              }
            >
              <Avatar src={user?.avatarUrl} name={user?.name} size={28} />
              <span>{user?.name ?? "Profile"}</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--border-color)",
                borderRadius: 6,
                padding: "6px 12px",
                color: "var(--text-secondary)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(224, 36, 36, 0.12)";
                e.currentTarget.style.color = "#e02424";
                e.currentTarget.style.borderColor = "#f97583";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "var(--border-color)";
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
