import type { PagedResult } from "./posts";

export interface Comment {
  id: number;
  content: string;
  userId: number;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

export type CommentsPagedResult = PagedResult<Comment>;

export interface CommentCreateDto {
  content: string;
}
