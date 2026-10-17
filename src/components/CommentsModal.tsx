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

function renderCommentContent(content: string) {
  const mentionMatch = content.match(
    /^(@[\w\u0600-\u06FF]+(?:\s+[\w\u0600-\u06FF]+)?)([\s\S]*)$/
  );
  if (mentionMatch) {
    return (
      <>
        <span style={{ color: "#0095f6", fontWeight: 600, marginRight: 4 }}>
          {mentionMatch[1]}
        </span>
        {mentionMatch[2]}
      </>
    );
  }
  return content;
}

interface CommentItemProps {
  comment: Comment;
  depth: number;
  expandedCommentIds: Set<number>;
  loadingRepliesCommentIds: Set<number>;
  onToggleReplies: (commentId: number) => void;
  onToggleLike: (commentId: number) => void;
  onStartReply: (commentId: number, userName: string) => void;
}

function CommentItem({
  comment,
  depth,
  expandedCommentIds,
  loadingRepliesCommentIds,
  onToggleReplies,
  onToggleLike,
  onStartReply,
}: CommentItemProps) {
  const isExpanded = expandedCommentIds.has(comment.id);
  const isLoadingReplies = loadingRepliesCommentIds.has(comment.id);
  const isCommentLiked = Boolean(comment.liked);
  const commentLikeCount = comment.likeCount ?? 0;
  const replyCount = comment.replyCount ?? comment.replies?.length ?? 0;
  const hasReplies =
    replyCount > 0 || (comment.replies && comment.replies.length > 0);

  const cInitial = (comment.userName || "U").charAt(0).toUpperCase();
  const cDate = new Date(comment.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const avatarSize = depth === 0 ? 32 : 24;
  const avatarFontSize = depth === 0 ? 13 : 11;

  return (
    <div style={{ position: "relative" }}>
      {/* Main Comment Row */}
      <div
        style={{
          display: "flex",
          gap: depth === 0 ? 12 : 10,
          alignItems: "flex-start",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            backgroundColor: "#e4e6eb",
            color: "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: avatarFontSize,
            flexShrink: 0,
          }}
        >
          {cInitial}
        </div>

        {/* Content Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: depth === 0 ? 14 : 13,
              lineHeight: 1.4,
              color: "#262626",
            }}
          >
            <strong style={{ marginRight: 6 }}>{comment.userName}</strong>
            <span style={{ wordBreak: "break-word" }}>
              {renderCommentContent(comment.content)}
            </span>
          </div>

          {/* Action Row: Timestamp, Likes Count, Reply Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 4,
              fontSize: depth === 0 ? 12 : 11,
              color: "#8e8e8e",
            }}
          >
            <small>{cDate}</small>
            {commentLikeCount > 0 && (
              <span style={{ fontWeight: 600 }}>
                {commentLikeCount} {commentLikeCount === 1 ? "like" : "likes"}
              </span>
            )}
            <button
              type="button"
              onClick={() => onStartReply(comment.id, comment.userName)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#65676b",
                fontWeight: 600,
                fontSize: depth === 0 ? 12 : 11,
                cursor: "pointer",
              }}
            >
              Reply
            </button>
          </div>
        </div>

        {/* Heart / Like Button on the right */}
        <button
          type="button"
          onClick={() => onToggleLike(comment.id)}
          aria-label={isCommentLiked ? "Unlike comment" : "Like comment"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: isCommentLiked ? "#ed4956" : "#8e8e8e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <svg
            width={depth === 0 ? "15" : "13"}
            height={depth === 0 ? "15" : "13"}
            viewBox="0 0 24 24"
            fill={isCommentLiked ? "#ed4956" : "none"}
            stroke={isCommentLiked ? "#ed4956" : "#8e8e8e"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* L-Shaped Branch Connector & "View X replies" Button */}
      {hasReplies && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
            marginTop: 4,
            marginBottom: 4,
          }}
        >
          {/* Curved branch line (elbow connector) matching YouTube/Facebook */}
          <div
            style={{
              width: 22,
              height: 18,
              borderLeft: "2px solid #8e8e8e",
              borderBottom: "2px solid #8e8e8e",
              borderBottomLeftRadius: 10,
              marginRight: 8,
              marginLeft: depth === 0 ? 15 : 11, // centers under avatar
              marginTop: -8,
              flexShrink: 0,
            }}
          />
          <button
            type="button"
            onClick={() => onToggleReplies(comment.id)}
            style={{
              background: "none",
              border: "none",
              padding: "3px 6px",
              color: "#0095f6",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 4,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f2f5")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span>
              {isLoadingReplies
                ? "Loading replies..."
                : isExpanded
                ? "Hide replies"
                : `View ${replyCount} ${
                    replyCount === 1 ? "reply" : "replies"
                  }`}
            </span>
          </button>
        </div>
      )}

      {/* Nested Replies Tree (when expanded) */}
      {isExpanded && comment.replies && comment.replies.length > 0 && (
        <div
          style={{
            position: "relative",
            marginLeft: depth === 0 ? 15 : 11, // continuous line down from elbow connector
            borderLeft: "2px solid #e4e6eb", // vertical guide line along the branch
            paddingLeft: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 4,
          }}
        >
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              expandedCommentIds={expandedCommentIds}
              loadingRepliesCommentIds={loadingRepliesCommentIds}
              onToggleReplies={onToggleReplies}
              onToggleLike={onToggleLike}
              onStartReply={onStartReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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

  // Comment replies & likes state
  const [replyingTo, setReplyingTo] = useState<{
    commentId: number;
    userName: string;
  } | null>(null);
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<number>>(
    new Set()
  );
  const [loadingRepliesCommentIds, setLoadingRepliesCommentIds] = useState<
    Set<number>
  >(new Set());

  const commentsRef = useRef<Comment[]>([]);
  commentsRef.current = comments;

  const pageNumberRef = useRef(1);
  const isFetchingRef = useRef(false);
  const loadedPagesRef = useRef<Set<number>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Helper to recursively update a comment or reply in the comment tree
  const updateCommentInTree = (
    list: Comment[],
    targetId: number,
    updater: (c: Comment) => Comment
  ): Comment[] => {
    return list.map((c) => {
      if (c.id === targetId) {
        return updater(c);
      }
      if (c.replies && c.replies.length > 0) {
        return {
          ...c,
          replies: updateCommentInTree(c.replies, targetId, updater),
        };
      }
      return c;
    });
  };

  // Helper to find a comment or reply in tree
  const findCommentInTree = (
    list: Comment[],
    targetId: number
  ): Comment | null => {
    for (const c of list) {
      if (c.id === targetId) return c;
      if (c.replies && c.replies.length > 0) {
        const found = findCommentInTree(c.replies, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to recursively attach fetched replies to a comment anywhere in the tree
  const attachRepliesInTree = (
    list: Comment[],
    targetId: number,
    fetchedReplies: Comment[]
  ): Comment[] => {
    return list.map((c) => {
      if (c.id === targetId) {
        return {
          ...c,
          replies: fetchedReplies,
          replyCount: Math.max(c.replyCount ?? 0, fetchedReplies.length),
        };
      }
      if (c.replies && c.replies.length > 0) {
        return {
          ...c,
          replies: attachRepliesInTree(c.replies, targetId, fetchedReplies),
        };
      }
      return c;
    });
  };

  // Helper to recursively add a new reply to its parent comment and increment replyCount on parent and all ancestors
  const addReplyAndIncrementAncestors = (
    list: Comment[],
    targetParentId: number,
    ancestorIds: number[],
    newReply: Comment
  ): Comment[] => {
    const idsToIncrement = new Set([targetParentId, ...ancestorIds]);

    const traverse = (items: Comment[]): Comment[] => {
      return items.map((c) => {
        const isTarget = c.id === targetParentId;
        const shouldIncrement = idsToIncrement.has(c.id);
        const updatedReplies =
          c.replies && c.replies.length > 0 ? traverse(c.replies) : c.replies;

        if (isTarget) {
          const currentReplies = updatedReplies ?? [];
          return {
            ...c,
            replyCount: (c.replyCount ?? 0) + 1,
            replies: [...currentReplies, newReply],
          };
        }

        if (shouldIncrement) {
          return {
            ...c,
            replyCount: (c.replyCount ?? 0) + 1,
            replies: updatedReplies,
          };
        }

        return updatedReplies !== c.replies
          ? { ...c, replies: updatedReplies }
          : c;
      });
    };

    return traverse(list);
  };

  // Helper to find all ancestor IDs so they can be expanded
  const getAncestorIds = (
    list: Comment[],
    targetId: number,
    path: number[] = []
  ): number[] | null => {
    for (const c of list) {
      if (c.id === targetId) {
        return path;
      }
      if (c.replies && c.replies.length > 0) {
        const found = getAncestorIds(c.replies, targetId, [...path, c.id]);
        if (found) return found;
      }
    }
    return null;
  };

  const postId = post?.id;

  // Fetch initial page 1 of comments when modal opens
  useEffect(() => {
    if (!isOpen || !postId) return;

    let ignore = false;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setLoadMoreError(null);
    setSubmitError(null);
    setNewComment("");
    setReplyingTo(null);
    setExpandedCommentIds(new Set());
    setLoadingRepliesCommentIds(new Set());
    pageNumberRef.current = 1;
    loadedPagesRef.current = new Set([1]);
    isFetchingRef.current = true;

    const activePostId = postId;

    async function loadInitialComments() {
      try {
        const data = await commentsApi.getComments(activePostId, 1, PAGE_SIZE);
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
  }, [isOpen, postId]);

  // Toggle Comment Like (Instagram-style)
  const handleToggleCommentLike = async (commentId: number) => {
    if (!isAuthenticated) {
      setSubmitError("Please log in to like comments.");
      setTimeout(() => setSubmitError(null), 3500);
      return;
    }

    const target = findCommentInTree(commentsRef.current, commentId);
    if (!target) return;

    const currentLiked = Boolean(target.liked);
    const currentLikeCount = target.likeCount ?? 0;
    const nextLiked = !currentLiked;
    const optimisticCount = nextLiked
      ? currentLikeCount + 1
      : Math.max(0, currentLikeCount - 1);

    // Immediate optimistic update
    setComments((prev) =>
      updateCommentInTree(prev, commentId, (c) => ({
        ...c,
        liked: nextLiked,
        likeCount: optimisticCount,
      }))
    );

    try {
      const res = await commentsApi.toggleCommentLike(commentId);
      // Sync with API response
      setComments((prev) =>
        updateCommentInTree(prev, commentId, (c) => ({
          ...c,
          liked: res.liked,
          likeCount: res.likeCount,
        }))
      );
    } catch {
      // Revert on failure
      setComments((prev) =>
        updateCommentInTree(prev, commentId, (c) => ({
          ...c,
          liked: currentLiked,
          likeCount: currentLikeCount,
        }))
      );
    }
  };

  // Start replying to a comment or thread
  const handleStartReply = (commentId: number, userName: string) => {
    if (!isAuthenticated) {
      setSubmitError("Please log in to reply to comments.");
      setTimeout(() => setSubmitError(null), 3500);
      return;
    }
    setReplyingTo({ commentId, userName });
    setNewComment(`@${userName} `);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 50);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  // Toggle viewing replies for any comment in the tree
  const handleToggleReplies = async (commentId: number) => {
    const isExpanded = expandedCommentIds.has(commentId);
    if (isExpanded) {
      setExpandedCommentIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      return;
    }

    const target = findCommentInTree(commentsRef.current, commentId);
    if (target && (!target.replies || target.replies.length === 0)) {
      try {
        setLoadingRepliesCommentIds((prev) => new Set(prev).add(commentId));
        const fetchedReplies = await commentsApi.getReplies(commentId);
        setComments((prev) =>
          attachRepliesInTree(prev, commentId, fetchedReplies)
        );
        setExpandedCommentIds((prev) => new Set(prev).add(commentId));
      } catch {
        // Failed to load replies
      } finally {
        setLoadingRepliesCommentIds((prev) => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
      }
    } else {
      setExpandedCommentIds((prev) => new Set(prev).add(commentId));
    }
  };

  // Load next page of comments
  const loadMoreComments = useCallback(async () => {
    if (!postId || loading || loadingMore || !hasMore || isFetchingRef.current) {
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

      const data = await commentsApi.getComments(postId, nextPage, PAGE_SIZE);
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
  }, [postId, loading, loadingMore, hasMore]);

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

      if (replyingTo) {
        // Create reply to a parent comment
        const targetParentId = replyingTo.commentId;
        const createdReply = await commentsApi.createReply(
          targetParentId,
          content
        );

        // Find all ancestor IDs so they are all expanded
        const ancestors =
          getAncestorIds(commentsRef.current, targetParentId) ?? [];
        setExpandedCommentIds((prev) => {
          const next = new Set(prev);
          next.add(targetParentId);
          ancestors.forEach((id) => next.add(id));
          return next;
        });

        // Add reply to target parent's replies array and increment replyCount on parent and all ancestors
        const updated = addReplyAndIncrementAncestors(
          commentsRef.current,
          targetParentId,
          ancestors,
          createdReply
        );
        setComments(updated);
        commentsRef.current = updated;
        setNewComment("");
        setReplyingTo(null);
        onCommentAdded?.(createdReply);
      } else {
        // Create top-level comment
        const created = await commentsApi.createComment(post.id, content);
        // Prepend newly submitted comment to the top of the stream
        const updated = [created, ...commentsRef.current];
        setComments(updated);
        commentsRef.current = updated;
        setNewComment("");
        onCommentAdded?.(created);
      }
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
              <small style={{ color: "#8e8e8e", fontSize: 11 }}>
                {postDate}
              </small>
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
            <div
              style={{
                textAlign: "center",
                padding: "30px 0",
                color: "#8e8e8e",
              }}
            >
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

          {/* Comments Tree */}
          {!loading &&
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                expandedCommentIds={expandedCommentIds}
                loadingRepliesCommentIds={loadingRepliesCommentIds}
                onToggleReplies={handleToggleReplies}
                onToggleLike={handleToggleCommentLike}
                onStartReply={handleStartReply}
              />
            ))}

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

        {/* Modal Footer - Add Comment or Reply */}
        <div
          style={{
            borderTop: "1px solid #efefef",
            padding: "12px 18px",
            backgroundColor: "#fff",
          }}
        >
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} style={{ margin: 0 }}>
              {/* Replying indicator banner */}
              {replyingTo && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 12px",
                    backgroundColor: "#f0f2f5",
                    borderRadius: 8,
                    marginBottom: 8,
                    fontSize: 13,
                    color: "#65676b",
                  }}
                >
                  <span>
                    Replying to{" "}
                    <strong style={{ color: "#1c1e21" }}>
                      @{replyingTo.userName}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelReply}
                    aria-label="Cancel reply"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#65676b",
                      fontWeight: 700,
                      fontSize: 14,
                      padding: "0 4px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

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
                  ref={inputRef}
                  type="text"
                  placeholder={
                    replyingTo
                      ? `Reply to @${replyingTo.userName}...`
                      : "Add a comment..."
                  }
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
                    color:
                      !newComment.trim() || submitting ? "#b2dffc" : "#0095f6",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor:
                      !newComment.trim() || submitting ? "default" : "pointer",
                    padding: "6px 10px",
                  }}
                >
                  {submitting
                    ? replyingTo
                      ? "Replying..."
                      : "Posting..."
                    : replyingTo
                    ? "Reply"
                    : "Post"}
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
