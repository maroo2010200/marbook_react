export { postsApi } from "../api/posts";

export type PostVisibility = "Public" | "Followers" | "Private";

export interface Post {
  id: number;
  content: string;
  visibility?: PostVisibility;
  userId: number;
  userName: string;
  createdAt: string;
  updatedAt: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
}

export interface PostCreateDto {
  content: string;
  visibility?: PostVisibility;
}

export interface PostUpdateDto {
  content: string;
  visibility?: PostVisibility;
}

export interface GetPostsParams {
  pageNumber: number;
  pageSize: number;
  search?: string;
  userId?: number;
  followingOnly?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
  pagedNumber?: number;
  pagedSize?: number;
}