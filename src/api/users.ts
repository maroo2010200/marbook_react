import api from "./api";
import type { UserProfile, UserProfileUpdateDto, UserSearchResult } from "../types/user";
import type { PagedResult } from "../types/posts";

export const usersApi = {
  getUserProfile: async (id: number): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/users/${id}/profile`);
    return response.data;
  },

  getUserProfileByUsername: async (username: string): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/users/username/${username}/profile`);
    return response.data;
  },

  updateMyProfile: async (data: UserProfileUpdateDto): Promise<UserProfile> => {
    const response = await api.put<UserProfile>("/users/me", data);
    return response.data;
  },

  searchUsers: async (
    search: string,
    pageNumber = 1,
    pageSize = 10
  ): Promise<PagedResult<UserSearchResult>> => {
    const response = await api.get<PagedResult<UserSearchResult>>("/users/search", {
      params: { search, pageNumber, pageSize },
    });
    return response.data;
  },
};
