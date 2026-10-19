import api from "./api";
import type { UserSummary } from "../types/user";
import type { PagedResult } from "../types/posts";

export const followsApi = {
  follow: async (userId: number): Promise<void> => {
    await api.post(`/users/${userId}/follow`);
  },

  unfollow: async (userId: number): Promise<void> => {
    await api.delete(`/users/${userId}/unfollow`);
  },

  getFollowers: async (
    userId: number,
    pageNumber = 1,
    pageSize = 20
  ): Promise<PagedResult<UserSummary>> => {
    const response = await api.get<PagedResult<UserSummary>>(
      `/users/${userId}/followers`,
      { params: { pageNumber, pageSize } }
    );
    return response.data;
  },

  getFollowing: async (
    userId: number,
    pageNumber = 1,
    pageSize = 20
  ): Promise<PagedResult<UserSummary>> => {
    const response = await api.get<PagedResult<UserSummary>>(
      `/users/${userId}/following`,
      { params: { pageNumber, pageSize } }
    );
    return response.data;
  },
};
