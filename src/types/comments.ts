import type { PagedResult } from "./posts";

export interface Comment {
  id: number;
  content: string;
  userId: number;
  userName: string;
  createdAt: string;
  updatedAt: string;
  parentCommentId?: number | null;
  likeCount?: number;
  replyCount?: number;
  liked?: boolean;
  replies?: Comment[];
}

export type CommentsPagedResult = PagedResult<Comment>;

export interface CommentCreateDto {
  content: string;
}

export interface CommentUpdateDto {
  content: string;
}

export interface ToggleCommentLikeResponse {
  liked: boolean;
  likeCount: number;
}
