import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../api/users";
import { postsApi } from "../api/posts";
import { followsApi } from "../api/follows";
import { likesApi } from "../api/likes";
import { PostCard } from "../components/posts/PostCard";
import { CommentsModal } from "../components/comments/CommentsModal";
import { UserCard } from "../components/UserCard";
import { MainLayout } from "../components/layout/MainLayout";
import { MarshmallowLoader } from "../components/MarshmallowLoader";
import { soundEffects } from "../utils/soundEffects";
import type { UserSearchResult } from "../types/user";
import type { Post } from "../types/posts";

type SearchTab = "all" | "people" | "posts";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const query = searchParams.get("q") || "";
  const tabParam = (searchParams.get("type") as SearchTab) || "all";
  const [activeTab, setActiveTab] = useState<SearchTab>(tabParam);

  // Users state
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});
  const [followingActionLoading, setFollowingActionLoading] = useState<Record<number, boolean>>({});

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState(query);
  const [suggestedUsers, setSuggestedUsers] = useState<UserSearchResult[]>([]);
  const [explorePosts, setExplorePosts] = useState<Post[]>([]);
  const [isLoadingExplorePosts, setIsLoadingExplorePosts] = useState(false);

  // Sync searchTerm if query changes externally (e.g. back/forward navigation)
  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  // Live instant debounced search as user types (before hitting Enter)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchTerm.trim();
      if (trimmed !== query) {
        setSearchParams(
          trimmed
            ? { q: trimmed, type: activeTab }
            : activeTab !== "all"
            ? { type: activeTab }
            : {}
        );
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchTerm, query, activeTab, setSearchParams]);

  // Fetch explore content when query is empty
  useEffect(() => {
    if (!query.trim()) {
      setIsLoadingExplorePosts(true);
      postsApi
        .getAll(1, 10)
        .then((res) => {
          const items = res.items || [];
          setExplorePosts(items);
          setLikedPostIds((prev) => {
            const next = new Set(prev);
            for (const p of items) {
              if (p.isLiked) next.add(p.id);
            }
            return next;
          });
        })
        .catch(() => {})
        .finally(() => setIsLoadingExplorePosts(false));

      usersApi
        .searchUsers("", 1, 8)
        .then((res) => {
          const filtered = (res.items || []).filter((u) => u.id !== currentUser?.id);
          setSuggestedUsers(filtered);
          const map: Record<number, boolean> = {};
          filtered.forEach((u) => {
            if (u.isFollowing !== undefined) map[u.id] = u.isFollowing;
          });
          setFollowingMap((prev) => ({ ...prev, ...map }));
        })
        .catch(() => {});
    }
  }, [query, currentUser?.id]);
  const [postsPage, setPostsPage] = useState(1);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(false);

  // Likes state for PostCard
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(() => {
    try {
      const storageKey = `marbook_likes_${currentUser?.id ?? "guest"}`;
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });

  // Comments modal state
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    setSearchParams({ q: query, type: tab });
  };

  // Perform search when query changes
  const performSearch = useCallback(async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setUsers([]);
      setPosts([]);
      setUsersTotal(0);
      setPostsTotal(0);
      return;
    }

    setIsLoadingUsers(true);
    setIsLoadingPosts(true);

    try {
      const [usersRes, postsRes] = await Promise.allSettled([
        usersApi.searchUsers(trimmed, 1, 12),
        postsApi.searchPosts(trimmed, 1, 10),
      ]);

      if (usersRes.status === "fulfilled") {
        const items = usersRes.value.items || [];
        setUsers(items);
        setUsersTotal(usersRes.value.totalCount || items.length);
        setUsersPage(1);
        setHasMoreUsers(items.length < (usersRes.value.totalCount || 0));

        // Initialize follow status
        const followState: Record<number, boolean> = {};
        for (const u of items) {
          if (u.isFollowing !== undefined) {
            followState[u.id] = u.isFollowing;
          }
        }
        setFollowingMap(followState);
      } else {
        setUsers([]);
        setUsersTotal(0);
      }

      if (postsRes.status === "fulfilled") {
        const items = postsRes.value.items || [];
        setPosts(items);
        setPostsTotal(postsRes.value.totalCount || items.length);
        setPostsPage(1);
        setHasMorePosts(items.length < (postsRes.value.totalCount || 0));

        // Sync liked posts
        setLikedPostIds((prev) => {
          const next = new Set(prev);
          for (const p of items) {
            if (p.isLiked) next.add(p.id);
          }
          return next;
        });
      } else {
        setPosts([]);
        setPostsTotal(0);
      }
    } catch (err) {
      console.error("Search execution failed:", err);
    } finally {
      setIsLoadingUsers(false);
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  // Load more users
  const handleLoadMoreUsers = async () => {
    if (isLoadingUsers || !hasMoreUsers) return;
    const nextPage = usersPage + 1;
    setIsLoadingUsers(true);
    try {
      const res = await usersApi.searchUsers(query.trim(), nextPage, 12);
      const newItems = res.items || [];
      setUsers((prev) => [...prev, ...newItems]);
      setUsersPage(nextPage);
      setHasMoreUsers(users.length + newItems.length < res.totalCount);

      setFollowingMap((prev) => {
        const next = { ...prev };
        for (const u of newItems) {
          if (u.isFollowing !== undefined) {
            next[u.id] = u.isFollowing;
          }
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to load more users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load more posts
  const handleLoadMorePosts = async () => {
    if (isLoadingPosts || !hasMorePosts) return;
    const nextPage = postsPage + 1;
    setIsLoadingPosts(true);
    try {
      const res = await postsApi.searchPosts(query.trim(), nextPage, 10);
      const newItems = res.items || [];
      setPosts((prev) => [...prev, ...newItems]);
      setPostsPage(nextPage);
      setHasMorePosts(posts.length + newItems.length < res.totalCount);

      setLikedPostIds((prev) => {
        const next = new Set(prev);
        for (const p of newItems) {
          if (p.isLiked) next.add(p.id);
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to load more posts:", err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Follow / Unfollow user
  const handleToggleFollow = async (targetUser: UserSearchResult) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const currentStatus = !!followingMap[targetUser.id];
    const newStatus = !currentStatus;

    // Optimistic UI update
    setFollowingMap((prev) => ({ ...prev, [targetUser.id]: newStatus }));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUser.id
          ? {
            ...u,
            isFollowing: newStatus,
            followersCount: Math.max(
              0,
              (u.followersCount ?? 0) + (newStatus ? 1 : -1)
            ),
          }
          : u
      )
    );

    setFollowingActionLoading((prev) => ({ ...prev, [targetUser.id]: true }));

    try {
      if (newStatus) {
        soundEffects.playFollow();
        await followsApi.follow(targetUser.id);
      } else {
        await followsApi.unfollow(targetUser.id);
      }
    } catch (err) {
      console.error("Follow action failed, rolling back:", err);
      // Rollback
      setFollowingMap((prev) => ({ ...prev, [targetUser.id]: currentStatus }));
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? {
              ...u,
              isFollowing: currentStatus,
              followersCount: Math.max(
                0,
                (u.followersCount ?? 0) + (currentStatus ? 1 : -1)
              ),
            }
            : u
        )
      );
    } finally {
      setFollowingActionLoading((prev) => ({ ...prev, [targetUser.id]: false }));
    }
  };

  // Like toggle for PostCard
  const handleToggleLike = async (postId: number) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const isCurrentlyLiked = likedPostIds.has(postId);
    const nextLiked = !isCurrentlyLiked;

    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (nextLiked) next.add(postId);
      else next.delete(postId);
      return next;
    });

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const currentCount = p.likesCount ?? 0;
        return {
          ...p,
          isLiked: nextLiked,
          likesCount: nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
        };
      })
    );

    try {
      if (nextLiked) {
        await likesApi.likePost(postId);
      } else {
        await likesApi.unlikePost(postId);
      }
    } catch (err) {
      console.error("Toggle like failed, rolling back:", err);
      // Rollback
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const currentCount = p.likesCount ?? 0;
          return {
            ...p,
            isLiked: isCurrentlyLiked,
            likesCount: isCurrentlyLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
          };
        })
      );
    }
  };

  const handleOpenComments = (post: Post) => {
    setSelectedPostForComments(post);
    setIsCommentsOpen(true);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setPostsTotal((prev) => Math.max(0, prev - 1));
  };

  const isInitialLoading = (isLoadingUsers || isLoadingPosts) && users.length === 0 && posts.length === 0;

  return (
    <MainLayout>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 20,
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            {query.trim() ? (
              <>
                Search results for{" "}
                <span style={{ color: "var(--primary)" }}>&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              "Explore & Search Marshmallow"
            )}
          </h1>
          {query.trim() && (
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
              {usersTotal} {usersTotal === 1 ? "person" : "people"}, {postsTotal}{" "}
              {postsTotal === 1 ? "post" : "posts"}
            </span>
          )}
        </div>

        {/* Explore Search Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = searchTerm.trim();
            setSearchParams(
              trimmed
                ? { q: trimmed, type: activeTab }
                : activeTab !== "all"
                ? { type: activeTab }
                : {}
            );
          }}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 14,
                color: "var(--text-secondary)",
                fontSize: 16,
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for people, @usernames, or posts on Marshmallow (instant results)..."
              autoFocus
              style={{
                width: "100%",
                padding: "12px 48px 12px 42px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.15s ease",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-color)")}
            />
            <div
              style={{
                position: "absolute",
                right: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {(isLoadingUsers || isLoadingPosts) && (
                <div style={{ width: 28, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MarshmallowLoader size="sm" inline label={null} />
                </div>
              )}
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSearchParams(activeTab !== "all" ? { type: activeTab } : {});
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: "4px",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <button
            type="submit"
            style={{
              padding: "12px 22px",
              borderRadius: "var(--radius-full)",
              border: "none",
              backgroundColor: "var(--primary)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            Search
          </button>
        </form>

        {/* Quick Discovery Topic Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
            Suggestions:
          </span>
          {["🧁 Marshmallow", "🔥 S'mores", "☕ Campfire", "React", ".NET 10", "Social"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                const cleaned = tag.replace(/^[^\w]+/, "").trim();
                setSearchTerm(cleaned);
                setSearchParams({ q: cleaned, type: activeTab });
              }}
              style={{
                padding: "4px 11px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-hover)",
                color: "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.color = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Tab Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: 4,
          }}
        >
          <button
            type="button"
            onClick={() => handleTabChange("all")}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              backgroundColor: activeTab === "all" ? "var(--primary)" : "transparent",
              color: activeTab === "all" ? "#fff" : "var(--text-secondary)",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>All</span>
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 10,
                backgroundColor:
                  activeTab === "all" ? "rgba(255,255,255,0.25)" : "var(--bg-hover)",
                color: activeTab === "all" ? "#fff" : "var(--text-secondary)",
              }}
            >
              {usersTotal + postsTotal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("people")}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              backgroundColor: activeTab === "people" ? "var(--primary)" : "transparent",
              color: activeTab === "people" ? "#fff" : "var(--text-secondary)",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>People 👥</span>
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 10,
                backgroundColor:
                  activeTab === "people" ? "rgba(255,255,255,0.25)" : "var(--bg-hover)",
                color: activeTab === "people" ? "#fff" : "var(--text-secondary)",
              }}
            >
              {usersTotal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("posts")}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              backgroundColor: activeTab === "posts" ? "var(--primary)" : "transparent",
              color: activeTab === "posts" ? "#fff" : "var(--text-secondary)",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>Posts 📝</span>
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 10,
                backgroundColor:
                  activeTab === "posts" ? "rgba(255,255,255,0.25)" : "var(--bg-hover)",
                color: activeTab === "posts" ? "#fff" : "var(--text-secondary)",
              }}
            >
              {postsTotal}
            </span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isInitialLoading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <MarshmallowLoader
            size="lg"
            label="Searching Marshmallow..."
            sublabel="Roasting search results over the campfire..."
          />
        </div>
      )}

      {/* No Query / Empty Prompt */}
      {!query.trim() && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Welcome Explorer Banner */}
          <div
            className="social-widget-card"
            style={{
              padding: "24px",
              textAlign: "center",
              background:
                "linear-gradient(135deg, rgba(201, 107, 50, 0.08) 0%, rgba(245, 158, 11, 0.12) 100%)",
              border: "1px solid rgba(201, 107, 50, 0.22)",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔥</div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 6px",
              }}
            >
              Explore &amp; Discover Marshmallow
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 13.5,
                maxWidth: 480,
                margin: "0 auto",
                lineHeight: 1.5,
              }}
            >
              Search for people, @usernames, or topics above with instant live results, or explore the freshest campfire posts below!
            </p>
          </div>

          {/* Discover People Section */}
          {(activeTab === "all" || activeTab === "people") && suggestedUsers.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  People You Might Like 👥
                </h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 14,
                }}
              >
                {suggestedUsers.map((targetUser) => (
                  <UserCard
                    key={targetUser.id}
                    user={targetUser}
                    isFollowing={!!followingMap[targetUser.id]}
                    isActionLoading={!!followingActionLoading[targetUser.id]}
                    isMe={currentUser?.id === targetUser.id}
                    onToggleFollow={() => handleToggleFollow(targetUser)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Explore Posts Stream */}
          {(activeTab === "all" || activeTab === "posts") && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                  marginTop: 6,
                }}
              >
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Recent Campfire Posts 🔥
                </h3>
              </div>

              {isLoadingExplorePosts ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <MarshmallowLoader
                    size="md"
                    label="Toasting explore posts..."
                  />
                </div>
              ) : explorePosts.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "var(--text-secondary)",
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  No posts around the campfire yet. Be the first to roast a post!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {explorePosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      isLiked={likedPostIds.has(post.id)}
                      currentUserId={currentUser?.id}
                      onToggleLike={handleToggleLike}
                      onOpenComments={handleOpenComments}
                      onPostUpdated={(updated) =>
                        setExplorePosts((prev) =>
                          prev.map((p) => (p.id === updated.id ? updated : p))
                        )
                      }
                      onPostDeleted={(postId) =>
                        setExplorePosts((prev) => prev.filter((p) => p.id !== postId))
                      }
                      onRepost={(_repost, targetId, isReposted, newCount) => {
                        setExplorePosts((prev) =>
                          prev.map((p) =>
                            p.id === targetId
                              ? { ...p, isReposted, repostsCount: newCount }
                              : p
                          )
                        );
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content for TAB: ALL */}
      {query.trim() && !isInitialLoading && activeTab === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* People Section in All */}
          {users.length > 0 && (
            <div
              style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: 16,
                padding: "20px 24px",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  People ({usersTotal})
                </h2>
                {usersTotal > 3 && (
                  <button
                    type="button"
                    onClick={() => handleTabChange("people")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    See all people &rarr;
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 14,
                }}
              >
                {users.slice(0, 6).map((targetUser) => (
                  <UserCard
                    key={targetUser.id}
                    user={targetUser}
                    isFollowing={!!followingMap[targetUser.id]}
                    isActionLoading={!!followingActionLoading[targetUser.id]}
                    isMe={currentUser?.id === targetUser.id}
                    onToggleFollow={() => handleToggleFollow(targetUser)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Posts Section in All */}
          {posts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 4px",
                }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Posts ({postsTotal})
                </h2>
                {postsTotal > 5 && (
                  <button
                    type="button"
                    onClick={() => handleTabChange("posts")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    See all posts &rarr;
                  </button>
                )}
              </div>

              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLiked={likedPostIds.has(post.id)}
                  currentUserId={currentUser?.id}
                  onToggleLike={handleToggleLike}
                  onOpenComments={handleOpenComments}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                  onRepost={(_repost, targetId, isReposted, newCount) => {
                    setPosts((prev) =>
                      prev.map((p) =>
                        p.id === targetId
                          ? { ...p, isReposted, repostsCount: newCount }
                          : p
                      )
                    );
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content for TAB: PEOPLE */}
      {query.trim() && !isInitialLoading && activeTab === "people" && (
        <div>
          {users.length === 0 ? (
            <div
              style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: 16,
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              No people found matching &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                {users.map((targetUser) => (
                  <UserCard
                    key={targetUser.id}
                    user={targetUser}
                    isFollowing={!!followingMap[targetUser.id]}
                    isActionLoading={!!followingActionLoading[targetUser.id]}
                    isMe={currentUser?.id === targetUser.id}
                    onToggleFollow={() => handleToggleFollow(targetUser)}
                  />
                ))}
              </div>

              {hasMoreUsers && (
                <div style={{ textAlign: "center", marginTop: 24 }}>
                  <button
                    type="button"
                    onClick={handleLoadMoreUsers}
                    disabled={isLoadingUsers}
                    style={{
                      padding: "10px 28px",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 20,
                      color: "var(--text-primary)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isLoadingUsers ? "not-allowed" : "pointer",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {isLoadingUsers ? "Loading..." : "Load More People"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Content for TAB: POSTS */}
      {query.trim() && !isInitialLoading && activeTab === "posts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {posts.length === 0 ? (
            <div
              style={{
                backgroundColor: "var(--bg-card)",
                borderRadius: 16,
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              No posts found matching &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLiked={likedPostIds.has(post.id)}
                  currentUserId={currentUser?.id}
                  onToggleLike={handleToggleLike}
                  onOpenComments={handleOpenComments}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                  onRepost={(_repost, targetId, isReposted, newCount) => {
                    setPosts((prev) =>
                      prev.map((p) =>
                        p.id === targetId
                          ? { ...p, isReposted, repostsCount: newCount }
                          : p
                      )
                    );
                  }}
                />
              ))}

              {hasMorePosts && (
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={handleLoadMorePosts}
                    disabled={isLoadingPosts}
                    style={{
                      padding: "10px 28px",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 20,
                      color: "var(--text-primary)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isLoadingPosts ? "not-allowed" : "pointer",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {isLoadingPosts ? "Loading..." : "Load More Posts"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Comments Modal */}
      {selectedPostForComments && (
        <CommentsModal
          isOpen={isCommentsOpen}
          post={selectedPostForComments}
          onClose={() => {
            setIsCommentsOpen(false);
            setSelectedPostForComments(null);
          }}
        />
      )}
    </MainLayout>
  );
}