import { useConversationReadReceipt } from "../../hooks/useConversationReadReceipt";
import { MessageStatus } from "./MessageStatus";
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { chatApi } from "../../api/chat";
import { mediaApi } from "../../api/media";
import { Avatar } from "../Avatar";
import { formatRelativeTime } from "../../utils/time";
import { parseRichText } from "../../utils/richText";
import { soundEffects } from "../../utils/soundEffects";
import { GifPicker } from "./GifPicker";
import {
  ChatAttachmentBubble,
  PaperclipIcon,
} from "./ChatAttachmentBubble";
import {
  ChatAttachmentStaging,
  type StagedAttachment,
} from "./ChatAttachmentStaging";
import { ChatDropzoneOverlay } from "./ChatDropzoneOverlay";
import type { Message, ConversationSummary } from "../../types/chat";

export function FloatingChatDock() {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const {
    floatingConversationId,
    closeFloatingChat,
    conversations,
    setConversations,
    refreshConversations,
    refreshUnreadCount,
    joinConversation,
    leaveConversation,
    sendTyping,
    onReceiveMessage,
    onMessageEdited,
    onMessageDeleted,
    onUserTyping,
    isUserOnline,
  } = useChat();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [stagedAttachments, setStagedAttachments] = useState<StagedAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragDepthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up object URLs on dock close/unmount
  const stagedAttachmentsRef = useRef(stagedAttachments);
  useEffect(() => {
    stagedAttachmentsRef.current = stagedAttachments;
  }, [stagedAttachments]);

  useEffect(() => {
    return () => {
      stagedAttachmentsRef.current.forEach((att) => {
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      });
    };
  }, []);
  const [conversationDetails, setConversationDetails] = useState<ConversationSummary | null>(null);
  const { isMessageSeen } = useConversationReadReceipt(
    floatingConversationId,
    conversationDetails?.otherParticipantLastReadAt
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTypingSendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Find or fetch conversation summary
  useEffect(() => {
    if (!floatingConversationId) {
      setConversationDetails(null);
      setMessages([]);
      return;
    }

    const cached = conversations.find((c) => c.id === floatingConversationId);
    if (cached) {
      setConversationDetails(cached);
    } else {
      chatApi
        .getConversation(floatingConversationId)
        .then((res) => setConversationDetails(res))
        .catch(() => {});
    }
  }, [floatingConversationId, conversations]);

  // Load messages & join SignalR group
  useEffect(() => {
    if (!floatingConversationId) return;

    let isMounted = true;
    setLoading(true);

    chatApi
      .getMessages(floatingConversationId, 1, 30)
      .then((res) => {
        if (!isMounted) return;
        setMessages(res.items || []);
        // Mark as read and synchronize unread states
        chatApi
          .markAsRead(floatingConversationId)
          .then(() => {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === floatingConversationId ? { ...c, unreadCount: 0 } : c
              )
            );
            refreshUnreadCount().catch(() => {});
          })
          .catch(() => {});
      })
      .catch((err) => {
        console.error("Failed to load floating chat messages:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    joinConversation(floatingConversationId).catch(() => {});

    return () => {
      isMounted = false;
      leaveConversation(floatingConversationId).catch(() => {});
    };
  }, [floatingConversationId, joinConversation, leaveConversation, refreshUnreadCount, setConversations]);

  // Scroll on messages change or when other user is typing
  useEffect(() => {
    if (messages.length > 0 || isOtherTyping) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isOtherTyping]);

  // SignalR message & typing subscriptions
  useEffect(() => {
    if (!floatingConversationId) return;

    const unsubReceive = onReceiveMessage((msg) => {
      if (msg.conversationId === floatingConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) {
            return prev;
          }
          return [...prev, msg];
        });
        chatApi
          .markAsRead(floatingConversationId)
          .then(() => {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === floatingConversationId ? { ...c, unreadCount: 0 } : c
              )
            );
            refreshUnreadCount().catch(() => {});
          })
          .catch(() => {});
      }
    });

    const unsubEdited = onMessageEdited((editedMsg) => {
      if (editedMsg.conversationId === floatingConversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === editedMsg.id ? editedMsg : m))
        );
      }
    });

    const unsubDeleted = onMessageDeleted((data) => {
      if (data.conversationId === floatingConversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? { ...m, isDeleted: true, content: data.content }
              : m
          )
        );
      }
    });

    const unsubTyping = onUserTyping((event) => {
      if (
        event.conversationId === floatingConversationId &&
        event.userId !== currentUser?.id
      ) {
        setIsOtherTyping(event.isTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (event.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, 3500);
        }
      }
    });

    return () => {
      unsubReceive();
      unsubEdited();
      unsubDeleted();
      unsubTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [
    floatingConversationId,
    currentUser?.id,
    onReceiveMessage,
    onMessageEdited,
    onMessageDeleted,
    onUserTyping,
    refreshUnreadCount,
    setConversations,
  ]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!floatingConversationId) return;

    if (!userTypingSendTimeoutRef.current) {
      sendTyping(floatingConversationId, true).catch(() => {});
    } else {
      clearTimeout(userTypingSendTimeoutRef.current);
    }

    userTypingSendTimeoutRef.current = setTimeout(() => {
      if (floatingConversationId) {
        sendTyping(floatingConversationId, false).catch(() => {});
      }
      userTypingSendTimeoutRef.current = null;
    }, 2000);
  };

  // Stage files for attachment
  const stageFiles = (files: FileList | File[]) => {
    const newStaged: StagedAttachment[] = [];
    Array.from(files).forEach((file) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      const isImage =
        file.type.startsWith("image/") ||
        [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
      const isVideo =
        file.type.startsWith("video/") ||
        [".mp4", ".webm", ".mov", ".mkv", ".ogg", ".m4v"].includes(ext);

      let type: "image" | "video" | "file" = "file";
      let previewUrl: string | undefined = undefined;

      if (isImage) {
        type = "image";
        previewUrl = URL.createObjectURL(file);
      } else if (isVideo) {
        type = "video";
        previewUrl = URL.createObjectURL(file);
      } else {
        type = "file";
      }

      newStaged.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl,
        type,
        name: file.name,
        size: file.size,
      });
    });

    setStagedAttachments((prev) => [...prev, ...newStaged]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      stageFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeStagedAttachment = (id: string) => {
    setStagedAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  // Drag and Drop handlers for floating chat dock
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      stageFiles(e.dataTransfer.files);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if ((!trimmed && stagedAttachments.length === 0) || isSending || !floatingConversationId) return;

    const currentAttachments = [...stagedAttachments];
    setIsSending(true);
    setInputText("");
    setStagedAttachments([]);
    inputRef.current?.focus();

    try {
      if (userTypingSendTimeoutRef.current) {
        clearTimeout(userTypingSendTimeoutRef.current);
        userTypingSendTimeoutRef.current = null;
        sendTyping(floatingConversationId, false).catch(() => {});
      }

      if (currentAttachments.length > 0) {
        let caption = trimmed;
        for (const staged of currentAttachments) {
          const uploadedUrl = await mediaApi.upload(staged.file, "chat");
          const messageContent = caption ? `${caption}\n${uploadedUrl}` : uploadedUrl;
          caption = "";

          const newMsg = await chatApi.sendMessage(floatingConversationId, messageContent);
          soundEffects.playChatSent();
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, { ...newMsg, isMine: true }];
          });
        }

        currentAttachments.forEach((att) => {
          if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
        });
      } else {
        const newMsg = await chatApi.sendMessage(floatingConversationId, trimmed);
        soundEffects.playChatSent();
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, { ...newMsg, isMine: true }];
        });
      }

      refreshConversations().catch(() => {});
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Failed to send floating chat message:", err);
      if (trimmed) setInputText(trimmed);
      if (currentAttachments.length > 0) setStagedAttachments(currentAttachments);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle Send GIF
  const handleSendGif = async (gifUrl: string) => {
    if (!floatingConversationId || isSending) return;
    setIsSending(true);
    setIsGifPickerOpen(false);

    try {
      if (userTypingSendTimeoutRef.current) {
        clearTimeout(userTypingSendTimeoutRef.current);
        userTypingSendTimeoutRef.current = null;
        sendTyping(floatingConversationId, false).catch(() => {});
      }

      const newMsg = await chatApi.sendMessage(floatingConversationId, gifUrl);
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        return [...prev, { ...newMsg, isMine: true }];
      });
      refreshConversations().catch(() => {});
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Failed to send floating chat GIF:", err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // If on full messenger or no active floating chat, don't display dock
  if (!floatingConversationId || location.pathname === "/messages") {
    return null;
  }

  const otherParticipant = conversationDetails?.otherParticipant;

  // Render Full Floating Chat Window
  return (
    <div
      className="floating-chat-dock"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        position: "fixed",
        bottom: 0,
        right: "clamp(12px, 3vw, 24px)",
        zIndex: 1000,
        width: "min(330px, calc(100vw - 24px))",
        height: 420,
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderBottom: "none",
        borderRadius: "12px 12px 0 0",
        boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.18)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Drag and Drop Overlay */}
      <ChatDropzoneOverlay
        isVisible={isDraggingOver}
        targetName={otherParticipant?.name}
      />

      {/* Header */}
      <div
        style={{
          height: 50,
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-card)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar src={otherParticipant?.avatarUrl} name={otherParticipant?.name || "Chat"} size={32} />
            {otherParticipant && isUserOnline(otherParticipant.id) && (
              <span
                title="Active now"
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  border: "2px solid var(--bg-card)",
                }}
              />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              {otherParticipant?.name || "Conversation"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: isOtherTyping ? "var(--primary)" : "var(--text-secondary)",
                fontWeight: isOtherTyping ? 600 : 400,
                lineHeight: 1.2,
                marginTop: 2,
              }}
            >
              {isOtherTyping
                ? "Typing..."
                : otherParticipant && isUserOnline(otherParticipant.id)
                ? "Active now"
                : otherParticipant?.username
                ? `@${otherParticipant.username}`
                : "Offline"}
            </div>
          </div>
        </div>

        {/* Header Action Buttons: Close only */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            title="Close"
            onClick={closeFloatingChat}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "4px 8px",
              fontSize: 16,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
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
            ✕
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div
        style={{
          flex: 1,
          padding: "12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          backgroundColor: "var(--bg-main)",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 13, padding: "30px 0" }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 13, padding: "40px 10px" }}>
            Say hello to {otherParticipant?.name || "them"} 👋
          </div>
        ) : (
          (() => {
            const lastMineIndex = messages
              .map((m) =>
                currentUser ? m.senderUserId === currentUser.id : m.isMine
              )
              .lastIndexOf(true);

            return messages.map((m, index) => {
              const isMine = currentUser
                ? m.senderUserId === currentUser.id
                : m.isMine;
              const isLastMine = isMine && index === lastMineIndex;
              const parsed = parseRichText(m.content);
              const isPureMedia =
                !m.isDeleted && parsed.mediaUrls.length > 0 && parsed.nodes.length === 0;

              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMine ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    alignSelf: isMine ? "flex-end" : "flex-start",
                  }}
                >
                  {/* Bubble for text content (if not pure media or if deleted) */}
                  {(parsed.nodes.length > 0 || m.isDeleted) && (
                    <div
                      style={{
                        backgroundColor: isMine ? "var(--primary)" : "var(--bg-card)",
                        color: isMine ? "#ffffff" : "var(--text-primary)",
                        padding: "8px 12px",
                        borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        fontSize: 13,
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                        border: isMine ? "none" : "1px solid var(--border-color)",
                        fontStyle: m.isDeleted ? "italic" : "normal",
                        opacity: m.isDeleted ? 0.75 : 1,
                      }}
                    >
                      {parsed.nodes}
                    </div>
                  )}

                  {/* Embedded Attachments (Images, Videos, Files, GIFs) */}
                  {!m.isDeleted && parsed.attachments && parsed.attachments.length > 0 && (
                    <div
                      style={{
                        marginTop: parsed.nodes.length > 0 ? 6 : 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {parsed.attachments.map((att, attIdx) => (
                        <ChatAttachmentBubble
                          key={attIdx}
                          attachment={att}
                          isMine={isMine}
                          isPureMedia={isPureMedia}
                          onMediaLoaded={scrollToBottom}
                        />
                      ))}
                    </div>
                  )}

                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--text-tertiary)",
                      marginTop: 2,
                      padding: "0 4px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>{formatRelativeTime(m.createdAt)}</span>
                    {isLastMine && (
                      <MessageStatus isSeen={isMessageSeen(m.createdAt)} variant="bullet" />
                    )}
                  </span>
                </div>
              );
            });
          })()
        )}

        {/* Typing Bubble */}
        {isOtherTyping && (
          <div
            style={{
              alignSelf: "flex-start",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              padding: "6px 12px",
              borderRadius: "16px 16px 16px 4px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--text-secondary)", fontStyle: "italic" }}>
              Typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* GIF Picker Popover */}
      {isGifPickerOpen && (
        <GifPicker
          onSelectGif={handleSendGif}
          onClose={() => setIsGifPickerOpen(false)}
          style={{
            position: "absolute",
            bottom: 49,
            left: 0,
            right: 0,
            width: "100%",
            height: 320,
            maxHeight: 320,
            borderRadius: "12px 12px 0 0",
            borderLeft: "none",
            borderRight: "none",
            boxShadow: "0 -6px 20px rgba(0,0,0,0.2)",
            zIndex: 100,
          }}
        />
      )}

      {/* Staged Attachments Preview Bar */}
      <ChatAttachmentStaging
        stagedAttachments={stagedAttachments}
        onRemove={removeStagedAttachment}
        isUploading={isSending}
      />

      {/* Input Composer */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: "8px 10px",
          borderTop: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-card)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onMouseDown={(e) => e.stopPropagation()}
          title="Attach files or media"
          aria-label="Attach files or media"
          disabled={isSending}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "var(--bg-hover)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-color)",
            cursor: isSending ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--border-color)";
            e.currentTarget.style.color = "var(--primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <PaperclipIcon size={16} />
        </button>

        {/* GIF Picker Toggle Button */}
        <button
          type="button"
          onClick={() => setIsGifPickerOpen((prev) => !prev)}
          onMouseDown={(e) => e.stopPropagation()}
          title="Choose a GIF"
          aria-label="Choose a GIF"
          style={{
            height: 32,
            padding: "0 8px",
            borderRadius: 16,
            backgroundColor: isGifPickerOpen
              ? "var(--primary-light)"
              : "var(--bg-hover)",
            color: isGifPickerOpen
              ? "var(--primary)"
              : "var(--text-secondary)",
            border: "1px solid var(--border-color)",
            fontSize: 11,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            flexShrink: 0,
            letterSpacing: "0.5px",
          }}
        >
          GIF
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={
            stagedAttachments.length > 0
              ? "Add a caption..."
              : "Type a message..."
          }
          style={{
            flex: 1,
            minWidth: 0,
            padding: "8px 12px",
            fontSize: 13,
            backgroundColor: "var(--bg-hover)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-full)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={
            (!inputText.trim() && stagedAttachments.length === 0) || isSending
          }
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor:
              (inputText.trim() || stagedAttachments.length > 0) && !isSending
                ? "var(--primary)"
                : "var(--bg-hover)",
            color:
              (inputText.trim() || stagedAttachments.length > 0) && !isSending
                ? "#ffffff"
                : "var(--text-tertiary)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor:
              (inputText.trim() || stagedAttachments.length > 0) && !isSending
                ? "pointer"
                : "default",
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
        >
          {isSending ? (
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
