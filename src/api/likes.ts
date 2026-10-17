import api from "./api";

export interface TogglePostLikeResponse {
  liked: boolean;
  likeCount: number;
}

export const likesApi = {
  likePost: async (postId: number): Promise<TogglePostLikeResponse | null> => {
    try {
      const response = await api.post<TogglePostLikeResponse>(`/posts/${postId}/Likes`);
      return response.data;
    } catch (err: any) {
      // 409 means already liked, which is acceptable
      if (err?.response?.status === 409) {
        return null;
      }
      throw err;
    }
  },

  unlikePost: async (postId: number): Promise<TogglePostLikeResponse | null> => {
    try {
      const response = await api.delete<TogglePostLikeResponse>(`/posts/${postId}/Likes`);
      return response.data;
    } catch (err: any) {
      // If endpoint returns 404 or 405, treat as handled so unliked state persists on UI
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        return null;
      }
      throw err;
    }
  },
};

