import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { chatApi } from "../api/chat";
import { formatRelativeTime } from "../utils/time";
import { parseRichText, formatMessageSnippet } from "../utils/richText";
import { GifPicker } from "../components/chat/GifPicker";
import { LightboxModal } from "../components/LightboxModal";
import { Avatar } from "../components/Avatar";
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
    onUserTyping,
    onMessagesRead,
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

  // Input & Sending
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // GIF Picker & Lightbox
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Editing state: messageId -> boolean
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete message confirmation modal state
  const [messageToDeleteId, setMessageToDeleteId] = useState<number | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [deleteMessageError, setDeleteMessageError] = useState<string | null>(null);

  // Typing state of the other participant
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTypingSendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Read status for own last message
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

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

    // 5. Read receipt
    const unsubRead = onMessagesRead((event) => {
      if (event.conversationId === selectedId) {
        setLastReadTimestamp(event.readAt);
      }
    });

    return () => {
      unsubReceive();
      unsubEdited();
      unsubDeleted();
      unsubTyping();
      unsubRead();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [
    selectedId,
    onReceiveMessage,
    onMessageEdited,
    onMessageDeleted,
    onUserTyping,
    onMessagesRead,
    refreshUnreadCount,
    scrollToBottom,
  ]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedId || !inputText.trim() || isSending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Stop typing notification
    sendTyping(selectedId, false);

    try {
      const created = await chatApi.sendMessage(selectedId, textToSend);

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

      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      console.error("Failed to send message:", err);
      // restore text on error
      setInputText(textToSend);
    } finally {
      setIsSending(false);
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

  // Start editing a message
  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditText(msg.content);
  };

  // Save edited message
  const handleSaveEdit = async (messageId: number) => {
    if (!selectedId || !editText.trim() || isSavingEdit) return;

    setIsSavingEdit(true);
    try {
      const updated = await chatApi.editMessage(
        selectedId,
        messageId,
        editText.trim()
      );

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...updated, isMine: true } : m))
      );
      setEditingMessageId(null);
      setEditText("");
    } catch (err) {
      console.error("Failed to edit message:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open delete message confirmation modal
  const handlePromptDeleteMessage = (messageId: number) => {
    setDeleteMessageError(null);
    setMessageToDeleteId(messageId);
  };

  // Confirm delete message
  const handleConfirmDeleteMessage = async () => {
    if (!selectedId || !messageToDeleteId) return;

    setIsDeletingMessage(true);
    setDeleteMessageError(null);

    try {
      await chatApi.deleteMessage(selectedId, messageToDeleteId);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageToDeleteId
            ? {
                ...m,
                content: "This message was deleted",
                isDeleted: true,
                updatedAt: new Date().toISOString(),
              }
            : m
        )
      );
      setMessageToDeleteId(null);
    } catch (err: unknown) {
      console.error("Failed to delete message:", err);
      setDeleteMessageError("Failed to delete message. Please try again.");
    } finally {
      setIsDeletingMessage(false);
    }
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
      style={{
        display: "flex",
        height: "calc(100vh - 61px)",
        backgroundColor: "var(--bg-page)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        overflow: "hidden",
      }}
    >
      {/* LEFT SIDEBAR: Conversations List */}
      <div
        style={{
          width: 360,
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
                style={{
                  border: "none",
                  background: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: 0,
                }}
              >
                ✕
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
                  <Avatar src={other.avatarUrl} name={other.name} size={48} />

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
            {/* Chat Top Header */}
            <div
              style={{
                padding: "10px 20px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "var(--bg-card)",
                boxShadow: "var(--shadow-sm)",
                zIndex: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Link
                  to={`/profile/${activeConversation.otherParticipant.id}`}
                  style={{ textDecoration: "none", flexShrink: 0 }}
                >
                  <Avatar
                    src={activeConversation.otherParticipant.avatarUrl}
                    name={activeConversation.otherParticipant.name}
                    size={42}
                  />
                </Link>

                <div>
                  <Link
                    to={`/profile/${activeConversation.otherParticipant.id}`}
                    style={{
                      textDecoration: "none",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      display: "block",
                    }}
                  >
                    {activeConversation.otherParticipant.name}
                  </Link>
                  <span
                    style={{
                      fontSize: 12,
                      color: typingUser ? "var(--primary)" : "var(--text-muted)",
                      fontWeight: typingUser ? 600 : 400,
                    }}
                  >
                    {typingUser
                      ? `${typingUser} is typing...`
                      : activeConversation.otherParticipant.username
                      ? `@${activeConversation.otherParticipant.username}`
                      : "Active on Marbook"}
                  </span>
                </div>
              </div>

              {/* View Profile Action */}
              <Link
                to={`/profile/${activeConversation.otherParticipant.id}`}
                style={{
                  textDecoration: "none",
                  backgroundColor: "var(--bg-hover)",
                  color: "var(--text-primary)",
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--border-color)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                }
              >
                View Profile
              </Link>
            </div>

            {/* Messages Stream Container */}
            <div
              ref={messagesContainerRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
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

                  return (
                    <div
                      key={msg.id || index}
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
                        {(() => {
                          const parsed = parseRichText(msg.content, {
                            linkColor: isMine ? "#e0f2fe" : "var(--primary)",
                            hidePureMediaUrl: true,
                          });
                          const isPureMedia = !msg.isDeleted && parsed.isPureMedia;

                          return (
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
                                boxShadow: isPureMedia
                                  ? "none"
                                  : "var(--shadow-sm)",
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
                                /* Inline Edit Mode */
                                <div style={{ minWidth: 220 }}>
                                  <input
                                    type="text"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleSaveEdit(msg.id);
                                      } else if (e.key === "Escape") {
                                        setEditingMessageId(null);
                                      }
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: "6px 10px",
                                      borderRadius: 6,
                                      border: "1px solid var(--border-color)",
                                      backgroundColor: "var(--bg-hover)",
                                      color: "var(--text-primary)",
                                      fontSize: 14,
                                      outline: "none",
                                      marginBottom: 6,
                                    }}
                                  />
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      gap: 6,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setEditingMessageId(null)}
                                      style={{
                                        border: "none",
                                        background: "none",
                                        color: isMine ? "#fff" : "var(--text-muted)",
                                        fontSize: 12,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEdit(msg.id)}
                                      disabled={isSavingEdit || !editText.trim()}
                                      style={{
                                        backgroundColor: isMine
                                          ? "#fff"
                                          : "var(--primary)",
                                        color: isMine
                                          ? "var(--primary)"
                                          : "#fff",
                                        border: "none",
                                        borderRadius: 4,
                                        padding: "3px 8px",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
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

                                  {/* Embedded Media/GIF if message contains media */}
                                  {!msg.isDeleted && parsed.mediaUrls.length > 0 && (
                                    <div
                                      style={{
                                        marginTop: parsed.nodes.length > 0 ? 8 : 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 6,
                                      }}
                                    >
                                      {parsed.mediaUrls.map((mUrl, mIdx) => (
                                        <div
                                          key={mIdx}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxImages([mUrl]);
                                            setIsLightboxOpen(true);
                                          }}
                                          title="Click to view full size"
                                          style={{
                                            position: "relative",
                                            borderRadius: isPureMedia ? 16 : 12,
                                            overflow: "hidden",
                                            maxWidth: 320,
                                            cursor: "pointer",
                                            backgroundColor: "rgba(0,0,0,0.12)",
                                            border: isPureMedia
                                              ? "1px solid var(--border-color)"
                                              : "none",
                                            boxShadow: isPureMedia
                                              ? "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.18))"
                                              : "none",
                                          }}
                                        >
                                          <img
                                            src={mUrl}
                                            alt="Shared media"
                                            loading="lazy"
                                            style={{
                                              maxWidth: "100%",
                                              maxHeight: 280,
                                              objectFit: "contain",
                                              display: "block",
                                              borderRadius: isPureMedia ? 16 : 12,
                                            }}
                                          />
                                          <span
                                            style={{
                                              position: "absolute",
                                              bottom: 6,
                                              left: 6,
                                              backgroundColor: "rgba(0,0,0,0.72)",
                                              color: "#fff",
                                              fontSize: 10,
                                              fontWeight: 700,
                                              padding: "2px 6px",
                                              borderRadius: 4,
                                              letterSpacing: "0.5px",
                                              pointerEvents: "none",
                                              backdropFilter: "blur(2px)",
                                            }}
                                          >
                                            GIF
                                          </span>
                                        </div>
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
                          );
                        })()}

                        {/* Author Actions (Edit / Delete) */}
                        {isMine && !msg.isDeleted && !isEditingThis && (
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              opacity: 0.8,
                              transition: "opacity 0.15s ease",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleStartEdit(msg)}
                              title="Edit message"
                              style={{
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                padding: "2px 4px",
                                fontSize: 13,
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePromptDeleteMessage(msg.id)}
                              title="Delete message"
                              style={{
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                padding: "2px 4px",
                                fontSize: 13,
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 3,
                          marginRight: isMine ? 4 : 0,
                          marginLeft: !isMine ? 36 : 0,
                        }}
                      >
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
              {lastReadTimestamp && messages.length > 0 && messages[messages.length - 1].isMine && (
                <div
                  style={{
                    textAlign: "right",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  ✓ Seen
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Bottom Input Bar */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: "12px 20px",
                backgroundColor: "var(--bg-card)",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                gap: 10,
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

              <input
                type="text"
                placeholder="Type a message or paste a link/GIF..."
                value={inputText}
                onChange={handleInputChange}
                disabled={isSending}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 22,
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-hover)",
                  color: "var(--text-primary)",
                  fontSize: 14,
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
                disabled={isSending || !inputText.trim()}
                aria-label="Send message"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor:
                    inputText.trim() && !isSending
                      ? "var(--primary)"
                      : "var(--bg-hover)",
                  color:
                    inputText.trim() && !isSending
                      ? "#fff"
                      : "var(--text-muted)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor:
                    inputText.trim() && !isSending ? "pointer" : "not-allowed",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
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

      {/* Delete Message Confirmation Modal */}
      {messageToDeleteId !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--modal-overlay)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => !isDeletingMessage && setMessageToDeleteId(null)}
        >
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              borderRadius: 10,
              maxWidth: 420,
              width: "100%",
              padding: "24px 24px 20px",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Delete Message?
            </h3>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.4,
              }}
            >
              Are you sure you want to delete this message? This action cannot be
              undone and will replace the message with &ldquo;This message was deleted&rdquo;.
            </p>

            {deleteMessageError && (
              <div
                style={{
                  backgroundColor: "#fde8e8",
                  color: "#9b1c1c",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {deleteMessageError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setMessageToDeleteId(null)}
                disabled={isDeletingMessage}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-hover)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isDeletingMessage ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteMessage}
                disabled={isDeletingMessage}
                style={{
                  padding: "8px 18px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "#e02424",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isDeletingMessage ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {isDeletingMessage ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
