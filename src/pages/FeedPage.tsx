import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../hooks/usePosts";

function FeedPage() {
  const { user } = useAuth();
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
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
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
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1c1e21" }}>
            Feed
          </h1>
          <p style={{ margin: "4px 0 0", color: "#65676b", fontSize: 14 }}>
            Welcome back, <strong>{user?.name ?? "there"}</strong>!
          </p>
        </div>
      </div>

      {/* Initial loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#65676b" }}>
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
                  alignItems: "left",
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
                      color: "#796d6dff",
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
    </div>
  );
}

export default FeedPage;