import { useState, useEffect, useCallback, useRef } from "react";
import type { Post } from "../types/posts";
import { postsApi } from "../api/posts";

export function usePosts(initialPage = 1, pageSize = 10) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const postsRef = useRef<Post[]>([]);
  postsRef.current = posts;

  const pageNumberRef = useRef(initialPage);
  pageNumberRef.current = pageNumber;

  const isFetchingRef = useRef(false);
  const loadedPagesRef = useRef<Set<number>>(new Set());

  const fetchPosts = useCallback(async () => {
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      setLoadMoreError(null);

      const data = await postsApi.getAll(initialPage, pageSize);
      const items = data?.items ?? [];
      const totalCount = data?.totalCount;

      setPosts(items);
      postsRef.current = items;
      setPageNumber(initialPage);
      pageNumberRef.current = initialPage;
      loadedPagesRef.current = new Set([initialPage]);

      const more =
        items.length > 0 &&
        (typeof totalCount === "number" && totalCount >= 0
          ? items.length < totalCount
          : items.length === pageSize);

      setHasMore(more);
    } catch {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [initialPage, pageSize]);

  useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      try {
        isFetchingRef.current = true;
        setLoading(true);
        setError(null);
        setLoadMoreError(null);

        const data = await postsApi.getAll(initialPage, pageSize);
        if (ignore) return;

        const items = data?.items ?? [];
        const totalCount = data?.totalCount;

        setPosts(items);
        postsRef.current = items;
        setPageNumber(initialPage);
        pageNumberRef.current = initialPage;
        loadedPagesRef.current = new Set([initialPage]);

        const more =
          items.length > 0 &&
          (typeof totalCount === "number" && totalCount >= 0
            ? items.length < totalCount
            : items.length === pageSize);

        setHasMore(more);
      } catch {
        if (ignore) return;
        setError("Failed to load posts");
      } finally {
        if (!ignore) {
          setLoading(false);
          isFetchingRef.current = false;
        }
      }
    }

    initialFetch();

    return () => {
      ignore = true;
      isFetchingRef.current = false;
    };
  }, [initialPage, pageSize]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || isFetchingRef.current) {
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

      const data = await postsApi.getAll(nextPage, pageSize);
      const newItems = data?.items ?? [];
      const totalCount = data?.totalCount;

      const currentPosts = postsRef.current;
      const existingIds = new Set(currentPosts.map((p) => p.id));
      const uniqueNewItems = newItems.filter((p) => !existingIds.has(p.id));
      const updatedPosts = [...currentPosts, ...uniqueNewItems];

      setPosts(updatedPosts);
      postsRef.current = updatedPosts;
      setPageNumber(nextPage);
      pageNumberRef.current = nextPage;
      loadedPagesRef.current.add(nextPage);

      const totalLoaded = updatedPosts.length;
      const more =
        uniqueNewItems.length > 0 &&
        (typeof totalCount === "number" && totalCount >= 0
          ? totalLoaded < totalCount
          : newItems.length === pageSize);

      setHasMore(more);
    } catch {
      setLoadMoreError("Failed to load more posts");
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [loading, loadingMore, hasMore, pageSize]);

  return {
    posts,
    pageNumber,
    loading,
    loadingMore,
    error,
    loadMoreError,
    hasMore,
    loadMore,
    fetchPosts,
  };
}