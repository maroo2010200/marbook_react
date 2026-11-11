import type { PagedResult } from "./posts";

export interface Comment {
  id: number;
  content: string;
  imageUrl?: string | null;
  userId: number;
  userName: string;
  userUsername?: string | null;
  userAvatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  parentCommentId?: number | null;
  likeCount?: number;
  replyCount?: number;
  liked?: boolean;
  isPinned?: boolean;
  replies?: Comment[];
}

export type CommentsPagedResult = PagedResult<Comment>;

export interface CommentCreateDto {
  content: string;
  imageUrl?: string | null;
}

export interface CommentUpdateDto {
  content: string;
  imageUrl?: string | null;
}

export interface ToggleCommentLikeResponse {
  liked?: boolean;
  isLiked?: boolean;
  likeCount: number;
}
