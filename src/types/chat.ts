import type { UserSummary } from "./user";

export interface Message {
  id: number;
  conversationId: number;
  senderUserId: number;
  senderName: string;
  senderAvatarUrl?: string | null;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  isDeleted: boolean;
  isMine: boolean;
}

export interface ConversationSummary {
  id: number;
  updatedAt: string;
  otherParticipant: UserSummary;
  lastMessage?: Message | null;
  unreadCount: number;
}

export interface ChatUnreadCount {
  totalUnreadMessages: number;
  unreadConversationsCount: number;
}

export interface MessagesPagedResult {
  items: Message[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface TypingEvent {
  conversationId: number;
  userId: number;
  userName: string;
  isTyping: boolean;
}

export interface ReadReceiptEvent {
  conversationId: number;
  readerUserId: number;
  readAt: string;
}
