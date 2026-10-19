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
