import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../hooks/usePosts";
import { likesApi } from "../api/likes";
import api from "../api/api";
import { CommentsModal } from "../components/CommentsModal";
import { PostComposer } from "../components/PostComposer";
import { PostCard } from "../components/PostCard";
import { MainLayout } from "../components/layout/MainLayout";
import type { Post } from "../types/posts";

function FeedPage() {
  const { user, isAuthenticated } = useAuth();
  const [feedTab, setFeedTab] = useState<"for-you" | "following">("for-you");

  const {
    posts,
    updatePost,
    createPost,
    removePost,
    loading,
    loadingMore,
    error,
    loadMoreError,
    hasMore,
    loadMore,
    fetchPosts,
  } = usePosts(1, 10, {
    followingOnly: feedTab === "following",
  });

  // Reload feed and scroll to top when Marbook logo is clicked
  useEffect(() => {
    const handleRefresh = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      fetchPosts();
    };

    window.addEventListener("marbook:refresh-feed", handleRefresh);
    return () => {
      window.removeEventListener("marbook:refresh-feed", handleRefresh);
    };
  }, [fetchPosts]);

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

  // Sync likedPostIds from backend isLiked status on posts
  useEffect(() => {
    if (posts.length > 0) {
      setLikedPostIds((prev) => {
        let changed = false;
        const next = new Set(prev);
        for (const p of posts) {
          if (p.isLiked && !next.has(p.id)) {
            next.add(p.id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [posts]);

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

  // Handle deep-linking from notifications (?postId=123&openComments=true)
  const [searchParams, setSearchParams] = useSearchParams();
  const targetPostIdParam = searchParams.get("postId");
  const openCommentsParam = searchParams.get("openComments");

  useEffect(() => {
    if (!targetPostIdParam) return;
    const targetPostId = Number(targetPostIdParam);
    if (!targetPostId || isNaN(targetPostId)) return;

    const foundPost = posts.find((p) => p.id === targetPostId);

    if (foundPost) {
      const el = document.getElementById(`post-${targetPostId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.transition = "box-shadow 0.3s ease";
        el.style.boxShadow =
          "0 0 0 2px #1877f2, 0 4px 12px rgba(24, 119, 242, 0.25)";
        setTimeout(() => {
          el.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
        }, 2500);
      }

      if (openCommentsParam === "true") {
        handleOpenComments(foundPost);
      }

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("postId");
          next.delete("openComments");
          return next;
        },
        { replace: true }
      );
    } else if (!loading) {
      // If the post is not in the first page of feed, fetch it directly
      api
        .get<Post>(`/posts/${targetPostId}`)
        .then((res) => {
          if (openCommentsParam === "true") {
            handleOpenComments(res.data);
          }
        })
        .catch(() => {
          // ignore if post was deleted or not accessible
        })
        .finally(() => {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete("postId");
              next.delete("openComments");
              return next;
            },
            { replace: true }
          );
        });
    }
  }, [targetPostIdParam, openCommentsParam, posts, loading, setSearchParams]);

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
    const targetPost = posts.find((p) => p.id === postId);
    const isCurrentlyLiked = Boolean(
      targetPost?.isLiked ?? likedPostIds.has(postId)
    );
    const currentLikesCount =
      targetPost?.likesCount ?? (isCurrentlyLiked ? 1 : 0);
    const nextLiked = !isCurrentlyLiked;
    const optimisticCount = nextLiked
      ? currentLikesCount + 1
      : Math.max(0, currentLikesCount - 1);

    // Optimistic UI update
    const updated = new Set(likedPostIds);
    if (nextLiked) {
      updated.add(postId);
    } else {
      updated.delete(postId);
    }
    setLikedPostIds(updated);

    updatePost(postId, { isLiked: nextLiked, likesCount: optimisticCount });

    try {
      localStorage.setItem(storageKey, JSON.stringify([...updated]));
      if (nextLiked) {
        const res = await likesApi.likePost(postId);
        if (res && typeof res.likeCount === "number") {
          updatePost(postId, { isLiked: res.liked, likesCount: res.likeCount });
        }
      } else {
        const res = await likesApi.unlikePost(postId);
        if (res && typeof res.likeCount === "number") {
          updatePost(postId, { isLiked: res.liked, likesCount: res.likeCount });
        }
      }
    } catch {
      // Revert on failure
      const reverted = new Set(likedPostIds);
      setLikedPostIds(reverted);
      updatePost(postId, {
        isLiked: isCurrentlyLiked,
        likesCount: currentLikesCount,
      });
      localStorage.setItem(storageKey, JSON.stringify([...reverted]));
    } finally {
      likingPostIdsRef.current.delete(postId);
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
    <MainLayout>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Feed
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              color: "var(--text-secondary)",
              fontSize: 14,
            }}
          >
            Welcome back, <strong>{user?.name ?? "there"}</strong>!
          </p>
        </div>
      </div>

      {/* Personalized Feed Switcher Tabs */}
      <div
        style={{
          display: "flex",
          backgroundColor: "var(--bg-card)",
          borderRadius: 12,
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border-color)",
          padding: "4px",
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          id="feed-tab-for-you"
          onClick={() => setFeedTab("for-you")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            backgroundColor:
              feedTab === "for-you" ? "var(--primary-light)" : "transparent",
            color:
              feedTab === "for-you"
                ? "var(--primary)"
                : "var(--text-secondary)",
            fontWeight: feedTab === "for-you" ? 700 : 600,
            fontSize: 14,
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span>🌐</span> For You
        </button>

        <button
          type="button"
          id="feed-tab-following"
          onClick={() => setFeedTab("following")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            backgroundColor:
              feedTab === "following"
                ? "var(--primary-light)"
                : "transparent",
            color:
              feedTab === "following"
                ? "var(--primary)"
                : "var(--text-secondary)",
            fontWeight: feedTab === "following" ? 700 : 600,
            fontSize: 14,
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span>👥</span> Following
        </button>
      </div>

      {/* Post Composer for authenticated users */}
      {isAuthenticated && (
        <PostComposer
          onPostCreated={createPost}
          defaultVisibility={feedTab === "following" ? "Followers" : "Public"}
        />
      )}

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
            padding: "48px 24px",
            color: "var(--text-secondary)",
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: 12,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {feedTab === "following" ? "👥" : "📝"}
          </div>
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {feedTab === "following"
              ? "No Posts from Accounts You Follow"
              : "No Posts Yet"}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              maxWidth: 400,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {feedTab === "following"
              ? "Follow other creators and users across Marbook to see their newest posts here!"
              : "Be the first to share something with the community using the composer above!"}
          </p>
          {feedTab === "following" && (
            <button
              type="button"
              onClick={() => setFeedTab("for-you")}
              style={{
                marginTop: 18,
                padding: "8px 18px",
                backgroundColor: "#1877f2",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#166fe5")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#1877f2")
              }
            >
              Switch to "For You" Feed
            </button>
          )}
        </div>
      )}

      {/* Posts list */}
      {!loading &&
        posts.map((post) => {
          const isLiked = Boolean(post.isLiked ?? likedPostIds.has(post.id));

          return (
            <PostCard
              key={post.id}
              post={post}
              isLiked={isLiked}
              currentUserId={user?.id}
              onToggleLike={handleToggleLike}
              onOpenComments={handleOpenComments}
              onPostUpdated={(updatedPost) => {
                updatePost(updatedPost.id, updatedPost);
              }}
              onPostDeleted={(deletedId) => {
                removePost(deletedId);
              }}
            />
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
            color: "var(--text-secondary)",
            borderTop: "1px solid var(--border-color)",
            marginTop: 16,
          }}
        >
          <div style={{ fontSize: 18, marginBottom: 4 }}>✓</div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: "var(--text-primary)",
            }}
          >
            You're up to date
          </div>
          <small style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            You have seen all recent posts.
          </small>
        </div>
      )}

      {/* Instagram-style Comments Modal */}
      <CommentsModal
        post={selectedPostForComments}
        isOpen={isCommentsOpen}
        onClose={handleCloseComments}
        onCommentAdded={(_newComment) => {
          if (selectedPostForComments) {
            const postId = selectedPostForComments.id;
            updatePost(postId, (p) => ({
              ...p,
              commentsCount: (p.commentsCount ?? 0) + 1,
            }));
            setSelectedPostForComments((prev) =>
              prev
                ? { ...prev, commentsCount: (prev.commentsCount ?? 0) + 1 }
                : prev
            );
          }
        }}
        onCommentDeleted={(deletedCount) => {
          if (selectedPostForComments) {
            const postId = selectedPostForComments.id;
            updatePost(postId, (p) => ({
              ...p,
              commentsCount: Math.max(0, (p.commentsCount ?? 0) - deletedCount),
            }));
            setSelectedPostForComments((prev) =>
              prev
                ? {
                    ...prev,
                    commentsCount: Math.max(
                      0,
                      (prev.commentsCount ?? 0) - deletedCount
                    ),
                  }
                : prev
            );
          }
        }}
      />
    </MainLayout>
  );
}

export default FeedPage;