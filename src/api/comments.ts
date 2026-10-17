import api from "./api";
import type { Comment, CommentsPagedResult } from "../types/comments";

export const commentsApi = {
  getComments: async (
    postId: number,
    pageNumber = 1,
    pageSize = 20
  ): Promise<CommentsPagedResult> => {
    const response = await api.get<CommentsPagedResult>(
      `/posts/${postId}/Comments`,
      {
        params: {
          pageNumber,
          pageSize,
          PageNumber: pageNumber,
          PageSize: pageSize,
        },
      }
    );
    return response.data;
  },

  createComment: async (
    postId: number,
    content: string
  ): Promise<Comment> => {
    const response = await api.post<Comment>(
      `/posts/${postId}/Comments`,
      { content }
    );
    return response.data;
  },
};
