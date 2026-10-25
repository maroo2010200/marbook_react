import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "./Avatar";
import type { UserSearchResult } from "../types/user";

export interface UserCardProps {
  user: UserSearchResult;
  isFollowing: boolean;
  isActionLoading: boolean;
  isMe: boolean;
  onToggleFollow: () => void;
}

export function UserCard({
  user,
  isFollowing,
  isActionLoading,
  isMe,
  onToggleFollow,
}: UserCardProps) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        boxShadow: "var(--shadow-sm)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      <Link
        to={`/profile/${user.id}`}
        style={{
          textDecoration: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Avatar
          src={user.avatarUrl}
          name={user.name}
          size={68}
          fontSize={24}
          style={{
            marginBottom: 10,
            border: "2px solid var(--border-color)",
          }}
        />
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "var(--text-primary)",
            width: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user.name}
        </div>
        {user.username && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            @{user.username}
          </div>
        )}
      </Link>

      {user.bio ? (
        <p
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            margin: "4px 0 12px",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minHeight: 34,
          }}
        >
          {user.bio}
        </p>
      ) : (
        <div style={{ minHeight: 34, margin: "4px 0 12px" }} />
      )}

      {/* Follower Metric */}
      {user.followersCount !== undefined && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-secondary)",
            marginBottom: 12,
            fontWeight: 500,
          }}
        >
          {user.followersCount} {user.followersCount === 1 ? "follower" : "followers"}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 8, width: "100%", marginTop: "auto" }}>
        {!isMe ? (
          <>
            <button
              type="button"
              onClick={onToggleFollow}
              disabled={isActionLoading}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: isFollowing ? "1px solid var(--border-color)" : "none",
                backgroundColor: isFollowing ? "var(--bg-hover)" : "var(--primary)",
                color: isFollowing ? "var(--text-primary)" : "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: isActionLoading ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {isActionLoading
                ? "..."
                : isFollowing
                  ? "Following"
                  : "Follow"}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/messages?conversationId=${user.id}`)}
              title="Send direct message"
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              💬
            </button>
          </>
        ) : (
          <Link
            to="/profile/me"
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-hover)",
              color: "var(--text-primary)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              display: "block",
            }}
          >
            Your Profile
          </Link>
        )}
      </div>
    </div>
  );
}
