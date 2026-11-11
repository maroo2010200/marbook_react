import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useChat } from "../../context/ChatContext";
import { useTheme } from "../../context/ThemeContext";
import { NotificationsDropdown } from "../NotificationsDropdown";
import { MessagesDropdown } from "../MessagesDropdown";
import { ChatIcon } from "../ChatIcon";
import { Avatar } from "../Avatar";
import { MarshmallowLogo } from "../MarshmallowLogo";
import type { NotificationItem } from "../../types/notifications";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);
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
      window.dispatchEvent(new CustomEvent("marshmallow:refresh-feed"));
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
      className="app-navbar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        height: 56,
        boxSizing: "border-box",
        backgroundColor: "var(--bg-card)",
        borderBottom: "1px solid var(--border-color)",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: "var(--shadow-sm)",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 1.5vw, 16px)", flex: 1, maxWidth: 500, minWidth: 0 }}>
        <Link
          to={isAuthenticated ? "/feed" : "/"}
          onClick={handleLogoClick}
          title={isAuthenticated && location.pathname === "/feed" ? "Reload feed" : "Go to feed"}
          className="navbar-brand-text"
          style={{
            textDecoration: "none",
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: "-0.5px",
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <MarshmallowLogo size={28} />
          <span
            style={{
              background:
                "linear-gradient(135deg, var(--primary) 0%, #e07a5f 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Marshmallow
          </span>
        </Link>

      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px, 1.2vw, 12px)", flexShrink: 0 }}>
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

            <div style={{ position: "relative" }} ref={profileMenuRef}>
              <button
                type="button"
                id="navbar-profile-btn"
                onClick={() => {
                  setIsNotificationsOpen(false);
                  setIsMessagesOpen(false);
                  setIsProfileMenuOpen((prev) => !prev);
                }}
                aria-label="Account menu"
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
                  backgroundColor: isProfileMenuOpen
                    ? "var(--bg-active)"
                    : "var(--bg-hover)",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.15s ease",
                }}
              >
                <Avatar src={user?.avatarUrl} name={user?.name} size={28} />
                <span className="navbar-user-name">{user?.name ?? "Account"}</span>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isProfileMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                    color: "var(--text-secondary)",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Profile Dropdown Popup */}
              {isProfileMenuOpen && (
                <div
                  className="app-dropdown-menu app-profile-dropdown"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: 250,
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.18)",
                    padding: "8px",
                    zIndex: 2500,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  {/* User Profile Header */}
                  <Link
                    to={user?.username ? `/@${user.username}` : user?.id ? `/profile/${user.id}` : "/profile"}
                    onClick={() => setIsProfileMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: "var(--radius-md)",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <Avatar src={user?.avatarUrl} name={user?.name} size={38} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user?.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        @{user?.username || "profile"}
                      </div>
                    </div>
                  </Link>

                  <div
                    style={{
                      height: 1,
                      backgroundColor: "var(--border-color)",
                      margin: "4px 0",
                    }}
                  />

                  {/* Settings & Privacy Link */}
                  <Link
                    to="/settings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: "var(--radius-md)",
                      textDecoration: "none",
                      color: "var(--text-primary)",
                      fontSize: 13.5,
                      fontWeight: 500,
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Settings &amp; Privacy</span>
                  </Link>

                  {/* Dark Mode Toggle Item */}
                  <button
                    type="button"
                    onClick={() => toggleTheme()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "var(--text-primary)",
                      fontSize: 13.5,
                      fontWeight: 500,
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 15 }}>{isDark ? "☀️" : "🌙"}</span>
                      <span>Dark Theme</span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>
                      {isDark ? "On" : "Off"}
                    </span>
                  </button>

                  <div
                    style={{
                      height: 1,
                      backgroundColor: "var(--border-color)",
                      margin: "4px 0",
                    }}
                  />

                  {/* Log Out Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#ef4444",
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              to="/login"
              style={{
                textDecoration: "none",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: 14,
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                transition: "color 0.15s ease, background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--primary)";
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Login
            </Link>
            <Link
              to="/register"
              style={{
                textDecoration: "none",
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 14,
                padding: "6px 16px",
                borderRadius: "var(--radius-full)",
                boxShadow: "0 2px 8px rgba(201, 107, 50, 0.25)",
                transition: "transform 0.15s ease, background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.backgroundColor = "var(--primary-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.backgroundColor = "var(--primary)";
              }}
            >
              Register
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Dropdown Backdrop */}
      {(isMessagesOpen || isNotificationsOpen || isProfileMenuOpen) && (
        <div
          className="app-dropdown-backdrop"
          onClick={() => {
            setIsMessagesOpen(false);
            setIsNotificationsOpen(false);
            setIsProfileMenuOpen(false);
          }}
        />
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            backgroundColor: "var(--modal-overlay)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setIsLogoutModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              padding: "24px 28px",
              maxWidth: 400,
              width: "100%",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                  Log Out
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
                  Are you sure you want to log out of Marshmallow?
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--bg-hover)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  handleLogout();
                }}
                style={{
                  padding: "8px 20px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.35)",
                  transition: "all 0.15s ease",
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
