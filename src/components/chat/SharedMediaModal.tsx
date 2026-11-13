import React, { useState, useEffect, useMemo, useCallback } from "react";
import { chatApi } from "../../api/chat";
import type { Message } from "../../types/chat";
import { URL_REGEX, extractMediaUrlFromLink, type MediaDetection } from "../../utils/richText";
import { LightboxModal } from "../LightboxModal";
import {
  CloseIcon,
  ImageIcon,
  FileTextIcon,
  LinkIcon,
  ExternalLinkIcon,
} from "./ChatIcons";
import { DownloadIcon } from "./ChatAttachmentBubble";

interface SharedMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
  partnerName: string;
}

type TabType = "media" | "docs" | "links";

interface MediaItem {
  id: string;
  url: string;
  isGif: boolean;
  isVideo: boolean;
  senderName: string;
  createdAt: string;
  messageId: number;
}

interface DocItem {
  id: string;
  url: string;
  fileName: string;
  fileExt: string;
  senderName: string;
  createdAt: string;
  messageId: number;
}

interface LinkItem {
  id: string;
  url: string;
  domain: string;
  snippet: string;
  senderName: string;
  createdAt: string;
  messageId: number;
}

function getDomainFromUrl(rawUrl: string): string {
  try {
    const urlObj = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return rawUrl;
  }
}

