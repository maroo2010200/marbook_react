import api from "./api";
import type { GetPostsParams, PagedResult, Post, PostVisibility } from "../types/posts";

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
    visibility: PostVisibility = "Public"
  ): Promise<Post> => {
    const response = await api.post<Post>("/posts", { content, visibility });
    return response.data;
  },

  updatePost: async (
    id: number,
    content: string,
    visibility?: PostVisibility
  ): Promise<Post> => {
    const payload: { content: string; visibility?: PostVisibility } = { content };
    if (visibility) payload.visibility = visibility;
    const response = await api.put<Post>(`/posts/${id}`, payload);
    return response.data;
  },

  deletePost: async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },
};
