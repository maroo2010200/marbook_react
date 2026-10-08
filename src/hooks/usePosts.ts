import { useState, useEffect, useCallback } from "react";
import type { Post } from "../types/posts";
import { postsApi } from "../types/posts";

export function usePosts(pageNumber = 1, pageSize = 10) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await postsApi.getAll(pageNumber, pageSize);
      setPosts(data.items);
      setError(null);
    } catch {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, error, fetchPosts };
}