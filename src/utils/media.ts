import type { CSSProperties } from "react";
import { BACKEND_BASE } from "../config/env";

/**
 * Normalizes a media URL or relative path:
 * - If path is empty/falsy, returns an empty string.
 * - If path is already an absolute URL (e.g. https://, blob:, data:), returns it as-is.
 * - If path is relative (e.g. /uploads/posts/abc.jpg), prepends the backend base URL.
 */
export function getMediaUrl(path?: string | null): string {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_BASE}${normalizedPath}`;
}

export interface MediaTransformOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "thumb" | "scale";
  gravity?: "face" | "auto" | "center";
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
}

/**
 * Injects on-the-fly Cloudinary transformations into Cloudinary asset URLs.
 * If the path is not a Cloudinary URL (e.g. local /uploads, blob:, or external),
 * returns the standard normalized URL unchanged.
 */
export function getOptimizedMediaUrl(
  path?: string | null,
  options?: MediaTransformOptions
): string {
  const url = getMediaUrl(path);
  if (!url || !options) return url;

  // Only apply transformations to Cloudinary image uploads
  const uploadToken = "/image/upload/";
  const tokenIndex = url.indexOf(uploadToken);
  if (tokenIndex === -1 || !url.includes("res.cloudinary.com")) {
    return url;
  }

  // Build transformation segments
  const parts: string[] = [];
  if (options.width) parts.push(`w_${Math.round(options.width)}`);
  if (options.height) parts.push(`h_${Math.round(options.height)}`);
  if (options.crop) parts.push(`c_${options.crop}`);
  if (options.gravity) parts.push(`g_${options.gravity}`);
  if (options.quality) parts.push(`q_${options.quality}`);
  else parts.push("q_auto");

  if (options.format) parts.push(`f_${options.format}`);
  else parts.push("f_auto");

  if (parts.length === 0) return url;

  const transformSegment = parts.join(",");
  const before = url.slice(0, tokenIndex + uploadToken.length);
  const after = url.slice(tokenIndex + uploadToken.length);

  return `${before}${transformSegment}/${after}`;
}

/**
 * Returns an optimized face-focused avatar thumbnail from Cloudinary CDN.
 * Uses 2x pixel density for crisp rendering on Retina / high-DPI displays.
 */
export function getAvatarThumbnailUrl(path?: string | null, displaySize = 40): string {
  return getOptimizedMediaUrl(path, {
    width: displaySize * 2,
    height: displaySize * 2,
    crop: "fill",
    gravity: "face",
  });
}

/**
 * Returns an optimized post image scaled to a maximum width with auto compression.
 */
export function getPostOptimizedUrl(path?: string | null, maxWidth = 1000): string {
  return getOptimizedMediaUrl(path, {
    width: maxWidth,
    crop: "limit",
  });
}

/**
 * Detects whether a media URL or filename corresponds to a video file.
 */
export function isVideoMedia(path?: string | null): boolean {
  if (!path) return false;
  // Cloudinary video delivery path: .../video/upload/...
  if (path.includes("/video/upload/")) return true;
  // Data URLs with video mime
  if (path.startsWith("data:video/")) return true;
  // Check common video file extensions
  const cleanPath = path.split("?")[0].split("#")[0].toLowerCase();
  return /\.(mp4|webm|mov|mkv|ogg|m4v|avi|flv|wmv)$/i.test(cleanPath);
}

export type UploadMediaKind = "photo" | "video" | "media";

const UPLOAD_STATUS_LABELS: Record<UploadMediaKind, string> = {
  photo: "Uploading photo...",
  video: "Uploading video...",
  media: "Uploading media...",
};

/**
 * Classifies a batch of selected/dropped files as photo, video, or mixed media.
 */
export function detectUploadKind(files: File[]): UploadMediaKind {
  if (files.length === 0) return "media";
  let hasPhoto = false;
  let hasVideo = false;
  for (const file of files) {
    if (file.type.startsWith("video/") || isVideoMedia(file.name)) {
      hasVideo = true;
    } else {
      hasPhoto = true;
    }
  }
  if (hasPhoto && hasVideo) return "media";
  return hasVideo ? "video" : "photo";
}

/**
 * Returns the human-readable upload banner label for a given upload kind.
 */
export function getUploadStatusLabel(kind: UploadMediaKind): string {
  return UPLOAD_STATUS_LABELS[kind];
}

/**
 * Extracts an external image URL or data URI from a browser drag-and-drop DataTransfer.
 */
export function extractDroppedImageUrl(dataTransfer: DataTransfer): string | null {
  const html = dataTransfer.getData("text/html");
  if (html) {
    // Prefer the <img src> attribute because clickable website thumbnails put the page link in text/uri-list.
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1]) {
      const candidate = imgMatch[1].replace(/&amp;/g, "&").trim();
      if (/^(https?:\/\/|data:image\/)/i.test(candidate)) {
        return candidate;
      }
    }
  }

  for (const type of ["text/uri-list", "text/plain"]) {
    const raw = dataTransfer.getData(type);
    if (!raw) continue;
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
    const match = lines.find((line) => /^(https?:\/\/|data:image\/)/i.test(line));
    if (match) return match;
  }

  return null;
}

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const UPLOAD_STATUS_BANNER_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "flex-start",
  width: "100%",
  boxSizing: "border-box",
  marginTop: 10,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--border-color)",
  backgroundColor: "var(--bg-hover)",
};

/**
 * Extracts image or video File objects pasted onto a React ClipboardEvent's DataTransfer.
 */
export function extractClipboardFiles(clipboardData: DataTransfer | null): File[] {
  if (!clipboardData) return [];
  const directFiles = clipboardData.files ? Array.from(clipboardData.files) : [];
  if (directFiles.length > 0) return directFiles;
  if (!clipboardData.items) return [];
  return Array.from(clipboardData.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

/**
 * Attempts to fetch a dropped external image URL (or data URI) and wrap it as a File.
 * Fails cleanly when cross-origin websites disallow fetch via CORS or return unsupported types.
 */
export async function fetchImageUrlAsFile(
  url: string
): Promise<{ file?: File; error?: string }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        error:
          "Couldn't load the dragged image directly from that website. Right-click it -> Copy image and paste here (Ctrl+V), or save it to your PC first.",
      };
    }

    const blob = await response.blob();
    const mime = blob.type.toLowerCase();
    if (!mime.startsWith("image/")) {
      return {
        error:
          "That dragged link isn't a direct image file. Right-click the photo -> Copy image and paste here (Ctrl+V), or save it to your PC first.",
      };
    }

    const ext = IMAGE_MIME_TO_EXT[mime];
    if (!ext) {
      return {
        error: `Unsupported image format from website (${mime}). Right-click the photo -> Copy image and paste here (Ctrl+V), or save as JPG, PNG, WebP, or GIF.`,
      };
    }

    const normalizedType = mime === "image/jpg" ? "image/jpeg" : mime;
    return {
      file: new File([blob], `dropped-image.${ext}`, { type: normalizedType }),
    };
  } catch {
    return {
      error:
        "Most websites block direct image dragging (CORS). Right-click the photo -> Copy image and paste here (Ctrl+V), or save it to your PC first.",
    };
  }
}
