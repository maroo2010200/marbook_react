export { postsApi } from "../api/posts";

export type PostVisibility = "Public" | "Followers" | "Private";

export interface Post {
  id: number;
  content: string;
  visibility?: PostVisibility;
  userId: number;
  userName: string;
  userAvatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  imageUrls?: string[];
}

export interface PostSearchResult extends Post {
  relevanceScore?: number;
}

export interface PostCreateDto {
  content: string;
  visibility?: PostVisibility;
  imageUrls?: string[];
}

export interface PostUpdateDto {
  content: string;
  visibility?: PostVisibility;
  imageUrls?: string[];
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