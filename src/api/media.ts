import api from "./api";

export interface MediaUploadResponse {
  url: string;
}

export interface MultipleMediaUploadResponse {
  urls: string[];
}

export type MediaFolderType = "posts" | "avatars" | "covers" | "comments";

export const mediaApi = {
  upload: async (
    file: File,
    type: MediaFolderType = "posts"
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<MediaUploadResponse>(
      "/media/upload",
      formData,
      {
        params: { type },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.url;
  },

  uploadMultiple: async (
    files: File[],
    type: MediaFolderType = "posts"
  ): Promise<string[]> => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    const response = await api.post<MultipleMediaUploadResponse>(
      "/media/upload-multiple",
      formData,
      {
        params: { type },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.urls;
  },
};
