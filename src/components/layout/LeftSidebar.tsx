import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { useNotifications } from "../../context/NotificationContext";
import { Avatar } from "../Avatar";

export function LeftSidebar() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const { unreadChatCount } = useChat();
  const { unreadCount } = useNotifications();

  if (!isAuthenticated || !user) {
    return null;
  }

  const notificationBadge =
    unreadCount > 0
      ? unreadCount > 99
        ? "99+"
        : unreadCount
      : null;

  const chatBadge =
    unreadChatCount.totalUnreadMessages > 0
      ? unreadChatCount.totalUnreadMessages > 99
        ? "99+"
        : unreadChatCount.totalUnreadMessages
      : null;

  const profileUrl = user.username ? `/@${user.username}` : `/profile/${user.id}`;

  const navItems = [
    {
      to: "/feed",
      label: "Feed",
      active: location.pathname === "/feed",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      to: "/notifications",
      label: "Notifications",
      active: location.pathname === "/notifications",
      badge: notificationBadge,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      to: "/messages",
      label: "Messages",
      active: location.pathname === "/messages",
      badge: chatBadge,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      to: "/search",
      label: "Explore",
      active: location.pathname === "/search",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      to: profileUrl,
      label: "Profile",
      active:
        location.pathname === profileUrl ||
        location.pathname === `/profile/${user.id}` ||
        (Boolean(user.username) && location.pathname === `/@${user.username}`),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      to: "/settings",
      label: "Settings",
      active: location.pathname === "/settings",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="app-left-rail" aria-label="Main Navigation">
      <div className="app-left-rail-top">
        {/* Navigation List */}
        <nav className="app-left-rail-nav">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`social-nav-pill ${item.active ? "active" : ""}`}
              title={item.label}
            >
              <span className="nav-icon-only">
                {item.icon}
              </span>
              <span className="nav-pill-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}
        </nav>

        {/* Brand CTA: New Post */}
        <Link
          to="/feed"
          className="app-left-rail-cta"
          title="Roast a Post"
        >
          <span className="app-left-rail-cta-icon">✏️</span>
          <span className="app-left-rail-cta-label">Roast a Post</span>
        </Link>
      </div>

      {/* Mini User Card at bottom of left rail */}
      <div className="app-left-rail-user-card">
        <Link
          to={profileUrl}
          className="app-left-rail-user-link"
          title={`View ${user.name}'s profile`}
        >
          <Avatar src={user.avatarUrl} name={user.name} size={36} />
          <div className="app-left-rail-user-meta">
            <div className="app-left-rail-user-name">
              {user.name}
            </div>
            <div className="app-left-rail-user-handle">
              @{user.username || "user"}
            </div>
          </div>
        </Link>
        <Link
          to="/settings"
          title="Settings & Privacy"
          className="app-left-rail-user-settings"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>
    </aside>
  );
}
