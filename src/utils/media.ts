const BACKEND_BASE = "http://localhost:5244";

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
