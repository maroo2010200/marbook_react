import React from "react";

export interface MediaDetection {
  mediaUrl: string;
  isGif: boolean;
}

export interface ParsedRichText {
  nodes: React.ReactNode[];
  mediaUrls: string[];
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
  const isSingleUrl = Boolean(trimmed.match(/^(?:https?:\/\/|www\.)[^\s]+$/i));
  if (isSingleUrl) {
    const media = extractMediaUrlFromLink(trimmed);
    if (media) {
      return media.isGif ? "Sent a GIF 🎬" : "Sent a photo 🖼️";
    }
    return "Sent a link 🔗";
  }
  return content;
}

/**
 * Parses user text:
 * - Highlights leading @mention (e.g. "@JohnDoe") in blue
 * - Turns all http/https/www links into clickable <a> tags
 * - Detects Giphy/Tenor/image media links for embedded rendering
 */
export function parseRichText(
  content: string,
  options?: { hidePureMediaUrl?: boolean; linkColor?: string }
): ParsedRichText {
  if (!content) {
    return { nodes: [], mediaUrls: [], isPureMedia: false };
  }

  const linkColor = options?.linkColor || "#0095f6";
  const hidePureMediaUrl = options?.hidePureMediaUrl ?? true;

  // 1. Check for leading @mention
  let prefixMention: string | null = null;
  let remainingText = content;

  const mentionMatch = content.match(/^(@[\w\u0600-\u06FF]+)([\s\S]*)$/);
  if (mentionMatch) {
    prefixMention = mentionMatch[1];
    remainingText = mentionMatch[2];
  }

  // 2. Find all URLs in remainingText
  const detectedMediaList: string[] = [];
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Clone regex for stateful iteration
  const regex = new RegExp(URL_REGEX);

  while ((match = regex.exec(remainingText)) !== null) {
    const url = match[1];
    const startIndex = match.index;

    // Push text before the link
    if (startIndex > lastIndex) {
      parts.push(remainingText.substring(lastIndex, startIndex));
    }

    // Check if this URL is a GIF or image
    const media = extractMediaUrlFromLink(url);
    if (media) {
      if (!detectedMediaList.includes(media.mediaUrl)) {
        detectedMediaList.push(media.mediaUrl);
      }
    }

    const href = url.toLowerCase().startsWith("www.") ? `https://${url}` : url;

    // Render clickable link
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
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "#38bdf8")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = linkColor)
        }
      >
        {url}
      </a>
    );

    lastIndex = startIndex + url.length;
  }

  // Push remaining text after last link
  if (lastIndex < remainingText.length) {
    parts.push(remainingText.substring(lastIndex));
  }

  // 3. Determine if the text is purely a media URL
  const trimmedRemaining = remainingText.trim();
  const isSingleUrl = Boolean(
    trimmedRemaining &&
    trimmedRemaining.match(/^(?:https?:\/\/|www\.)[^\s]+$/i) &&
    detectedMediaList.length > 0
  );

  const isPureMedia = isSingleUrl;

  // Build final nodes
  const nodes: React.ReactNode[] = [];

  if (prefixMention) {
    nodes.push(
      <span
        key="mention"
        style={{ color: linkColor, fontWeight: 600, marginRight: 4 }}
      >
        {prefixMention}
      </span>
    );
  }

  if (isPureMedia && hidePureMediaUrl) {
    // Hide raw link if only sending a media embed
  } else {
    nodes.push(...parts);
  }

  return {
    nodes,
    mediaUrls: detectedMediaList,
    isPureMedia,
  };
}
