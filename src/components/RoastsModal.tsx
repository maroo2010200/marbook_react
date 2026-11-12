import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { followsApi } from "../api/follows";
import type { PagedResult } from "../types/posts";
import type { UserSearchResult } from "../types/user";
import { Avatar } from "./Avatar";
import { MarshmallowLoader } from "./MarshmallowLoader";
import { CloseIcon } from "./chat/ChatIcons";

const PAGE_SIZE = 20;

export interface RoastsModalProps {
  isOpen: boolean;
  title?: string;
  isAuthenticated: boolean;
  onClose: () => void;
  fetchPage: (pageNumber: number, pageSize: number) => Promise<PagedResult<UserSearchResult>>;
}

export function RoastsModal({
  isOpen,
  title = "People who roasted this 🔥",
  isAuthenticated,
  onClose,
  fetchPage,
}: RoastsModalProps) {
  if (!isOpen) return null;

  return (
    <RoastsModalContent
      title={title}
      isAuthenticated={isAuthenticated}
      onClose={onClose}
      fetchPage={fetchPage}
    />
  );
}

function RoastsModalContent({
  title,
  isAuthenticated,
  onClose,
  fetchPage,
}: Omit<RoastsModalProps, "isOpen">) {
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingUserIds, setTogglingUserIds] = useState<Set<number>>(new Set());

  const loadPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      try {
        const res = await fetchPage(targetPage, PAGE_SIZE);
        setUsers((prev) => (replace ? res.items : [...prev, ...res.items]));
        setTotalCount(res.totalCount);
        setPage(targetPage);
        setError(null);
      } catch {
        setError("Failed to load people who roasted this.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [fetchPage]
  );

  useEffect(() => {
    let cancelled = false;
    fetchPage(1, PAGE_SIZE)
      .then((res) => {
        if (cancelled) return;
        setUsers(res.items);
        setTotalCount(res.totalCount);
        setPage(1);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load people who roasted this.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  const handleToggleFollow = async (targetUser: UserSearchResult) => {
    if (!isAuthenticated || targetUser.isMe || togglingUserIds.has(targetUser.id)) {
      return;
    }

    const currentlyFollowing = Boolean(targetUser.isFollowing);
    setTogglingUserIds((prev) => {
      const next = new Set(prev);
      next.add(targetUser.id);
      return next;
    });

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUser.id ? { ...u, isFollowing: !currentlyFollowing } : u
      )
    );

    try {
      if (currentlyFollowing) {
        await followsApi.unfollow(targetUser.id);
      } else {
        await followsApi.follow(targetUser.id);
      }
    } catch {
      // Revert on failure
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, isFollowing: currentlyFollowing } : u
        )
      );
    } finally {
      setTogglingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUser.id);
        return next;
      });
    }
  };

  const hasMore = users.length < totalCount;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "var(--modal-overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1800,
        padding: 12,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: 14,
          maxWidth: 440,
          width: "100%",
          maxHeight: "80dvh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border-color)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--divider)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {title}
            </h3>
            {!loading && totalCount > 0 && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#ff6b35",
                  backgroundColor: "rgba(255, 107, 53, 0.12)",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                {totalCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close roasters list"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Scrollable List */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: "10px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {loading ? (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <MarshmallowLoader size="sm" label="Loading roasters..." />
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "20px 8px", color: "#e02424", fontSize: 13 }}>
              <p style={{ margin: "0 0 10px" }}>{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  void loadPage(1, true);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid #e02424",
                  backgroundColor: "transparent",
                  color: "#e02424",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "28px 12px",
                color: "var(--text-secondary)",
                fontSize: 13.5,
              }}
            >
              No roasts yet.
            </div>
          ) : (
            <>
              {users.map((u) => {
                const profilePath = u.username ? `/@${u.username}` : `/profile/${u.id}`;
                const isUpdating = togglingUserIds.has(u.id);
                const isFollowing = Boolean(u.isFollowing);

                return (
                  <div
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 6px",
                      borderRadius: 10,
                    }}
                  >
                    <Link
                      to={profilePath}
                      onClick={onClose}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 0,
                        flex: 1,
                        textDecoration: "none",
                      }}
                    >
                      <Avatar src={u.avatarUrl} name={u.name} size={40} fontSize={15} />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {u.name}
                        </div>
                        {u.username && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--text-secondary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            @{u.username}
                          </div>
                        )}
                      </div>
                    </Link>

                    {isAuthenticated && !u.isMe && (
                      <button
                        type="button"
                        onClick={() => void handleToggleFollow(u)}
                        disabled={isUpdating}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: isFollowing ? "1px solid var(--border-color)" : "none",
                          backgroundColor: isFollowing ? "var(--bg-hover)" : "var(--primary)",
                          color: isFollowing ? "var(--text-primary)" : "#fff",
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: isUpdating ? "not-allowed" : "pointer",
                          flexShrink: 0,
                        }}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}

              {hasMore && (
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => {
                    setLoadingMore(true);
                    void loadPage(page + 1, false);
                  }}
                  style={{
                    marginTop: 6,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-hover)",
                    color: "var(--text-primary)",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: loadingMore ? "not-allowed" : "pointer",
                  }}
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
