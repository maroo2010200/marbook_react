import { useConversationReadReceipt } from "../hooks/useConversationReadReceipt";
import { MessageStatus } from "../components/chat/MessageStatus";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { chatApi } from "../api/chat";
import { mediaApi } from "../api/media";
import { formatRelativeTime } from "../utils/time";
import { parseRichText, formatMessageSnippet } from "../utils/richText";
import { GifPicker } from "../components/chat/GifPicker";
import { LightboxModal } from "../components/LightboxModal";
import { Avatar } from "../components/Avatar";
import { soundEffects } from "../utils/soundEffects";
import {
  ChatAttachmentBubble,
  PaperclipIcon,
} from "../components/chat/ChatAttachmentBubble";
import {
  ChatAttachmentStaging,
  type StagedAttachment,
} from "../components/chat/ChatAttachmentStaging";
import { ChatDropzoneOverlay } from "../components/chat/ChatDropzoneOverlay";
import { useChatMessageActions } from "../hooks/useChatMessageActions";
import { useInChatSearch } from "../hooks/useInChatSearch";
import {
  CloseIcon,
  PinIcon,
  SearchIcon,
  SharedAssetsIcon,
} from "../components/chat/ChatIcons";
import { SharedMediaModal } from "../components/chat/SharedMediaModal";
import { ChatSearchBar } from "../components/chat/ChatSearchBar";
import { MessageActionsMenu } from "../components/chat/MessageActionsMenu";
import { MessageEditBox } from "../components/chat/MessageEditBox";
import { DeleteMessageModal } from "../components/chat/DeleteMessageModal";
import type { Message, ConversationSummary, TypingEvent } from "../types/chat";

