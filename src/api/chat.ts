import api from "./api";
import type {
  ConversationSummary,
  ChatUnreadCount,
  MessagesPagedResult,
  Message,
} from "../types/chat";

export const chatApi = {
  getConversations: async (): Promise<ConversationSummary[]> => {
    const response = await api.get<ConversationSummary[]>("/conversations");
    return response.data;
  },

  getUnreadCount: async (): Promise<ChatUnreadCount> => {
    const response = await api.get<ChatUnreadCount>(
      "/conversations/unread-count"
    );
    return response.data;
  },

  startConversation: async (
    targetUserId: number,
    initialMessage?: string
  ): Promise<ConversationSummary> => {
    const response = await api.post<ConversationSummary>(
      "/conversations/start",
      {
        targetUserId,
        initialMessage,
      }
    );
    return response.data;
  },

  getConversation: async (id: number): Promise<ConversationSummary> => {
    const response = await api.get<ConversationSummary>(`/conversations/${id}`);
    return response.data;
  },

  getMessages: async (
    conversationId: number,
    pageNumber = 1,
    pageSize = 30
  ): Promise<MessagesPagedResult> => {
    const response = await api.get<MessagesPagedResult>(
      `/conversations/${conversationId}/messages`,
      {
        params: { pageNumber, pageSize },
      }
    );
    return response.data;
  },

  sendMessage: async (
    conversationId: number,
    content: string
  ): Promise<Message> => {
    const response = await api.post<Message>(
      `/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data;
  },

  editMessage: async (
    conversationId: number,
    messageId: number,
    content: string
  ): Promise<Message> => {
    const response = await api.put<Message>(
      `/conversations/${conversationId}/messages/${messageId}`,
      { content }
    );
    return response.data;
  },

  deleteMessage: async (
    conversationId: number,
    messageId: number
  ): Promise<void> => {
    await api.delete(`/conversations/${conversationId}/messages/${messageId}`);
  },

  markAsRead: async (conversationId: number): Promise<void> => {
    await api.put(`/conversations/${conversationId}/read`);
  },
};