function getDocBadgeColor(ext?: string): { bg: string; text: string } {
  const e = (ext || "FILE").toUpperCase();
  if (e === "PDF") return { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444" };
  if (["ZIP", "RAR", "7Z", "TAR", "GZ"].includes(e)) {
    return { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b" };
  }
  if (["DOC", "DOCX"].includes(e)) {
    return { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6" };
  }
  if (["XLS", "XLSX", "CSV"].includes(e)) {
    return { bg: "rgba(16, 185, 129, 0.15)", text: "#10b981" };
  }
  if (["PPT", "PPTX"].includes(e)) {
    return { bg: "rgba(249, 115, 22, 0.15)", text: "#f97316" };
  }
  return { bg: "rgba(107, 114, 128, 0.15)", text: "var(--text-secondary)" };
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function SharedMediaModal({
  isOpen,
  onClose,
  conversationId,
  partnerName,
}: SharedMediaModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("media");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Lightbox for media preview
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Fetch shared media messages when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    chatApi
      .getSharedMedia(conversationId)
      .then((data) => {
        if (isMounted) {
          setMessages(data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load shared media:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, conversationId]);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxIndex === null) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, lightboxIndex]);

  // Categorize messages into Media, Docs, and Links
  const { mediaList, docList, linkList } = useMemo(() => {
    const media: MediaItem[] = [];
    const docs: DocItem[] = [];
    const links: LinkItem[] = [];

    const seenUrls = new Set<string>();

    messages.forEach((msg) => {
      if (!msg.content || msg.isDeleted) return;

      const regex = new RegExp(URL_REGEX);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(msg.content)) !== null) {
        const rawUrl = match[1];
        const mediaDet: MediaDetection | null = extractMediaUrlFromLink(rawUrl);

        if (mediaDet) {
          if (mediaDet.isFile) {
            // Document / File
            const key = `${msg.id}-${mediaDet.mediaUrl}`;
            if (!seenUrls.has(key)) {
              seenUrls.add(key);
              docs.push({
                id: key,
                url: mediaDet.mediaUrl,
                fileName: mediaDet.fileName || "document",
                fileExt: mediaDet.fileExt || "FILE",
                senderName: msg.senderName,
                createdAt: msg.createdAt,
                messageId: msg.id,
              });
            }
          } else {
            // Photo, GIF, or Video
            const key = `${msg.id}-${mediaDet.mediaUrl}`;
            if (!seenUrls.has(key)) {
              seenUrls.add(key);
              media.push({
                id: key,
                url: mediaDet.mediaUrl,
                isGif: Boolean(mediaDet.isGif),
                isVideo: Boolean(mediaDet.isVideo),
                senderName: msg.senderName,
                createdAt: msg.createdAt,
                messageId: msg.id,
              });
            }
          }
        } else {
          // Normal web link
          const href = rawUrl.toLowerCase().startsWith("www.") ? `https://${rawUrl}` : rawUrl;
          const key = `${msg.id}-${href}`;
          if (!seenUrls.has(key)) {
            seenUrls.add(key);
            // Snippet is message content without the url, or trimmed
            const cleanSnippet = msg.content.replace(rawUrl, "").trim();
            links.push({
              id: key,
              url: href,
              domain: getDomainFromUrl(href),
              snippet: cleanSnippet || href,
              senderName: msg.senderName,
              createdAt: msg.createdAt,
              messageId: msg.id,
            });
          }
        }
      }
    });

    return { mediaList: media, docList: docs, linkList: links };
  }, [messages]);

  const allMediaUrls = useMemo(() => mediaList.map((m) => m.url), [mediaList]);

  const handleDownloadFile = useCallback((url: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="shared-media-modal-overlay"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 1500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.15s ease-out",
        }}
      >
        <div
          className="shared-media-modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 580,
            height: "82vh",
            maxHeight: 760,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.35)",
          }}
        >
          {/* Header */}
          <div
            className="shared-media-modal-header"
            style={{
              padding: "16px 20px 12px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                Media, links and docs
              </h3>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12.5,
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Shared with {partnerName}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Close"
              aria-label="Close shared media"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <CloseIcon size={18} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border-color)",
              padding: "0 12px",
              flexShrink: 0,
              backgroundColor: "var(--bg-main)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("media")}
              style={{
                flex: 1,
                padding: "11px 8px",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "media"
                    ? "2.5px solid var(--primary)"
                    : "2.5px solid transparent",
                color:
                  activeTab === "media"
                    ? "var(--primary)"
                    : "var(--text-secondary)",
                fontWeight: activeTab === "media" ? 700 : 500,
                fontSize: 13.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <ImageIcon size={15} />
              <span>Media ({mediaList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("docs")}
              style={{
                flex: 1,
                padding: "11px 8px",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "docs"
                    ? "2.5px solid var(--primary)"
                    : "2.5px solid transparent",
                color:
                  activeTab === "docs"
                    ? "var(--primary)"
                    : "var(--text-secondary)",
                fontWeight: activeTab === "docs" ? 700 : 500,
                fontSize: 13.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <FileTextIcon size={15} />
              <span>Docs ({docList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("links")}
              style={{
                flex: 1,
                padding: "11px 8px",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "links"
                    ? "2.5px solid var(--primary)"
                    : "2.5px solid transparent",
                color:
                  activeTab === "links"
                    ? "var(--primary)"
                    : "var(--text-secondary)",
                fontWeight: activeTab === "links" ? 700 : 500,
                fontSize: 13.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <LinkIcon size={15} />
              <span>Links ({linkList.length})</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div
            className="shared-media-modal-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: 12,
                  color: "var(--text-secondary)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    border: "3px solid var(--border-color)",
                    borderTopColor: "var(--primary)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ fontSize: 13 }}>Loading shared assets...</span>
              </div>
            ) : (
              <>
                {/* 1. MEDIA TAB (Photos, GIFs, Videos) */}
                {activeTab === "media" && (
                  <>
                    {mediaList.length === 0 ? (
                      <EmptyPlaceholder
                        icon={<ImageIcon size={38} />}
                        title="No media shared yet"
                        desc="Photos, GIFs, and videos shared in this chat will appear here."
                      />
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 6,
                        }}
                      >
                        {mediaList.map((item, idx) => (
                          <div
                            key={item.id}
                            onClick={() => setLightboxIndex(idx)}
                            style={{
                              position: "relative",
                              width: "100%",
                              aspectRatio: "1 / 1",
                              borderRadius: 8,
                              overflow: "hidden",
                              cursor: "pointer",
                              backgroundColor: "var(--bg-hover)",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            {item.isVideo ? (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  position: "relative",
                                  backgroundColor: "#000",
                                }}
                              >
                                <video
                                  src={item.url}
                                  preload="metadata"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                                <div
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "rgba(0,0,0,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: "50%",
                                      backgroundColor: "rgba(0,0,0,0.65)",
                                      color: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      paddingLeft: 2,
                                    }}
                                  >
                                    ▶
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={item.url}
                                alt="Shared media"
                                loading="lazy"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                  transition: "transform 0.2s ease",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.transform = "scale(1.04)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.transform = "scale(1)")
                                }
                              />
                            )}

                            {/* GIF badge */}
                            {item.isGif && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 6,
                                  left: 6,
                                  backgroundColor: "rgba(0,0,0,0.7)",
                                  color: "#fff",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 5px",
                                  borderRadius: 4,
                                  letterSpacing: "0.5px",
                                }}
                              >
                                GIF
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* 2. DOCS / FILES TAB */}
                {activeTab === "docs" && (
                  <>
                    {docList.length === 0 ? (
                      <EmptyPlaceholder
                        icon={<FileTextIcon size={38} />}
                        title="No files shared yet"
                        desc="Documents, PDFs, and archives shared in this chat will appear here."
                      />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {docList.map((doc) => {
                          const badge = getDocBadgeColor(doc.fileExt);
                          return (
                            <div
                              key={doc.id}
                              onClick={() => handleDownloadFile(doc.url, doc.fileName)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "10px 14px",
                                borderRadius: 10,
                                backgroundColor: "var(--bg-main)",
                                border: "1px solid var(--border-color)",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                e.currentTarget.style.borderColor = "var(--primary)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--bg-main)";
                                e.currentTarget.style.borderColor = "var(--border-color)";
                              }}
                            >
                              {/* Extension Icon Badge */}
                              <div
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: 8,
                                  backgroundColor: badge.bg,
                                  color: badge.text,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  letterSpacing: 0.5,
                                  flexShrink: 0,
                                }}
                              >
                                {doc.fileExt.slice(0, 4)}
                              </div>

                              {/* File Details */}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 13.5,
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={doc.fileName}
                                >
                                  {doc.fileName}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "var(--text-secondary)",
                                    marginTop: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <span>{doc.senderName}</span>
                                  <span>•</span>
                                  <span>{formatDate(doc.createdAt)}</span>
                                </div>
                              </div>

                              {/* Download Button */}
                              <button
                                type="button"
                                title="Download file"
                                aria-label={`Download ${doc.fileName}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadFile(doc.url, doc.fileName);
                                }}
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 8,
                                  backgroundColor: "var(--bg-hover)",
                                  border: "1px solid var(--border-color)",
                                  color: "var(--text-primary)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "var(--primary)";
                                  e.currentTarget.style.color = "#fff";
                                  e.currentTarget.style.borderColor = "var(--primary)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                  e.currentTarget.style.color = "var(--text-primary)";
                                  e.currentTarget.style.borderColor = "var(--border-color)";
                                }}
                              >
                                <DownloadIcon size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* 3. LINKS TAB */}
                {activeTab === "links" && (
                  <>
                    {linkList.length === 0 ? (
                      <EmptyPlaceholder
                        icon={<LinkIcon size={38} />}
                        title="No links shared yet"
                        desc="Web links and URLs shared in this chat will appear here."
                      />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {linkList.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "10px 14px",
                              borderRadius: 10,
                              backgroundColor: "var(--bg-main)",
                              border: "1px solid var(--border-color)",
                              textDecoration: "none",
                              color: "inherit",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                              e.currentTarget.style.borderColor = "var(--primary)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "var(--bg-main)";
                              e.currentTarget.style.borderColor = "var(--border-color)";
                            }}
                          >
                            {/* Link Globe / Icon Badge */}
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 8,
                                backgroundColor: "rgba(14, 165, 233, 0.15)",
                                color: "#0ea5e9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <LinkIcon size={18} />
                            </div>

                            {/* Link Details */}
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 600,
                                  color: "var(--text-primary)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span
                                  style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {link.domain}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "var(--primary)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  marginTop: 1,
                                }}
                              >
                                {link.url}
                              </div>
                              <div
                                style={{
                                  fontSize: 11.5,
                                  color: "var(--text-secondary)",
                                  marginTop: 3,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span>{link.senderName}</span>
                                <span>•</span>
                                <span>{formatDate(link.createdAt)}</span>
                              </div>
                            </div>

                            {/* External Arrow Icon */}
                            <div
                              style={{
                                color: "var(--text-secondary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 6,
                                flexShrink: 0,
                              }}
                            >
                              <ExternalLinkIcon size={15} />
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for full image/video preview */}
      <LightboxModal
        isOpen={lightboxIndex !== null}
        images={allMediaUrls}
        initialIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  );
}

function EmptyPlaceholder({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: 220,
        textAlign: "center",
        padding: "30px 20px",
        color: "var(--text-secondary)",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          backgroundColor: "var(--bg-hover)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
          color: "var(--text-secondary)",
        }}
      >
        {icon}
      </div>
      <h4
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h4>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: 13,
          maxWidth: 280,
          lineHeight: 1.45,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

