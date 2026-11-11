import { Link } from "react-router-dom";
import React from "react";

export interface MediaDetection {
  mediaUrl: string;
  isGif: boolean;
  isVideo?: boolean;
  isFile?: boolean;
  fileName?: string;
  fileExt?: string;
}

export interface ParsedRichText {
  nodes: React.ReactNode[];
  mediaUrls: string[];
  attachments: MediaDetection[];
  isPureMedia: boolean;
}

/**
 * Standard regex to find http/https URLs in text.
 * Stops before common trailing sentence punctuation like .,!?:;)"'
 */
export const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<]+[^<.,:;!?"')\]\s])/gi;

/**
 * Checks if a URL points to Giphy, Tenor, Imgur, or a direct image/gif file,
 * and converts Giphy/Imgur page links into direct CDN gif URLs.
 */
export function extractMediaUrlFromLink(rawUrl: string): MediaDetection | null {
  try {
    let cleanUrl = rawUrl.trim().replace(/[.,;!?]+$/, "");
    if (cleanUrl.toLowerCase().startsWith("www.")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    // 1. Giphy page URL: https://giphy.com/gifs/optional-slug-GIPHYID or https://giphy.com/gifs/GIPHYID
    const giphyPageMatch = cleanUrl.match(
      /^https?:\/\/(?:www\.)?giphy\.com\/gifs\/(?:[a-zA-Z0-9_-]+-)?([a-zA-Z0-9]+)\/?(?:\?[^\s]*)?$/i
    );
    if (giphyPageMatch && giphyPageMatch[1]) {
      const giphyId = giphyPageMatch[1];
      return {
        mediaUrl: `https://media.giphy.com/media/${giphyId}/giphy.gif`,
        isGif: true,
      };
    }

    // 2. Direct Giphy CDN media links: media*.giphy.com or i.giphy.com
    if (/^https?:\/\/(?:media\d*|i)\.giphy\.com\/.+/i.test(cleanUrl)) {
      return {
        mediaUrl: cleanUrl,
        isGif: true,
      };
    }

    // 3. Tenor media URLs: https://media.tenor.com/... or https://c.tenor.com/...
    if (/^https?:\/\/(?:media\d*|c)\.tenor\.com\/.+/i.test(cleanUrl)) {
      return {
        mediaUrl: cleanUrl,
        isGif: true,
      };
    }

    // 4. Imgur links: https://i.imgur.com/abc.gif or https://imgur.com/abc
    const imgurMatch = cleanUrl.match(
      /^https?:\/\/(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)(?:\.(gifv?|png|jpe?g|webp))?$/i
    );
    if (imgurMatch && imgurMatch[1]) {
      const id = imgurMatch[1];
      const ext = imgurMatch[2]?.toLowerCase() || "gif";
      const actualExt = ext === "gifv" ? "gif" : ext;
      return {
        mediaUrl: `https://i.imgur.com/${id}.${actualExt}`,
        isGif: actualExt === "gif",
      };
    }

    // 5. Direct URL matching file extensions before query params or hash
    const urlWithoutQuery = cleanUrl.split("?")[0].split("#")[0];
    if (/\.(gif)$/i.test(urlWithoutQuery)) {
      return {
        mediaUrl: cleanUrl,
        isGif: true,
      };
    }

    if (/\.(png|jpe?g|webp|svg|bmp)$/i.test(urlWithoutQuery)) {
      const isWebp = urlWithoutQuery.toLowerCase().endsWith(".webp");
      return {
        mediaUrl: cleanUrl,
        isGif: isWebp,
      };
    }

    // 6. Direct Video links
    if (/\.(mp4|webm|mov|mkv|ogg|m4v)$/i.test(urlWithoutQuery)) {
      const match = urlWithoutQuery.match(/\/([^/?#]+\.(?:mp4|webm|mov|mkv|ogg|m4v))$/i);
      return {
        mediaUrl: cleanUrl,
        isGif: false,
        isVideo: true,
        fileName: match ? decodeURIComponent(match[1]) : "video.mp4",
        fileExt: "VIDEO",
      };
    }

    // 7. Direct Document / Archive / Raw file links
    if (/\.(pdf|docx?|xlsx?|pptx?|txt|csv|zip|rar|7z)$/i.test(urlWithoutQuery)) {
      const match = urlWithoutQuery.match(/\/([^/?#]+\.(?:pdf|docx?|xlsx?|pptx?|txt|csv|zip|rar|7z))$/i);
      const extMatch = urlWithoutQuery.match(/\.([a-z0-9]+)$/i);
      const rawExt = extMatch ? extMatch[1].toUpperCase() : "FILE";
      let rawName = match ? decodeURIComponent(match[1]) : `document.${rawExt.toLowerCase()}`;
      // Strip Cloudinary guid prefix e.g. "a1b2c3d4_document.pdf" -> "document.pdf"
      rawName = rawName.replace(/^[0-9a-f]{32}_/i, "");
      return {
        mediaUrl: cleanUrl,
        isGif: false,
        isFile: true,
        fileName: rawName,
        fileExt: rawExt,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Formats a message snippet for the sidebar or dropdown list:
 * replaces pure GIF or image URLs with a user-friendly label.
 */
export function formatMessageSnippet(content: string): string {
  if (!content) return "";
  const trimmed = content.trim();

  // If message is just a single media/file link
  if (/^(?:https?:\/\/|www\.)[^\s]+$/i.test(trimmed)) {
    const media = extractMediaUrlFromLink(trimmed);
    if (media) {
      if (media.isVideo) return "Sent a video 🎥";
      if (media.isFile) return `Sent a file 📄 ${media.fileExt ? `[${media.fileExt}]` : ""}`.trim();
      return media.isGif ? "Sent a GIF 🎬" : "Sent a photo 🖼️";
    }
    return "Sent a link 🔗";
  }

  // If message contains a caption + trailing media/file link
  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    const lastLine = lines[lines.length - 1];
    if (/^(?:https?:\/\/|www\.)[^\s]+$/i.test(lastLine)) {
      const media = extractMediaUrlFromLink(lastLine);
      if (media) {
        const caption = lines.slice(0, -1).join(" ");
        if (media.isVideo) return `${caption} [Video 🎥]`;
        if (media.isFile) return `${caption} [File 📄]`;
        return `${caption} [Photo 🖼️]`;
      }
    }
  }

  return trimmed;
}

/**
 * Parses user text:
 * - Highlights leading @mention (e.g. "@JohnDoe") in blue
 * - Turns all http/https/www links into clickable <a> tags
 * - Detects Giphy/Tenor/image/video/file media links for embedded rendering
 */
export function parseRichText(
  content: string,
  options?: { hidePureMediaUrl?: boolean; linkColor?: string }
): ParsedRichText {
  if (!content) {
    return { nodes: [], mediaUrls: [], attachments: [], isPureMedia: false };
  }

  const linkColor = options?.linkColor || "#0095f6";
  const hidePureMediaUrl = options?.hidePureMediaUrl ?? true;

  // Helper to parse @mentions inside text and render them as clickable profile links
  const renderTextWithMentions = (textChunk: string, keyPrefix: string): React.ReactNode[] => {
    const mentionRegex = /@([a-zA-Z0-9_\u0600-\u06FF]+)/g;
    const result: React.ReactNode[] = [];
    let curIndex = 0;
    let mMatch: RegExpExecArray | null;

    while ((mMatch = mentionRegex.exec(textChunk)) !== null) {
      const handle = mMatch[1];
      const matchStart = mMatch.index;

      if (matchStart > curIndex) {
        result.push(textChunk.substring(curIndex, matchStart));
      }

      result.push(
        <Link
          key={`${keyPrefix}-mention-${matchStart}`}
          to={`/profile/${handle}`}
          style={{
            color: linkColor,
            fontWeight: 600,
            textDecoration: "none",
            cursor: "pointer",
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          @{handle}
        </Link>
      );

      curIndex = matchStart + mMatch[0].length;
    }

    if (curIndex < textChunk.length) {
      result.push(textChunk.substring(curIndex));
    }

    return result;
  };

  const detectedMediaList: string[] = [];
  const detectedAttachmentList: MediaDetection[] = [];
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(URL_REGEX);

  while ((match = regex.exec(content)) !== null) {
    const url = match[1];
    const startIndex = match.index;

    // Push text before the link (parsed for mentions)
    if (startIndex > lastIndex) {
      const chunk = content.substring(lastIndex, startIndex);
      parts.push(...renderTextWithMentions(chunk, `txt-${lastIndex}`));
    }

    // Check if this URL is a GIF, image, video, or file
    const media = extractMediaUrlFromLink(url);
    if (media) {
      if (!detectedMediaList.includes(media.mediaUrl)) {
        detectedMediaList.push(media.mediaUrl);
        detectedAttachmentList.push(media);
      }
    }

    const href = url.toLowerCase().startsWith("www.") ? `https://${url}` : url;

    // Only render raw clickable text link if it is NOT already handled by embedded media attachments
    if (!media) {
      parts.push(
        <a
          key={`link-${startIndex}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: linkColor,
            textDecoration: "underline",
            wordBreak: "break-all",
            fontWeight: 500,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#38bdf8")}
          onMouseLeave={(e) => (e.currentTarget.style.color = linkColor)}
        >
          {url}
        </a>
      );
    }

    lastIndex = startIndex + url.length;
  }

  // Push remaining text after last link (parsed for mentions)
  if (lastIndex < content.length) {
    const chunk = content.substring(lastIndex);
    parts.push(...renderTextWithMentions(chunk, `txt-${lastIndex}`));
  }

  const trimmed = content.trim();
  const isSingleUrl = Boolean(
    trimmed &&
    trimmed.match(/^(?:https?:\/\/|www\.)[^\s]+$/i) &&
    detectedMediaList.length > 0
  );

  const isPureMedia = isSingleUrl;

  return {
    nodes: isPureMedia && hidePureMediaUrl ? [] : parts,
    mediaUrls: detectedMediaList,
    attachments: detectedAttachmentList,
    isPureMedia,
  };
}
