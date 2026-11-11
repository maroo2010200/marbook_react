import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useChat } from "../../context/ChatContext";
import { Avatar } from "../Avatar";

export function MobileBottomNav() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const { unreadChatCount } = useChat();

  // Hide on guest, login, register, password reset, verify pages,
  // or when the user is inside an active chat thread on mobile
  const hiddenPaths = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify",
  ];

  const searchParams = new URLSearchParams(location.search);
  const isInsideChat =
    location.pathname === "/messages" && Boolean(searchParams.get("conversationId"));

  if (
    !isAuthenticated ||
    !user ||
    hiddenPaths.includes(location.pathname) ||
    isInsideChat
  ) {
    return null;
  }

  const profileUrl = user.username
    ? `/@${user.username}`
    : user.id
    ? `/profile/${user.id}`
    : "/profile";

  const isProfileActive =
    location.pathname === "/profile" ||
    location.pathname === `/profile/${user.id}` ||
    (Boolean(user.username) && location.pathname === `/@${user.username}`);

  const totalChatUnread = unreadChatCount.totalUnreadMessages || 0;
  const chatBadge =
    totalChatUnread > 0 ? (totalChatUnread > 99 ? "99+" : totalChatUnread) : null;
  const notifBadge =
    unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : null;

  const handleFeedClick = (e: React.MouseEvent) => {
    if (location.pathname === "/feed") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.dispatchEvent(new CustomEvent("marshmallow:refresh-feed"));
      window.dispatchEvent(new CustomEvent("marbook:refresh-feed"));
    }
  };

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "calc(54px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backgroundColor: "var(--bg-card)",
        borderTop: "1px solid var(--border-color)",
        zIndex: 1400,
        boxShadow: "0 -2px 12px rgba(0, 0, 0, 0.06)",
        alignItems: "center",
        justifyContent: "space-around",
        boxSizing: "border-box",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* 1. Feed / Home */}
      <Link
        to="/feed"
        onClick={handleFeedClick}
        aria-label="Home Feed"
        className={`mobile-nav-item ${location.pathname === "/feed" ? "active" : ""}`}
      >
        <span className="mobile-nav-icon-wrap">
          {location.pathname === "/feed" ? (
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          ) : (
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          )}
        </span>
        <span className="mobile-nav-label">Feed</span>
      </Link>

      {/* 2. Explore / Search */}
      <Link
        to="/search"
        aria-label="Explore and Search"
        className={`mobile-nav-item ${location.pathname === "/search" ? "active" : ""}`}
      >
        <span className="mobile-nav-icon-wrap">
          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={location.pathname === "/search" ? "2.6" : "2.1"}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <span className="mobile-nav-label">Explore</span>
      </Link>

      {/* 3. Notifications */}
      <Link
        to="/notifications"
        aria-label="Notifications"
        className={`mobile-nav-item ${location.pathname === "/notifications" ? "active" : ""}`}
      >
        <span className="mobile-nav-icon-wrap" style={{ position: "relative" }}>
          {location.pathname === "/notifications" ? (
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
            </svg>
          ) : (
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          )}
          {notifBadge && (
            <span className="mobile-nav-badge">{notifBadge}</span>
          )}
        </span>
        <span className="mobile-nav-label">Alerts</span>
      </Link>

      {/* 4. Messages / Chat */}
      <Link
        to="/messages"
        aria-label="Messages"
        className={`mobile-nav-item ${location.pathname === "/messages" ? "active" : ""}`}
      >
        <span className="mobile-nav-icon-wrap" style={{ position: "relative" }}>
          {location.pathname === "/messages" ? (
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          ) : (
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
          {chatBadge && (
            <span className="mobile-nav-badge">{chatBadge}</span>
          )}
        </span>
        <span className="mobile-nav-label">Messages</span>
      </Link>

      {/* 5. Profile */}
      <Link
        to={profileUrl}
        aria-label="My Profile"
        className={`mobile-nav-item ${isProfileActive ? "active" : ""}`}
      >
        <span
          className="mobile-nav-icon-wrap"
          style={{
            borderRadius: "50%",
            padding: 2,
            border: isProfileActive
              ? "2px solid var(--primary)"
              : "2px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "border-color 0.15s ease",
          }}
        >
          <Avatar src={user.avatarUrl} name={user.name} size={22} />
        </span>
        <span className="mobile-nav-label">Profile</span>
      </Link>
    </nav>
  );
}

