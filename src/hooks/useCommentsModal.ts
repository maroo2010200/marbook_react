import { useState, useEffect, useRef, useCallback } from "react";
import { commentsApi } from "../api/comments";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types/posts";
import type { Comment } from "../types/comments";
import {
  findCommentInTree,
  updateCommentInTree,
  attachRepliesInTree,
  getAncestorIds,
  addReplyAndIncrementAncestors,
  deleteCommentAndDecrementAncestors,
} from "../utils/commentTree";

const PAGE_SIZE = 10;

interface UseCommentsModalOptions {
  isOpen: boolean;
  post: Post | null;
  onCommentAdded?: (comment: Comment) => void;
  onCommentDeleted?: (deletedCount: number) => void;
}

export function useCommentsModal({
  isOpen,
  post,
  onCommentAdded,
  onCommentDeleted,
}: UseCommentsModalOptions) {
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

  // Attached image/GIF state
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  const postId = post?.id;

  // Load initial page of comments when modal opens or active post ID changes
  const loadInitialComments = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setLoadMoreError(null);
    setSubmitError(null);
    setNewComment("");
    setAttachedImageUrl(null);
    setIsUploadingImage(false);
    setReplyingTo(null);
    setExpandedCommentIds(new Set());
    setLoadingRepliesCommentIds(new Set());
    pageNumberRef.current = 1;
    loadedPagesRef.current = new Set([1]);
    isFetchingRef.current = true;

    try {
      const data = await commentsApi.getComments(postId, 1, PAGE_SIZE);
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
      setError("Failed to load comments. Please try again.");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [postId]);

  useEffect(() => {
    if (!isOpen || !postId) return;
    loadInitialComments();
  }, [isOpen, postId, loadInitialComments]);

  // Load older comments for pagination
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

  // Scroll listener for infinite scroll
  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      if (!loading && !loadingMore && hasMore && !loadMoreError) {
        loadMoreComments();
      }
    }
  };

  // IntersectionObserver for bottom sentinel
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
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, loadMoreError, loadMoreComments]);

  // Toggle Comment Like (Optimistic UI)
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

    setComments((prev) =>
      updateCommentInTree(prev, commentId, (c) => ({
        ...c,
        liked: nextLiked,
        likeCount: optimisticCount,
      }))
    );

    try {
      const res = await commentsApi.toggleCommentLike(commentId);
      const isLiked = res.liked ?? res.isLiked ?? nextLiked;
      setComments((prev) =>
        updateCommentInTree(prev, commentId, (c) => ({
          ...c,
          liked: isLiked,
          likeCount:
            typeof res.likeCount === "number"
              ? res.likeCount
              : optimisticCount,
        }))
      );
    } catch {
      setComments((prev) =>
        updateCommentInTree(prev, commentId, (c) => ({
          ...c,
          liked: currentLiked,
          likeCount: currentLikeCount,
        }))
      );
    }
  };

  // Toggle viewing replies for a comment
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
        // failed to fetch replies
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

  // Set active reply target
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

  // Submit comment or reply
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (
      (!content && !attachedImageUrl) ||
      submitting ||
      !post ||
      isUploadingImage
    )
      return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      if (replyingTo) {
        const targetParentId = replyingTo.commentId;
        const createdReply = await commentsApi.createReply(
          targetParentId,
          content,
          attachedImageUrl || undefined
        );

        const ancestors =
          getAncestorIds(commentsRef.current, targetParentId) ?? [];
        setExpandedCommentIds((prev) => {
          const next = new Set(prev);
          next.add(targetParentId);
          ancestors.forEach((id) => next.add(id));
          return next;
        });

        const updated = addReplyAndIncrementAncestors(
          commentsRef.current,
          targetParentId,
          ancestors,
          createdReply
        );
        setComments(updated);
        commentsRef.current = updated;
        setNewComment("");
        setAttachedImageUrl(null);
        setReplyingTo(null);
        onCommentAdded?.(createdReply);
      } else {
        const created = await commentsApi.createComment(
          post.id,
          content,
          attachedImageUrl || undefined
        );
        const updated = [created, ...commentsRef.current];
        setComments(updated);
        commentsRef.current = updated;
        setNewComment("");
        setAttachedImageUrl(null);
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

  const handleEditComment = useCallback(
    async (
      commentId: number,
      content: string,
      imageUrl?: string | null
    ): Promise<Comment> => {
      const updated = await commentsApi.updateComment(
        commentId,
        content,
        imageUrl
      );
      setComments((prev) =>
        updateCommentInTree(prev, commentId, (c) => ({
          ...c,
          content: updated.content,
          imageUrl: updated.imageUrl,
          updatedAt: updated.updatedAt,
        }))
      );
      return updated;
    },
    []
  );

  const handleDeleteComment = useCallback(
    async (commentId: number): Promise<void> => {
      const ancestorIds = getAncestorIds(commentsRef.current, commentId) ?? [];
      await commentsApi.deleteComment(commentId);
      const { updatedList, totalDeleted } = deleteCommentAndDecrementAncestors(
        commentsRef.current,
        commentId,
        ancestorIds
      );
      setComments(updatedList);
      commentsRef.current = updatedList;
      onCommentDeleted?.(totalDeleted);
    },
    [onCommentDeleted]
  );

  return {
    comments,
    loading,
    loadingMore,
    error,
    loadMoreError,
    hasMore,
    newComment,
    submitting,
    submitError,
    replyingTo,
    expandedCommentIds,
    loadingRepliesCommentIds,
    scrollContainerRef,
    sentinelRef,
    inputRef,
    setNewComment,
    attachedImageUrl,
    setAttachedImageUrl,
    isUploadingImage,
    setIsUploadingImage,
    loadInitialComments,
    loadMoreComments,
    handleContainerScroll,
    handleToggleCommentLike,
    handleToggleReplies,
    handleStartReply,
    handleCancelReply,
    handleSubmit,
    handleEditComment,
    handleDeleteComment,
  };
}
