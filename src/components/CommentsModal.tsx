import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { commentsApi } from "../api/comments";
import type { Post } from "../types/posts";
import type { Comment } from "../types/comments";

interface CommentsModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: (comment: Comment) => void;
}

const PAGE_SIZE = 10;

export function CommentsModal({
  post,
  isOpen,
  onClose,
  onCommentAdded,
}: CommentsModalProps) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const commentsRef = useRef<Comment[]>([]);
  commentsRef.current = comments;

  const pageNumberRef = useRef(1);
  const isFetchingRef = useRef(false);
  const loadedPagesRef = useRef<Set<number>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial page 1 of comments when modal opens
  useEffect(() => {
    if (!isOpen || !post) return;

    let ignore = false;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setLoadMoreError(null);
    setSubmitError(null);
    setNewComment("");
    pageNumberRef.current = 1;
    loadedPagesRef.current = new Set([1]);
    isFetchingRef.current = true;

    async function loadInitialComments() {
      try {
        const data = await commentsApi.getComments(post!.id, 1, PAGE_SIZE);
        if (ignore) return;

        const items = data?.items ?? [];
        const totalCount = data?.totalCount;

        setComments(items);
        commentsRef.current = items;
        pageNumberRef.current = 1;

        const more =
          items.length > 0 &&
          (typeof totalCount === "number" && totalCount >= 0
            ? items.length < totalCount
            : items.length === PAGE_SIZE);

        setHasMore(more);
      } catch {
        if (!ignore) {
          setError("Failed to load comments. Please try again.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          isFetchingRef.current = false;
        }
      }
    }

    loadInitialComments();

    return () => {
      ignore = true;
      isFetchingRef.current = false;
    };
  }, [isOpen, post]);

  // Load next page of comments
  const loadMoreComments = useCallback(async () => {
    if (!post || loading || loadingMore || !hasMore || isFetchingRef.current) {
      return;
    }

    const nextPage = pageNumberRef.current + 1;
    if (loadedPagesRef.current.has(nextPage)) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoadingMore(true);
      setLoadMoreError(null);

      const data = await commentsApi.getComments(post.id, nextPage, PAGE_SIZE);
      const newItems = data?.items ?? [];
      const totalCount = data?.totalCount;

      const current = commentsRef.current;
      const existingIds = new Set(current.map((c) => c.id));
      const uniqueNewItems = newItems.filter((c) => !existingIds.has(c.id));
      const updated = [...current, ...uniqueNewItems];

      setComments(updated);
      commentsRef.current = updated;
      pageNumberRef.current = nextPage;
      loadedPagesRef.current.add(nextPage);

      const totalLoaded = updated.length;
      const more =
        uniqueNewItems.length > 0 &&
        (typeof totalCount === "number" && totalCount >= 0
          ? totalLoaded < totalCount
          : newItems.length === PAGE_SIZE);

      setHasMore(more);
    } catch {
      setLoadMoreError("Failed to load older comments.");
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [post, loading, loadingMore, hasMore]);

  // Handle scroll events in comments container
  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      if (!loading && !loadingMore && hasMore && !loadMoreError) {
        loadMoreComments();
      }
    }
  };

  // IntersectionObserver on the sentinel element inside modal container
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const container = scrollContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry?.isIntersecting &&
          !loading &&
          !loadingMore &&
          hasMore &&
          !loadMoreError
        ) {
          loadMoreComments();
        }
      },
      {
        root: container,
        rootMargin: "0px 0px 150px 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loading, loadingMore, hasMore, loadMoreError, loadMoreComments]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || submitting) return;

    try {
      setSubmitting(true);
      setSubmitError(null);
      const created = await commentsApi.createComment(post.id, content);
      // Prepend newly submitted comment to the top of the stream
      const updated = [created, ...commentsRef.current];
      setComments(updated);
      commentsRef.current = updated;
      setNewComment("");
      onCommentAdded?.(created);
      // Smooth scroll to top of comments container
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || "Failed to post comment. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const authorInitial = (post.userName || "U").charAt(0).toUpperCase();
  const postDate = new Date(post.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          maxWidth: 620,
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid #efefef",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "#1877f2",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {authorInitial}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#262626" }}>
                {post.userName}
              </div>
              <small style={{ color: "#8e8e8e", fontSize: 11 }}>{postDate}</small>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#8e8e8e",
              padding: "4px 8px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Post details & Infinite Scrolling Comments */}
        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Post Details (Instagram-style caption) */}
          <div
            style={{
              paddingBottom: 16,
              borderBottom: "1px solid #efefef",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 15,
                lineHeight: 1.5,
                color: "#262626",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              <strong style={{ marginRight: 6 }}>{post.userName}</strong>
              {post.content}
            </p>
          </div>

          {/* Initial loading state */}
          {loading && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#8e8e8e" }}>
              <div
                style={{
                  display: "inline-block",
                  width: 20,
                  height: 20,
                  border: "2px solid #efefef",
                  borderTopColor: "#1877f2",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  marginBottom: 8,
                }}
              />
              <p style={{ margin: 0, fontSize: 13 }}>Loading comments...</p>
            </div>
          )}

          {/* Initial load error */}
          {error && (
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
                color: "#e02424",
                fontSize: 13,
              }}
            >
              <p style={{ margin: "0 0 8px" }}>{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  commentsApi
                    .getComments(post.id, 1, PAGE_SIZE)
                    .then((data) => {
                      const items = data?.items ?? [];
                      setComments(items);
                      commentsRef.current = items;
                      setHasMore(items.length < (data?.totalCount ?? 0));
                    })
                    .catch(() => setError("Failed to load comments."))
                    .finally(() => setLoading(false));
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  border: "1px solid #e02424",
                  background: "#fff",
                  color: "#e02424",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty comments */}
          {!loading && !error && comments.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "36px 0",
                color: "#8e8e8e",
              }}
            >
              <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>
                No comments yet.
              </p>
              <small style={{ fontSize: 12 }}>Start the conversation.</small>
            </div>
          )}

          {/* Comments List */}
          {!loading &&
            comments.map((comment) => {
              const cInitial = (comment.userName || "U").charAt(0).toUpperCase();
              const cDate = new Date(comment.createdAt).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              return (
                <div
                  key={comment.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: "#e4e6eb",
                      color: "#333",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {cInitial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.4, color: "#262626" }}>
                      <strong style={{ marginRight: 6 }}>{comment.userName}</strong>
                      <span style={{ wordBreak: "break-word" }}>{comment.content}</span>
                    </div>
                    <small style={{ color: "#8e8e8e", fontSize: 11 }}>{cDate}</small>
                  </div>
                </div>
              );
            })}

          {/* Bottom sentinel element for intersection observer */}
          {hasMore && !loading && (
            <div ref={sentinelRef} style={{ height: 1 }} />
          )}

          {/* Loading more indicator */}
          {loadingMore && (
            <div
              style={{
                textAlign: "center",
                padding: "12px 0",
                color: "#8e8e8e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid #efefef",
                  borderTopColor: "#1877f2",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ fontSize: 12 }}>Loading more comments...</span>
            </div>
          )}

          {/* Load more error with retry */}
          {loadMoreError && (
            <div
              style={{
                textAlign: "center",
                padding: "10px 0",
                color: "#e02424",
                fontSize: 12,
              }}
            >
              <p style={{ margin: "0 0 6px" }}>{loadMoreError}</p>
              <button
                type="button"
                onClick={loadMoreComments}
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  border: "1px solid #e02424",
                  background: "#fff",
                  color: "#e02424",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Reached end of comments */}
          {!loading && !hasMore && comments.length > 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "14px 0 6px",
                color: "#8e8e8e",
                fontSize: 12,
              }}
            >
              All comments loaded
            </div>
          )}
        </div>

        {/* Modal Footer - Add Comment or Auth Prompt */}
        <div
          style={{
            borderTop: "1px solid #efefef",
            padding: "12px 18px",
            backgroundColor: "#fff",
          }}
        >
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} style={{ margin: 0 }}>
              {submitError && (
                <div
                  style={{
                    color: "#e02424",
                    fontSize: 12,
                    marginBottom: 6,
                  }}
                >
                  {submitError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    border: "1px solid #dbdbdb",
                    borderRadius: 20,
                    padding: "8px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  style={{
                    background: "none",
                    border: "none",
                    color: !newComment.trim() || submitting ? "#b2dffc" : "#0095f6",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: !newComment.trim() || submitting ? "default" : "pointer",
                    padding: "6px 10px",
                  }}
                >
                  {submitting ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "8px 0",
                fontSize: 13,
                color: "#8e8e8e",
              }}
            >
              Please{" "}
              <Link
                to="/login"
                style={{
                  color: "#0095f6",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Log In
              </Link>{" "}
              or{" "}
              <Link
                to="/register"
                style={{
                  color: "#0095f6",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Register
              </Link>{" "}
              to leave a comment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
