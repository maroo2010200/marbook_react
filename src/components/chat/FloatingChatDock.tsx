import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { chatApi } from "../../api/chat";
import { Avatar } from "../Avatar";
import { formatRelativeTime } from "../../utils/time";
import { parseRichText } from "../../utils/richText";
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
  } = useChat();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [conversationDetails, setConversationDetails] = useState<ConversationSummary | null>(null);

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

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending || !floatingConversationId) return;

    setIsSending(true);
    setInputText("");
    inputRef.current?.focus();

    try {
      if (userTypingSendTimeoutRef.current) {
        clearTimeout(userTypingSendTimeoutRef.current);
        userTypingSendTimeoutRef.current = null;
        sendTyping(floatingConversationId, false).catch(() => {});
      }

      const newMsg = await chatApi.sendMessage(floatingConversationId, trimmed);
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        return [...prev, { ...newMsg, isMine: true }];
      });
      refreshConversations().catch(() => {});
    } catch (err) {
      console.error("Failed to send floating chat message:", err);
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
      style={{
        position: "fixed",
        bottom: 0,
        right: 24,
        zIndex: 1000,
        width: 330,
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
            <span
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
              {isOtherTyping ? "Typing..." : "Active now"}
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
          messages.map((m) => {
            const isMine = m.isMine;
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
                  {parseRichText(m.content).nodes}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-tertiary)",
                    marginTop: 2,
                    padding: "0 4px",
                  }}
                >
                  {formatRelativeTime(m.createdAt)}
                </span>
              </div>
            );
          })
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

      {/* Input Composer */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: "8px 10px",
          borderTop: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-card)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a message..."
          style={{
            flex: 1,
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
          disabled={!inputText.trim() || isSending}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: inputText.trim() ? "var(--primary)" : "var(--bg-hover)",
            color: inputText.trim() ? "#ffffff" : "var(--text-tertiary)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: inputText.trim() && !isSending ? "pointer" : "default",
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
        >
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
        </button>
      </form>
    </div>
  );
}
