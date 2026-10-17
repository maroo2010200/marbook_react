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
};
