export { postsApi } from "../api/posts";
export interface Post {
    id: number;
    content: string;
    userId: number;
    userName: string;
    createdAt: string;
    updatedAt: string;
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