import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";

export function LeftSidebar() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const { unreadChatCount } = useChat();

  if (!isAuthenticated || !user) {
    return null;
  }

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
      to: "/messages",
      label: "Messages",
      active: location.pathname === "/messages",
      badge: unreadChatCount.totalUnreadMessages > 0 ? (unreadChatCount.totalUnreadMessages > 99 ? "99+" : unreadChatCount.totalUnreadMessages) : null,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      to: `/profile/${user.id}`,
      label: "Profile",
      active: location.pathname === `/profile/${user.id}`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="app-left-rail" aria-label="Main Navigation">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Navigation List */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`social-nav-pill ${item.active ? "active" : ""}`}
            >
              <span className="nav-icon-only" style={{ display: "flex", alignItems: "center" }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
