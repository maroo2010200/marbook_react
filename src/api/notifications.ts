import api from "./api";
import type {
  GetNotificationsParams,
  NotificationsPagedResult,
  UnreadCountResponse,
} from "../types/notifications";

export const notificationsApi = {
  getNotifications: async (
    params?: GetNotificationsParams
  ): Promise<NotificationsPagedResult> => {
    const response = await api.get<NotificationsPagedResult>("/notifications", {
      params: {
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 20,
        unreadOnly: params?.unreadOnly ?? false,
      },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<UnreadCountResponse>(
      "/notifications/unread-count"
    );
    return response.data.unreadCount;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put("/notifications/read-all");
  },

  deleteNotification: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
