import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../hooks/usePosts";
import { likesApi } from "../api/likes";
import { CommentsModal } from "../components/CommentsModal";
import type { Post } from "../types/posts";

function FeedPage() {
  const { user, isAuthenticated } = useAuth();
  const {
    posts,
    loading,
    loadingMore,
    error,
    loadMoreError,
    hasMore,
    loadMore,
    fetchPosts,
  } = usePosts();

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Likes state management
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(() => {
    try {
      const storageKey = `marbook_likes_${user?.id ?? "guest"}`;
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });

  const likingPostIdsRef = useRef<Set<number>>(new Set());
  const [likeAuthNotice, setLikeAuthNotice] = useState<string | null>(null);

  // Sync likes if logged-in user changes
  useEffect(() => {
    try {
      const storageKey = `marbook_likes_${user?.id ?? "guest"}`;
      const saved = localStorage.getItem(storageKey);
      setLikedPostIds(
        saved ? new Set<number>(JSON.parse(saved)) : new Set<number>()
      );
    } catch {
      setLikedPostIds(new Set<number>());
    }
  }, [user?.id]);

  // Comments modal state
  const [selectedPostForComments, setSelectedPostForComments] =
    useState<Post | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const handleOpenComments = (post: Post) => {
    setSelectedPostForComments(post);
    setIsCommentsOpen(true);
  };

  const handleCloseComments = () => {
    setIsCommentsOpen(false);
    setSelectedPostForComments(null);
  };

  // Toggle Like / Unlike (Instagram-style)
  const handleToggleLike = async (postId: number) => {
    if (!isAuthenticated) {
      setLikeAuthNotice("Please log in to like posts.");
      setTimeout(() => setLikeAuthNotice(null), 3500);
      return;
    }

    if (likingPostIdsRef.current.has(postId)) {
      return; // Prevent duplicate concurrent clicks
    }

    likingPostIdsRef.current.add(postId);
    const storageKey = `marbook_likes_${user?.id ?? "guest"}`;
    const isCurrentlyLiked = likedPostIds.has(postId);
    const updated = new Set(likedPostIds);

    if (isCurrentlyLiked) {
      // Optimistic unlike
      updated.delete(postId);
      setLikedPostIds(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...updated]));
        await likesApi.unlikePost(postId);
      } catch {
        // Revert on failure
        updated.add(postId);
        setLikedPostIds(new Set(updated));
        localStorage.setItem(storageKey, JSON.stringify([...updated]));
      } finally {
        likingPostIdsRef.current.delete(postId);
      }
    } else {
      // Optimistic like
      updated.add(postId);
      setLikedPostIds(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...updated]));
        await likesApi.likePost(postId);
      } catch {
        // Revert on failure
        updated.delete(postId);
        setLikedPostIds(new Set(updated));
        localStorage.setItem(storageKey, JSON.stringify([...updated]));
      } finally {
        likingPostIdsRef.current.delete(postId);
      }
    }
  };

  // Infinite scroll intersection observer
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry?.isIntersecting &&
          !loading &&
          !loadingMore &&
          hasMore &&
          !loadMoreError
        ) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "0px 0px 200px 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loading, loadingMore, hasMore, loadMoreError, loadMore]);

  return (
    <div
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          borderBottom: "1px solid #e4e6eb",
          paddingBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "#1c1e21",
            }}
          >
            Feed
          </h1>
          <p style={{ margin: "4px 0 0", color: "#65676b", fontSize: 14 }}>
            Welcome back, <strong>{user?.name ?? "there"}</strong>!
          </p>
        </div>
      </div>

      {/* Auth notice banner if user tries to like while logged out */}
      {likeAuthNotice && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            color: "#856404",
            border: "1px solid #ffeeba",
            borderRadius: 8,
            padding: "10px 16px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
          }}
        >
          <span>{likeAuthNotice}</span>
          <Link
            to="/login"
            style={{
              fontWeight: 600,
              color: "#856404",
              textDecoration: "underline",
            }}
          >
            Log In
          </Link>
        </div>
      )}

      {/* Initial loading state */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#65676b",
          }}
        >
          <div
            style={{
              display: "inline-block",
              width: 24,
              height: 24,
              border: "3px solid #e4e6eb",
              borderTopColor: "#1877f2",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              marginBottom: 10,
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ margin: 0, fontSize: 15 }}>Loading your feed...</p>
        </div>
      )}

      {/* Initial load error */}
      {error && (
        <div
          style={{
            background: "#fde8e8",
            border: "1px solid #f8b4b4",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            textAlign: "center",
            color: "#9b1c1c",
          }}
        >
          <p style={{ margin: "0 0 10px", fontWeight: 500 }}>{error}</p>
          <button
            type="button"
            onClick={() => fetchPosts()}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: "#e02424",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty feed */}
      {!loading && !error && posts.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "48px 20px",
            color: "#65676b",
            background: "#fff",
            border: "1px solid #e4e6eb",
            borderRadius: 8,
          }}
        >
          <p style={{ margin: 0, fontSize: 16 }}>No posts yet.</p>
        </div>
      )}

      {/* Posts list */}
      {!loading &&
        posts.map((post) => {
          const authorInitial = (post.userName || "U").charAt(0).toUpperCase();
          const postDate = new Date(post.createdAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          });
          const isLiked = likedPostIds.has(post.id);

          return (
            <article
              key={post.id}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #e4e6eb",
                borderRadius: 8,
                padding: "16px 20px",
                marginBottom: 16,
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Header with avatar, author, date */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "#1877f2",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {authorInitial}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: "#050505",
                      lineHeight: 1.2,
                    }}
                  >
                    {post.userName}
                  </div>
                  <small
                    style={{
                      color: "#65676b",
                      fontSize: 12,
                    }}
                  >
                    {postDate}
                  </small>
                </div>
              </div>

              {/* Content */}
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: "#1c1e21",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {post.content}
              </p>

              {/* Instagram-style Actions: Like & Comment */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px solid #f0f2f5",
                }}
              >
                {/* Heart / Like Button (Instagram-style) */}
                <button
                  type="button"
                  onClick={() => handleToggleLike(post.id)}
                  aria-label={isLiked ? "Unlike post" : "Like post"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: isLiked ? "#ed4956" : "#262626",
                    transition: "transform 0.1s ease",
                  }}
                  onMouseDown={(e) =>
                    (e.currentTarget.style.transform = "scale(0.92)")
                  }
                  onMouseUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill={isLiked ? "#ed4956" : "none"}
                    stroke={isLiked ? "#ed4956" : "#262626"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transition: "fill 0.15s ease, stroke 0.15s ease",
                    }}
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isLiked ? "#ed4956" : "#4b4f56",
                    }}
                  >
                    {isLiked ? "Liked" : "Like"}
                  </span>
                </button>

                {/* Comment Button (Instagram-style) */}
                <button
                  type="button"
                  onClick={() => handleOpenComments(post)}
                  aria-label="Comment on post"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#262626",
                    transition: "transform 0.1s ease",
                  }}
                  onMouseDown={(e) =>
                    (e.currentTarget.style.transform = "scale(0.92)")
                  }
                  onMouseUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#262626"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#4b4f56",
                    }}
                  >
                    Comment
                  </span>
                </button>
              </div>
            </article>
          );
        })}

      {/* Sentinel element to trigger loading the next page when scrolling within 200px */}
      {hasMore && !loading && (
        <div ref={sentinelRef} style={{ height: 1 }} />
      )}

      {/* Loading indicator for subsequent pages */}
      {loadingMore && (
        <div
          style={{
            textAlign: "center",
            padding: "16px",
            color: "#65676b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              border: "2px solid #e4e6eb",
              borderTopColor: "#1877f2",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: 14 }}>Loading more posts...</span>
        </div>
      )}

      {/* Load more error with retry option */}
      {loadMoreError && (
        <div
          style={{
            textAlign: "center",
            padding: "16px",
            background: "#fff",
            border: "1px solid #f8b4b4",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <p style={{ margin: "0 0 10px", color: "#9b1c1c", fontSize: 14 }}>
            {loadMoreError}
          </p>
          <button
            type="button"
            onClick={() => loadMore()}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #e02424",
              background: "#fff",
              color: "#e02424",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* End of feed indicator */}
      {!loading && !hasMore && posts.length > 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "24px 16px",
            color: "#65676b",
            borderTop: "1px solid #e4e6eb",
            marginTop: 16,
          }}
        >
          <div style={{ fontSize: 18, marginBottom: 4 }}>✓</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#1c1e21" }}>
            You're up to date
          </div>
          <small style={{ color: "#65676b", fontSize: 13 }}>
            You have seen all recent posts.
          </small>
        </div>
      )}

      {/* Instagram-style Comments Modal */}
      <CommentsModal
        post={selectedPostForComments}
        isOpen={isCommentsOpen}
        onClose={handleCloseComments}
      />
    </div>
  );
}

export default FeedPage;