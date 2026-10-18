import api from "./api";
import type { PagedResult, Post } from "../types/posts";

export const postsApi = {
  getAll: async (pageNumber: number, pageSize: number): Promise<PagedResult<Post>> => {
    const response = await api.get<PagedResult<Post>>("/posts", {
      params: {
        pageNumber,
        pageSize,
        pagedNumber: pageNumber,
        pagedSize: pageSize,
      },
    });
    return response.data;
  },

  createPost: async (content: string): Promise<Post> => {
    const response = await api.post<Post>("/posts", { content });
    return response.data;
  },

  updatePost: async (id: number, content: string): Promise<Post> => {
    const response = await api.put<Post>(`/posts/${id}`, { content });
    return response.data;
  },

  deletePost: async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },
};
