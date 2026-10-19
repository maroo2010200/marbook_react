import api from "./api";
import type {
  Comment,
  CommentsPagedResult,
  ToggleCommentLikeResponse,
} from "../types/comments";

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
    content: string,
    imageUrl?: string | null
  ): Promise<Comment> => {
    const payload: { content: string; imageUrl?: string | null } = { content };
    if (imageUrl) payload.imageUrl = imageUrl;
    const response = await api.post<Comment>(
      `/posts/${postId}/Comments`,
      payload
    );
    return response.data;
  },

  toggleCommentLike: async (
    commentId: number
  ): Promise<ToggleCommentLikeResponse> => {
    const response = await api.post<ToggleCommentLikeResponse>(
      `/comments/${commentId}/Likes`
    );
    return response.data;
  },

  createReply: async (
    commentId: number,
    content: string,
    imageUrl?: string | null
  ): Promise<Comment> => {
    const payload: { content: string; imageUrl?: string | null } = { content };
    if (imageUrl) payload.imageUrl = imageUrl;
    const response = await api.post<Comment>(
      `/comments/${commentId}/Replies`,
      payload
    );
    return response.data;
  },

  getReplies: async (commentId: number): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(
      `/comments/${commentId}/Replies`
    );
    return response.data;
  },

  updateComment: async (
    commentId: number,
    content: string,
    imageUrl?: string | null
  ): Promise<Comment> => {
    const payload: { content: string; imageUrl?: string | null } = {
      content,
    };
    if (imageUrl !== undefined) payload.imageUrl = imageUrl;
    const response = await api.put<Comment>(`/comments/${commentId}`, payload);
    return response.data;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  },
};