export default function MessagesPage() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlConversationId = searchParams.get("conversationId");

  const {
    conversations,
    setConversations,
    refreshConversations,
    refreshUnreadCount,
    setActiveConversationId,
    joinConversation,
    leaveConversation,
    sendTyping,
    onReceiveMessage,
    onMessageEdited,
    onMessageDeleted,
    onMessagePinned,
    onUserTyping,
    isUserOnline,
  } = useChat();

  const [selectedId, setSelectedId] = useState<number | null>(
    urlConversationId ? parseInt(urlConversationId, 10) : null
  );

  const [activeConversation, setActiveConversation] =
    useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search filter for sidebar
  const [searchQuery, setSearchQuery] = useState("");

  // In-conversation search hook (encapsulates query, match indexing, and keyboard navigation)
  const search = useInChatSearch(messages, "msg-");

  // Shared media drawer state
  const [isSharedMediaOpen, setIsSharedMediaOpen] = useState(false);

  // Input & Sending
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // File Attachments & Drag-and-Drop
  const [stagedAttachments, setStagedAttachments] = useState<StagedAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragDepthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up object URLs on component unmount
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

  // GIF Picker & Lightbox
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const {
    editingMessageId,
    editText,
    setEditText,
    isSavingEdit,
    messageToDeleteId,
    isDeletingMessage,
    deleteMessageError,
    startEdit,
    cancelEdit,
    saveEdit,
    promptDelete,
    cancelDelete,
    confirmDelete,
    togglePin,
  } = useChatMessageActions({
    conversationId: selectedId,
    setMessages,
  });

  // Typing state of the other participant
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTypingSendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Read status for own last message
  const { isMessageSeen } = useConversationReadReceipt(
    selectedId,
    activeConversation?.otherParticipantLastReadAt
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync selectedId with URL params
  useEffect(() => {
    if (urlConversationId) {
      const parsed = parseInt(urlConversationId, 10);
      if (!isNaN(parsed) && parsed !== selectedId) {
        setSelectedId(parsed);
      }
    }
  }, [urlConversationId, selectedId]);

  // Keep activeConversationId in sync with ChatContext
  useEffect(() => {
    setActiveConversationId(selectedId);
    return () => {
      setActiveConversationId(null);
    };
  }, [selectedId, setActiveConversationId]);

  // Reset in-conversation search when active conversation changes
  useEffect(() => {
    search.closeSearch();
    setIsSharedMediaOpen(false);
  }, [selectedId, search.closeSearch]);

  // Find or fetch active conversation summary
  useEffect(() => {
    if (!selectedId) {
      setActiveConversation(null);
      return;
    }

    const found = conversations.find((c) => c.id === selectedId);
    if (found) {
      setActiveConversation(found);
    } else {
      chatApi
        .getConversation(selectedId)
        .then((res) => setActiveConversation(res))
        .catch(() => {});
    }
  }, [selectedId, conversations]);



  // Auto-scroll to bottom of messages container
  const scrollToBottom = useCallback((smooth = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, []);

  // Fetch initial messages when selectedId changes
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);
    setMessagesPage(1);

    // Join conversation group in SignalR
    joinConversation(selectedId);

    // Mark as read
    chatApi
      .markAsRead(selectedId)
      .then(() => {
        // clear local unread count
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c))
        );
        refreshUnreadCount();
      })
      .catch(() => {});

    // Fetch first page of messages
    chatApi
      .getMessages(selectedId, 1, 40)
      .then((res) => {
        if (!isMounted) return;
        setMessages(res.items);
        setHasMoreMessages(res.items.length < res.totalCount);
        setLoadingMessages(false);
        setTimeout(() => scrollToBottom(false), 50);
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        if (isMounted) setLoadingMessages(false);
      });

    return () => {
      isMounted = false;
      leaveConversation(selectedId);
    };
  }, [
    selectedId,
    joinConversation,
    leaveConversation,
    setConversations,
    refreshUnreadCount,
    scrollToBottom,
  ]);

  // Load older messages
  const handleLoadOlderMessages = async () => {
    if (!selectedId || loadingMore || !hasMoreMessages) return;

    setLoadingMore(true);
    const nextPage = messagesPage + 1;

    try {
      const res = await chatApi.getMessages(selectedId, nextPage, 40);

      // Preserve scroll position
      const container = messagesContainerRef.current;
      const prevScrollHeight = container?.scrollHeight || 0;

      setMessages((prev) => [...res.items, ...prev]);
      setMessagesPage(nextPage);
      setHasMoreMessages(res.items.length + messages.length < res.totalCount);

      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight;
        }
      }, 30);
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // SignalR Event Listeners
  useEffect(() => {
    // 1. Receive new message
    const unsubReceive = onReceiveMessage((newMsg) => {
      if (newMsg.conversationId === selectedId) {
        setMessages((prev) => {
          // Avoid duplicate
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });

        // Mark as read immediately if chat is open
        const isMsgMine = currentUser
          ? newMsg.senderUserId === currentUser.id
          : newMsg.isMine;

        if (!isMsgMine && selectedId) {
          chatApi
            .markAsRead(selectedId)
            .then(() => {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === selectedId ? { ...c, unreadCount: 0 } : c
                )
              );
              refreshUnreadCount();
            })
            .catch(() => {});
        }

        setTimeout(() => scrollToBottom(true), 50);
      }
    });

    // 2. Message edited
    const unsubEdited = onMessageEdited((editedMsg) => {
      if (editedMsg.conversationId === selectedId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === editedMsg.id ? editedMsg : m))
        );
      }
    });

    // 3. Message deleted
    const unsubDeleted = onMessageDeleted((data) => {
      if (data.conversationId === selectedId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? {
                  ...m,
                  content: data.content,
                  isDeleted: true,
                  updatedAt: data.updatedAt,
                }
              : m
          )
        );
      }
    });

    // 4. Typing indicator
    const unsubTyping = onUserTyping((event: TypingEvent) => {
      if (event.conversationId === selectedId) {
        if (event.isTyping) {
          setTypingUser(event.userName);
          setTimeout(() => scrollToBottom(true), 50);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 3000);
        } else {
          setTypingUser(null);
        }
      }
    });

    // 5. Message pinned
    const unsubPinned = onMessagePinned(({ conversationId, messageId, isPinned }) => {
      if (conversationId === selectedId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === messageId) return { ...m, isPinned };
            if (isPinned) return { ...m, isPinned: false };
            return m;
          })
        );
      }
    });

    return () => {
      unsubReceive();
      unsubEdited();
      unsubDeleted();
      unsubPinned();
      unsubTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [
    selectedId,
    onReceiveMessage,
    onMessageEdited,
    onMessageDeleted,
    onMessagePinned,
    onUserTyping,
    refreshUnreadCount,
    scrollToBottom,
  ]);

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

  // Drag and Drop handlers for entire chat thread area
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

  // Handle Send Message (supports text and multi-file attachments)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      !selectedId ||
      (!inputText.trim() && stagedAttachments.length === 0) ||
      isSending
    ) {
      return;
    }

    const textToSend = inputText.trim();
    const currentAttachments = [...stagedAttachments];

    setInputText("");
    setStagedAttachments([]);
    inputRef.current?.focus();
    setIsSending(true);

    // Stop typing notification
    sendTyping(selectedId, false);

    try {
      if (currentAttachments.length > 0) {
        let caption = textToSend;
        for (const staged of currentAttachments) {
          const uploadedUrl = await mediaApi.upload(staged.file, "chat");
          const messageContent = caption ? `${caption}\n${uploadedUrl}` : uploadedUrl;
          caption = ""; // Caption attached to first uploaded item

          const created = await chatApi.sendMessage(selectedId, messageContent);
          soundEffects.playChatSent();

          setMessages((prev) => {
            if (prev.some((m) => m.id === created.id)) return prev;
            return [...prev, { ...created, isMine: true }];
          });

          // Update sidebar conversations list
          setConversations((prev) => {
            const index = prev.findIndex((c) => c.id === selectedId);
            if (index === -1) {
              refreshConversations();
              return prev;
            }
            const updated = [...prev];
            const conv = { ...updated[index] };
            conv.lastMessage = created;
            conv.updatedAt = created.createdAt;
            updated.splice(index, 1);
            return [conv, ...updated];
          });
        }

        // Clean up object URLs
        currentAttachments.forEach((att) => {
          if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
        });
      } else {
        const created = await chatApi.sendMessage(selectedId, textToSend);
        soundEffects.playChatSent();

        // Append locally if not already appended by SignalR
        setMessages((prev) => {
          if (prev.some((m) => m.id === created.id)) return prev;
          return [...prev, { ...created, isMine: true }];
        });

        // Update sidebar conversations list
        setConversations((prev) => {
          const index = prev.findIndex((c) => c.id === selectedId);
          if (index === -1) {
            refreshConversations();
            return prev;
          }
          const updated = [...prev];
          const conv = { ...updated[index] };
          conv.lastMessage = created;
          conv.updatedAt = created.createdAt;
          updated.splice(index, 1);
          return [conv, ...updated];
        });
      }

      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      console.error("Failed to send message:", err);
      // restore text on error
      if (textToSend) setInputText(textToSend);
      if (currentAttachments.length > 0) setStagedAttachments(currentAttachments);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle Send GIF
  const handleSendGif = async (gifUrl: string) => {
    if (!selectedId || isSending) return;
    setIsSending(true);
    setIsGifPickerOpen(false);
    sendTyping(selectedId, false);

    try {
      const created = await chatApi.sendMessage(selectedId, gifUrl);
      soundEffects.playChatSent();

      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev;
        return [...prev, { ...created, isMine: true }];
      });

      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === selectedId);
        if (index === -1) {
          refreshConversations();
          return prev;
        }
        const updated = [...prev];
        const conv = { ...updated[index] };
        conv.lastMessage = created;
        conv.updatedAt = created.createdAt;
        updated.splice(index, 1);
        return [conv, ...updated];
      });

      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      console.error("Failed to send GIF:", err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Typing event handler with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!selectedId) return;

    if (!userTypingSendTimeoutRef.current) {
      sendTyping(selectedId, true);
    } else {
      clearTimeout(userTypingSendTimeoutRef.current);
    }

    userTypingSendTimeoutRef.current = setTimeout(() => {
      sendTyping(selectedId, false);
      userTypingSendTimeoutRef.current = null;
    }, 1500);
  };

  // Switch conversation
  const handleSelectConversation = (convId: number) => {
    setSelectedId(convId);
    setSearchParams({ conversationId: convId.toString() });
  };

  // Filtered sidebar conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.otherParticipant.name.toLowerCase().includes(query) ||
      (c.otherParticipant.username &&
        c.otherParticipant.username.toLowerCase().includes(query))
    );
  });

  return (
    <div
      className="messages-page-layout"
      style={{
        display: "flex",
        height: "calc(100dvh - 56px)",
        marginTop: 56,
        width: "100%",
        maxWidth: "100vw",
        backgroundColor: "var(--bg-page)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        overflow: "hidden",
      }}
    >
      {/* LEFT SIDEBAR: Conversations List */}
      <div
        className={`messages-sidebar ${selectedId ? "messages-sidebar-hidden-mobile" : ""}`}
        style={{
          width: "clamp(260px, 28vw, 360px)",
          borderRight: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-card)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Sidebar Header & Search */}
        <div
          style={{
            padding: "16px 16px 10px",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Chats
            </h1>
          </div>

          {/* Search Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "var(--bg-hover)",
              borderRadius: 20,
              padding: "6px 12px",
              gap: 8,
            }}
          >
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: 14,
                width: "100%",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                title="Clear search"
                aria-label="Clear search"
                style={{
                  border: "none",
                  background: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Conversations Scrollable List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {filteredConversations.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 14,
              }}
            >
              {searchQuery ? "No chats found." : "No messages yet."}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = c.id === selectedId;
              const hasUnread = !isSelected && c.unreadCount > 0;
              const other = c.otherParticipant;
              const lastMsg = c.lastMessage;

              let snippet = "Started a conversation";
              if (lastMsg) {
                const isLastMine = currentUser
                  ? lastMsg.senderUserId === currentUser.id
                  : lastMsg.isMine;

                if (lastMsg.isDeleted) {
                  snippet = "This message was deleted";
                } else {
                  const formatted = formatMessageSnippet(lastMsg.content);
                  if (isLastMine) {
                    snippet = `You: ${formatted}`;
                  } else {
                    snippet = formatted;
                  }
                }
              }

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 16px",
                    cursor: "pointer",
                    backgroundColor: isSelected
                      ? "var(--bg-active)"
                      : hasUnread
                      ? "var(--bg-hover)"
                      : "transparent",
                    borderLeft: isSelected
                      ? "4px solid var(--primary)"
                      : "4px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = hasUnread
                        ? "var(--bg-hover)"
                        : "transparent";
                    }
                  }}
                >
                  {/* User Avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar src={other.avatarUrl} name={other.name} size={48} />
                    {isUserOnline(other.id) && (
                      <span
                        title="Active now"
                        style={{
                          position: "absolute",
                          bottom: 1,
                          right: 1,
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "#22c55e",
                          border: "2px solid var(--bg-card)",
                        }}
                      />
                    )}
                  </div>

                  {/* Info & Snippet */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: hasUnread ? 700 : 600,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {other.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: hasUnread
                            ? "var(--primary)"
                            : "var(--text-muted)",
                          fontWeight: hasUnread ? 600 : 400,
                          flexShrink: 0,
                        }}
                      >
                        {formatRelativeTime(c.updatedAt)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: hasUnread
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                          fontWeight: hasUnread ? 600 : 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontStyle: lastMsg?.isDeleted ? "italic" : "normal",
                        }}
                      >
                        {snippet}
                      </span>

                      {hasUnread && (
                        <span
                          style={{
                            backgroundColor: "var(--primary)",
                            color: "#fff",
                            borderRadius: 10,
                            padding: "1px 6px",
                            fontSize: 11,
                            fontWeight: 700,
                            minWidth: 18,
                            textAlign: "center",
                            flexShrink: 0,
                          }}
                        >
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT MAIN AREA: Active Chat Thread */}
      <div
        className={`messages-thread-pane ${!selectedId ? "messages-thread-hidden-mobile" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-card)",
          position: "relative",
          minWidth: 0,
        }}
      >
        {!selectedId || !activeConversation ? (
          /* Empty / Unselected State */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              textAlign: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "var(--bg-hover)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                marginBottom: 16,
              }}
            >
              💬
            </div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 8px 0",
              }}
            >
              Your Messages
            </h2>
            <p style={{ margin: 0, maxWidth: 320, fontSize: 14 }}>
              Send private messages and real-time replies to your friends. Select
              a chat from the list or click "Message" on any user's profile.
            </p>
          </div>
        ) : (
          /* Active Chat Window */
          <>
            {/* Drag & Drop Overlay */}
            <ChatDropzoneOverlay
              isVisible={isDraggingOver}
              targetName={activeConversation.otherParticipant.name}
            />

            {/* Chat Top Header */}
            <div
              style={{
                padding: "10px clamp(10px, 3vw, 16px)",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "var(--bg-card)",
                boxShadow: "var(--shadow-sm)",
                zIndex: 10,
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "clamp(6px, 2vw, 12px)",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {/* Back button on mobile */}
                <button
                  type="button"
                  className="messages-back-btn"
                  onClick={() => {
                    setSelectedId(null);
                    setSearchParams({});
                  }}
                  aria-label="Back to conversations"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    padding: "6px 6px 6px 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <Link
                  to={`/profile/${activeConversation.otherParticipant.id}`}
                  style={{ textDecoration: "none", flexShrink: 0, position: "relative" }}
                >
                  <Avatar
                    src={activeConversation.otherParticipant.avatarUrl}
                    name={activeConversation.otherParticipant.name}
                    size={40}
                  />
                  {isUserOnline(activeConversation.otherParticipant.id) && (
                    <span
                      title="Active now"
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: "#22c55e",
                        border: "2px solid var(--bg-card)",
                      }}
                    />
                  )}
                </Link>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <Link
                    to={`/profile/${activeConversation.otherParticipant.id}`}
                    style={{
                      textDecoration: "none",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {activeConversation.otherParticipant.name}
                  </Link>
                  <span
                    style={{
                      fontSize: 12,
                      color: typingUser
                        ? "var(--primary)"
                        : isUserOnline(activeConversation.otherParticipant.id)
                        ? "#16a34a"
                        : "var(--text-muted)",
                      fontWeight:
                        typingUser || isUserOnline(activeConversation.otherParticipant.id)
                          ? 600
                          : 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "block",
                    }}
                  >
                    {typingUser
                      ? `${typingUser} is typing...`
                      : isUserOnline(activeConversation.otherParticipant.id)
                      ? "Active now"
                      : activeConversation.otherParticipant.username
                      ? `@${activeConversation.otherParticipant.username}`
                      : "Offline"}
                  </span>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {/* Search In Chat */}
                <button
                  type="button"
                  title="Search in conversation"
                  aria-label="Search messages in this conversation"
                  onClick={() => search.setIsSearching((prev) => !prev)}
                  style={{
                    backgroundColor: search.isSearching ? "var(--primary)" : "var(--bg-hover)",
                    color: search.isSearching ? "#fff" : "var(--text-primary)",
                    border: "none",
                    borderRadius: "var(--radius-full)",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!search.isSearching) e.currentTarget.style.backgroundColor = "var(--border-color)";
                  }}
                  onMouseLeave={(e) => {
                    if (!search.isSearching) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  }}
                >
                  <SearchIcon size={15} />
                </button>

                {/* Shared Media, Links & Docs */}
                <button
                  type="button"
                  title="Media, links and docs"
                  aria-label="View media, links and documents"
                  onClick={() => setIsSharedMediaOpen(true)}
                  style={{
                    backgroundColor: "var(--bg-hover)",
                    color: "var(--text-primary)",
                    border: "none",
                    borderRadius: "var(--radius-full)",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--border-color)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                  }
                >
                  <SharedAssetsIcon size={15} />
                </button>

                {/* View Profile Action */}
                <Link
                  to={`/profile/${activeConversation.otherParticipant.id}`}
                  className="messages-header-profile-btn"
                  style={{
                    textDecoration: "none",
                    backgroundColor: "var(--bg-hover)",
                    color: "var(--text-primary)",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-full)",
                    fontSize: 12.5,
                    fontWeight: 600,
                    transition: "background-color 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--border-color)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                  }
                >
                  Profile
                </Link>
              </div>
            </div>

            {/* In-Chat Search Bar Toolbar */}
            <ChatSearchBar
              search={search}
              onOpenSharedMedia={() => setIsSharedMediaOpen(true)}
            />

            {/* Pinned Message Banner */}
            {(() => {
              const pinnedMsg = messages.find((m) => m.isPinned);
              if (!pinnedMsg) return null;
              return (
                <div
                  style={{
                    backgroundColor: "var(--bg-hover)",
                    borderBottom: "1px solid var(--border-color)",
                    padding: "7px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      overflow: "hidden",
                      cursor: "pointer",
                      flex: 1,
                      marginRight: 8,
                    }}
                    onClick={() => {
                      const el = document.getElementById(`msg-${pinnedMsg.id}`);
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    title="Click to view pinned message"
                  >
                    <span style={{ color: "#f59e0b", display: "inline-flex", flexShrink: 0 }}>
                      <PinIcon size={14} filled />
                    </span>
                    <strong style={{ color: "var(--text-primary)", flexShrink: 0 }}>Pinned:</strong>
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {pinnedMsg.content.slice(0, 80)}
                    </span>
                  </div>
                  {currentUser && (
                    <button
                      type="button"
                      onClick={() => togglePin(pinnedMsg.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    >
                      Unpin
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Messages Stream Container */}
            <div
              ref={messagesContainerRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px clamp(10px, 3vw, 20px)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                backgroundColor: "var(--bg-page)",
              }}
            >
              {/* Load older button */}
              {hasMoreMessages && (
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={handleLoadOlderMessages}
                    disabled={loadingMore}
                    style={{
                      background: "none",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-card)",
                      color: "var(--primary)",
                      padding: "6px 14px",
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: loadingMore ? "not-allowed" : "pointer",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {loadingMore ? "Loading..." : "Load older messages"}
                  </button>
                </div>
              )}

              {loadingMessages ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 200,
                    color: "var(--text-muted)",
                    fontSize: 14,
                  }}
                >
                  Loading conversation...
                </div>
              ) : messages.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    margin: "auto",
                    color: "var(--text-muted)",
                    fontSize: 14,
                    maxWidth: 280,
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 10 }}>👋</div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 4,
                    }}
                  >
                    Say hello to {activeConversation.otherParticipant.name}!
                  </div>
                  <div>No messages here yet. Send a message below.</div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = currentUser
                    ? msg.senderUserId === currentUser.id
                    : msg.isMine;
                  const isEditingThis = editingMessageId === msg.id;
                  const isCurrentMatch = search.isCurrentMatch(msg.id);
                  const isMatchingMsg = search.isMatching(msg.id);
                  const parsed = parseRichText(msg.content, {
                    linkColor: isMine ? "#e0f2fe" : "var(--primary)",
                    hidePureMediaUrl: true,
                    searchQuery: search.isSearching ? search.searchQuery : undefined,
                    isCurrentMatch,
                  });
                  const isPureMedia = !msg.isDeleted && parsed.isPureMedia;

                  return (
                    <div
                      key={msg.id || index}
                      id={`msg-${msg.id}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMine ? "flex-end" : "flex-start",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: 8,
                          maxWidth: "70%",
                          flexDirection: isMine ? "row-reverse" : "row",
                        }}
                      >
                        {/* Other User Avatar snippet */}
                        {!isMine && (
                          <Avatar
                            src={msg.senderAvatarUrl}
                            name={msg.senderName}
                            size={28}
                            fontSize={11}
                          />
                        )}

                        {/* Message Bubble */}
                            <div
                              style={{
                                padding: isPureMedia
                                  ? "0"
                                  : msg.isDeleted
                                  ? "8px 14px"
                                  : "10px 16px",
                                borderRadius: isMine
                                  ? "18px 18px 4px 18px"
                                  : "18px 18px 18px 4px",
                                backgroundColor: msg.isDeleted
                                  ? "var(--bg-hover)"
                                  : isPureMedia
                                  ? "transparent"
                                  : isMine
                                  ? "var(--primary)"
                                  : "var(--bg-card)",
                                color: msg.isDeleted
                                  ? "var(--text-muted)"
                                  : isMine
                                  ? "#fff"
                                  : "var(--text-primary)",
                                fontSize: 14,
                                lineHeight: "20px",
                                wordBreak: "break-word",
                                boxShadow: isCurrentMatch
                                  ? "0 0 0 2.5px #eab308, var(--shadow-sm)"
                                  : isMatchingMsg
                                  ? "0 0 0 1.5px rgba(234, 179, 8, 0.45)"
                                  : isPureMedia
                                  ? "none"
                                  : "var(--shadow-sm)",
                                transition: "box-shadow 0.2s ease",
                                fontStyle: msg.isDeleted ? "italic" : "normal",
                                border: msg.isDeleted
                                  ? "1px dashed var(--border-color)"
                                  : isPureMedia
                                  ? "none"
                                  : !isMine
                                  ? "1px solid var(--border-color)"
                                  : "none",
                                position: "relative",
                                maxWidth: "100%",
                              }}
                            >
                              {isEditingThis ? (
                                <MessageEditBox
                                  value={editText}
                                  onChange={setEditText}
                                  onSave={() => saveEdit(msg.id)}
                                  onCancel={cancelEdit}
                                  isSaving={isSavingEdit}
                                  isMine={isMine}
                                />
                              ) : (
                                /* Normal Message Content */
                                <div>
                                  {/* Parsed Text with Clickable Links */}
                                  {parsed.nodes.length > 0 && (
                                    <div>
                                      {parsed.nodes}
                                      {/* (edited) tag */}
                                      {msg.updatedAt && !msg.isDeleted && (
                                        <span
                                          style={{
                                            fontSize: 11,
                                            opacity: 0.75,
                                            marginLeft: 6,
                                          }}
                                        >
                                          (edited)
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Embedded Attachments (Images, Videos, Files, GIFs) */}
                                  {!msg.isDeleted &&
                                    parsed.attachments &&
                                    parsed.attachments.length > 0 && (
                                      <div
                                        style={{
                                          marginTop:
                                            parsed.nodes.length > 0 ? 8 : 0,
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 6,
                                        }}
                                      >
                                        {parsed.attachments.map((att, attIdx) => (
                                          <ChatAttachmentBubble
                                            key={attIdx}
                                            attachment={att}
                                            isMine={isMine}
                                            isPureMedia={isPureMedia}
                                            onImageClick={(url) => {
                                              setLightboxImages([url]);
                                              setIsLightboxOpen(true);
                                            }}
                                            onMediaLoaded={() =>
                                              scrollToBottom(false)
                                            }
                                          />
                                        ))}
                                      </div>
                                    )}

                                  {/* (edited) tag if pure media was edited */}
                                  {msg.updatedAt && !msg.isDeleted && parsed.nodes.length === 0 && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        opacity: 0.75,
                                        marginTop: 4,
                                        display: "inline-block",
                                      }}
                                    >
                                      (edited)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                        {/* Actions (Three-Dots Menu: Pin / Edit / Delete) */}
                        {!msg.isDeleted && !isEditingThis && (
                          <MessageActionsMenu
                            align={isMine ? "right" : "left"}
                            isPinned={Boolean(msg.isPinned)}
                            canEdit={isMine && !isPureMedia}
                            onTogglePin={() => togglePin(msg.id)}
                            onEdit={isMine ? () => startEdit(msg) : undefined}
                            onDelete={isMine ? () => promptDelete(msg.id) : undefined}
                          />
                        )}
                      </div>

                      {/* Timestamp & Pin Indicator */}
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 3,
                          marginRight: isMine ? 4 : 0,
                          marginLeft: !isMine ? 36 : 0,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {msg.isPinned && (
                          <span
                            title="Pinned message"
                            style={{ color: "#f59e0b", display: "inline-flex" }}
                          >
                            <PinIcon size={11} filled />
                          </span>
                        )}
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Typing indicator bounce */}
              {typingUser && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      padding: "8px 16px",
                      borderRadius: "18px 18px 18px 4px",
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-secondary)",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: "var(--shadow-sm)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {typingUser}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      is typing
                    </span>
                    <span className="typing-dots">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </span>
                  </div>
                </div>
              )}

              {/* Seen indicator under last own message */}
              {(() => {
                if (messages.length === 0) return null;
                const lastMsg = messages[messages.length - 1];
                const isMine = currentUser
                  ? lastMsg.senderUserId === currentUser.id
                  : lastMsg.isMine;
                if (!isMine) return null;

                return (
                  <div style={{ textAlign: "right", marginTop: 2 }}>
                    <MessageStatus
                      isSeen={isMessageSeen(lastMsg.createdAt)}
                      variant="check"
                    />
                  </div>
                );
              })()}

              <div ref={messagesEndRef} />
            </div>

            {/* Staged Attachments Preview Bar */}
            <ChatAttachmentStaging
              stagedAttachments={stagedAttachments}
              onRemove={removeStagedAttachment}
              isUploading={isSending}
            />

            {/* Chat Bottom Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="messages-input-form"
              style={{
                padding: "10px clamp(8px, 2.5vw, 16px)",
                paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))",
                backgroundColor: "var(--bg-card)",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                position: "relative",
              }}
            >
              {/* GIF Picker Popover */}
              {isGifPickerOpen && (
                <GifPicker
                  onSelectGif={handleSendGif}
                  onClose={() => setIsGifPickerOpen(false)}
                />
              )}

              {/* Hidden File Input for Paperclip Attachments */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
              />

              {/* Attachment Picker Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach photo, video, or document"
                aria-label="Attach files or media"
                disabled={isSending}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
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
                <PaperclipIcon size={18} />
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder={
                  stagedAttachments.length > 0
                    ? "Add a caption (optional)..."
                    : "Type a message or paste a link/GIF..."
                }
                value={inputText}
                onChange={handleInputChange}

                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "10px 14px",
                  borderRadius: 22,
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-hover)",
                  color: "var(--text-primary)",
                  fontSize: 15,
                  outline: "none",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--primary)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border-color)")
                }
              />

              {/* GIF Picker Toggle Button */}
              <button
                type="button"
                onClick={() => setIsGifPickerOpen((prev) => !prev)}
                title="Choose a GIF"
                aria-label="Choose a GIF"
                style={{
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 19,
                  backgroundColor: isGifPickerOpen
                    ? "var(--primary-light)"
                    : "var(--bg-hover)",
                  color: isGifPickerOpen
                    ? "var(--primary)"
                    : "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isGifPickerOpen) {
                    e.currentTarget.style.backgroundColor = "var(--border-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGifPickerOpen) {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  }
                }}
              >
                GIF
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={
                  isSending ||
                  (!inputText.trim() && stagedAttachments.length === 0)
                }
                aria-label="Send message"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor:
                    (inputText.trim() || stagedAttachments.length > 0) &&
                    !isSending
                      ? "var(--primary)"
                      : "var(--bg-hover)",
                  color:
                    (inputText.trim() || stagedAttachments.length > 0) &&
                    !isSending
                      ? "#fff"
                      : "var(--text-muted)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor:
                    (inputText.trim() || stagedAttachments.length > 0) &&
                    !isSending
                      ? "pointer"
                      : "not-allowed",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                {isSending ? (
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Lightbox for full-size GIF / image viewing */}
      <LightboxModal
        isOpen={isLightboxOpen}
        images={lightboxImages}
        onClose={() => {
          setIsLightboxOpen(false);
          setLightboxImages([]);
        }}
      />

      <DeleteMessageModal
        isOpen={messageToDeleteId !== null}
        isDeleting={isDeletingMessage}
        error={deleteMessageError}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />

      {/* Shared Media, Links & Docs Drawer */}
      {activeConversation && (
        <SharedMediaModal
          isOpen={isSharedMediaOpen}
          onClose={() => setIsSharedMediaOpen(false)}
          conversationId={activeConversation.id}
          partnerName={activeConversation.otherParticipant.name}
        />
      )}
    </div>
  );
}
