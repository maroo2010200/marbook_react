export type NotificationType =
  | "PostLiked"
  | "CommentLiked"
  | "CommentCreated"
  | "ReplyCreated"
  | "UserFollowed";

export interface NotificationItem {
  id: number;
  recipientUserId: number;
  actorUserId: number;
  actorName: string;
  actorAvatarUrl?: string | null;
  type: NotificationType;
  targetPostId?: number | null;
  targetCommentId?: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsPagedResult {
  items: NotificationItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface GetNotificationsParams {
  pageNumber?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}
