import api from "./api";
import type { GetPostsParams, PagedResult, Post, PostSearchResult, PostVisibility, RepostResponse } from "../types/posts";

export const postsApi = {
  getAll: async (
    pageNumberOrParams: number | GetPostsParams,
    pageSizeParam?: number
  ): Promise<PagedResult<Post>> => {
    const params: Record<string, unknown> =
      typeof pageNumberOrParams === "number"
        ? {
            pageNumber: pageNumberOrParams,
            pageSize: pageSizeParam ?? 10,
            pagedNumber: pageNumberOrParams,
            pagedSize: pageSizeParam ?? 10,
          }
        : {
            pageNumber: pageNumberOrParams.pageNumber,
            pageSize: pageNumberOrParams.pageSize,
            pagedNumber: pageNumberOrParams.pageNumber,
            pagedSize: pageNumberOrParams.pageSize,
            search: pageNumberOrParams.search,
            userId: pageNumberOrParams.userId,
            followingOnly: pageNumberOrParams.followingOnly,
          };

    const response = await api.get<PagedResult<Post>>("/posts", { params });
    return response.data;
  },

  createPost: async (
    content: string,
    visibility: PostVisibility = "Public",
    imageUrls?: string[],
    originalPostId?: number
  ): Promise<Post> => {
    const payload: {
      content: string;
      visibility: PostVisibility;
      imageUrls?: string[];
      originalPostId?: number;
    } = { content, visibility };
    if (imageUrls && imageUrls.length > 0) {
      payload.imageUrls = imageUrls;
    }
    if (originalPostId !== undefined) {
      payload.originalPostId = originalPostId;
    }
    const response = await api.post<Post>("/posts", payload);
    return response.data;
  },

  toggleRepost: async (id: number): Promise<RepostResponse> => {
    const response = await api.post<RepostResponse>(`/posts/${id}/repost`);
    return response.data;
  },

  updatePost: async (
    id: number,
    content: string,
    visibility?: PostVisibility,
    imageUrls?: string[]
  ): Promise<Post> => {
    const payload: {
      content: string;
      visibility?: PostVisibility;
      imageUrls?: string[];
    } = { content };
    if (visibility) payload.visibility = visibility;
    if (imageUrls !== undefined) payload.imageUrls = imageUrls;
    const response = await api.put<Post>(`/posts/${id}`, payload);
    return response.data;
  },

  deletePost: async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  searchPosts: async (
    search: string,
    pageNumber = 1,
    pageSize = 10
  ): Promise<PagedResult<PostSearchResult>> => {
    const response = await api.get<PagedResult<PostSearchResult>>("/posts/search", {
      params: { search, pageNumber, pageSize },
    });
    return response.data;
  },
};
