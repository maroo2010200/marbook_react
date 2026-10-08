import api from "../api/api";

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
    pagedNumber: number;
    pagedSize: number;
}

export const postsApi = {
    getAll: async (pagedNumber: number, pagedSize: number) => {
        const response = await api.get("/posts", {
            params: { pagedNumber, pagedSize}
        });
        return response.data;
    }
};