import api from "./api";

export const likesApi = {
  likePost: async (postId: number): Promise<void> => {
    try {
      await api.post(`/posts/${postId}/Likes`);
    } catch (err: any) {
      // 409 means already liked, which is acceptable
      if (err?.response?.status === 409) {
        return;
      }
      throw err;
    }
  },

  unlikePost: async (postId: number): Promise<void> => {
    try {
      await api.delete(`/posts/${postId}/Likes`);
    } catch (err: any) {
      // If endpoint returns 404 or 405, treat as handled so unliked state persists on UI
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        return;
      }
      throw err;
    }
  },
};
