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
export const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;!?"')\]\s])/g;

/**
 * Checks if a URL points to Giphy, Tenor, or a direct image/gif file,
 * and converts Giphy page links into direct CDN gif URLs.
 */
export function extractMediaUrlFromLink(rawUrl: string): MediaDetection | null {
  try {
    const cleanUrl = rawUrl.trim().replace(/[.,;!?]+$/, "");

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

    // 3. Direct GIF file (case-insensitive, allows query params like ?cid=...)
    if (/^https?:\/\/[^\s]+?\.(gif)(\?[^\s]*)?$/i.test(cleanUrl)) {
      return {
        mediaUrl: cleanUrl,
        isGif: true,
      };
    }

    // 4. Direct Image files (png, jpg, jpeg, webp)
    if (/^https?:\/\/[^\s]+?\.(png|jpe?g|webp)(\?[^\s]*)?$/i.test(cleanUrl)) {
      const isWebp = cleanUrl.toLowerCase().includes(".webp");
      return {
        mediaUrl: cleanUrl,
        isGif: isWebp,
      };
    }

    // 5. Tenor media URLs: https://media.tenor.com/...
    if (/^https?:\/\/media\.tenor\.com\/.+/i.test(cleanUrl)) {
      return {
        mediaUrl: cleanUrl,
        isGif: true,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parses user text:
 * - Highlights leading @mention (e.g. "@JohnDoe") in blue
 * - Turns all http/https links into clickable <a> tags
 * - Detects Giphy/image media links for embedded rendering
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

    // Render clickable link
    parts.push(
      <a
        key={`link-${startIndex}`}
        href={url}
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
          (e.currentTarget.style.color = "#0077c5")
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

  // 3. Determine if the text is purely a media URL (ignoring mention and whitespace)
  const trimmedRemaining = remainingText.trim();
  const isSingleUrl = Boolean(
    trimmedRemaining &&
    trimmedRemaining.match(/^https?:\/\/[^\s]+$/) &&
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
    // If the comment is literally just the GIF URL, we don't need to display the raw URL text,
    // since the embedded GIF player will be rendered right below!
    // (If there was a mention, the mention is already pushed above)
  } else {
    nodes.push(...parts);
  }

  return {
    nodes,
    mediaUrls: detectedMediaList,
    isPureMedia,
  };
}
