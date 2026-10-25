import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { useAuth } from "./AuthContext";
import { chatApi } from "../api/chat";
import type {
  ConversationSummary,
  ChatUnreadCount,
  Message,
  TypingEvent,
  ReadReceiptEvent,
} from "../types/chat";

interface ChatContextType {
  unreadChatCount: ChatUnreadCount;
  setUnreadChatCount: React.Dispatch<React.SetStateAction<ChatUnreadCount>>;
  activeConversationId: number | null;
  setActiveConversationId: (id: number | null) => void;
  floatingConversationId: number | null;
  setFloatingConversationId: (id: number | null) => void;
  isFloatingMinimized: boolean;
  setIsFloatingMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  openFloatingChat: (id: number) => void;
  closeFloatingChat: () => void;
  conversations: ConversationSummary[];
  setConversations: React.Dispatch<React.SetStateAction<ConversationSummary[]>>;
  refreshConversations: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  connectionState: HubConnectionState;
  joinConversation: (id: number) => Promise<void>;
  leaveConversation: (id: number) => Promise<void>;
  sendTyping: (conversationId: number, isTyping: boolean) => Promise<void>;
  onReceiveMessage: (listener: (msg: Message) => void) => () => void;
  onMessageEdited: (listener: (msg: Message) => void) => () => void;
  onMessageDeleted: (
    listener: (data: {
      conversationId: number;
      messageId: number;
      content: string;
      isDeleted: boolean;
      updatedAt?: string;
    }) => void
  ) => () => void;
  onUserTyping: (listener: (event: TypingEvent) => void) => () => void;
  onMessagesRead: (listener: (event: ReadReceiptEvent) => void) => () => void;
  onConversationUpdated: (
    listener: (summary: ConversationSummary) => void
  ) => () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const BACKEND_BASE = "http://localhost:5244";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const [unreadChatCount, setUnreadChatCount] = useState<ChatUnreadCount>({
    totalUnreadMessages: 0,
    unreadConversationsCount: 0,
  });
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [floatingConversationId, setFloatingConversationId] = useState<
    number | null
  >(null);
  const [isFloatingMinimized, setIsFloatingMinimized] = useState(false);

  const openFloatingChat = useCallback((id: number) => {
    setFloatingConversationId(id);
    setIsFloatingMinimized(false);
  }, []);

  const closeFloatingChat = useCallback(() => {
    setFloatingConversationId(null);
    setIsFloatingMinimized(false);
  }, []);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    HubConnectionState.Disconnected
  );

  const connectionRef = useRef<HubConnection | null>(null);
  const activeConversationIdRef = useRef<number | null>(null);
  activeConversationIdRef.current = activeConversationId;
  const joinedConversationIdRef = useRef<number | null>(null);

  // Listener sets
  const receiveMessageListeners = useRef<Set<(msg: Message) => void>>(
    new Set()
  );
  const messageEditedListeners = useRef<Set<(msg: Message) => void>>(new Set());
  const messageDeletedListeners = useRef<
    Set<
      (data: {
        conversationId: number;
        messageId: number;
        content: string;
        isDeleted: boolean;
        updatedAt?: string;
      }) => void
    >
  >(new Set());
  const userTypingListeners = useRef<Set<(event: TypingEvent) => void>>(
    new Set()
  );
  const messagesReadListeners = useRef<Set<(event: ReadReceiptEvent) => void>>(
    new Set()
  );
  const conversationUpdatedListeners = useRef<
    Set<(summary: ConversationSummary) => void>
  >(new Set());

  // Subscribe helpers
  const onReceiveMessage = useCallback((listener: (msg: Message) => void) => {
    receiveMessageListeners.current.add(listener);
    return () => {
      receiveMessageListeners.current.delete(listener);
    };
  }, []);

  const onMessageEdited = useCallback((listener: (msg: Message) => void) => {
    messageEditedListeners.current.add(listener);
    return () => {
      messageEditedListeners.current.delete(listener);
    };
  }, []);

  const onMessageDeleted = useCallback(
    (
      listener: (data: {
        conversationId: number;
        messageId: number;
        content: string;
        isDeleted: boolean;
        updatedAt?: string;
      }) => void
    ) => {
      messageDeletedListeners.current.add(listener);
      return () => {
        messageDeletedListeners.current.delete(listener);
      };
    },
    []
  );

  const onUserTyping = useCallback((listener: (event: TypingEvent) => void) => {
    userTypingListeners.current.add(listener);
    return () => {
      userTypingListeners.current.delete(listener);
    };
  }, []);

  const onMessagesRead = useCallback(
    (listener: (event: ReadReceiptEvent) => void) => {
      messagesReadListeners.current.add(listener);
      return () => {
        messagesReadListeners.current.delete(listener);
      };
    },
    []
  );

  const onConversationUpdated = useCallback(
    (listener: (summary: ConversationSummary) => void) => {
      conversationUpdatedListeners.current.add(listener);
      return () => {
        conversationUpdatedListeners.current.delete(listener);
      };
    },
    []
  );

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await chatApi.getUnreadCount();
      setUnreadChatCount(data);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  // Initial fetch on login
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadChatCount({
        totalUnreadMessages: 0,
        unreadConversationsCount: 0,
      });
      setConversations([]);
      return;
    }

    refreshUnreadCount();
    refreshConversations();
  }, [isAuthenticated, refreshUnreadCount, refreshConversations]);

  // SignalR Hub Connection - only reconnects on auth change
  useEffect(() => {
    if (!isAuthenticated) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      setConnectionState(HubConnectionState.Disconnected);
      return;
    }

    const token = localStorage.getItem("token") || "";
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${BACKEND_BASE}/hubs/chat`, {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    connectionRef.current = connection;

    connection.on("ReceiveMessage", (msg: Message) => {
      const isMine = currentUserRef.current
        ? msg.senderUserId === currentUserRef.current.id
        : msg.isMine;

      const normalizedMsg = { ...msg, isMine };

      // 1. Dispatch to message stream listeners
      receiveMessageListeners.current.forEach((listener) => {
        try {
          listener(normalizedMsg);
        } catch (err) {
          console.error("ReceiveMessage listener error:", err);
        }
      });

      const isViewingThis =
        activeConversationIdRef.current === msg.conversationId;

      // 2. Update conversation list preview
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === msg.conversationId);
        if (index === -1) {
          refreshConversations();
          return prev;
        }
        const updated = [...prev];
        const conv = { ...updated[index] };
        conv.lastMessage = normalizedMsg;
        conv.updatedAt = msg.createdAt;

        if (!isMine && isViewingThis) {
          conv.unreadCount = 0;
          chatApi.markAsRead(msg.conversationId).catch(() => {});
        } else if (!isMine && !isViewingThis) {
          conv.unreadCount += 1;
        }

        // Move updated conversation to top
        updated.splice(index, 1);
        return [conv, ...updated];
      });

      // 3. Update global unread badge if not currently active
      if (!isMine && !isViewingThis) {
        setUnreadChatCount((prev) => ({
          totalUnreadMessages: prev.totalUnreadMessages + 1,
          unreadConversationsCount: prev.unreadConversationsCount + 1,
        }));
      }
    });

    connection.on("MessageEdited", (msg: Message) => {
      const isMine = currentUserRef.current
        ? msg.senderUserId === currentUserRef.current.id
        : msg.isMine;

      const normalizedMsg = { ...msg, isMine };

      messageEditedListeners.current.forEach((listener) => {
        try {
          listener(normalizedMsg);
        } catch (err) {
          console.error("MessageEdited listener error:", err);
        }
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === msg.conversationId && c.lastMessage?.id === msg.id) {
            return { ...c, lastMessage: normalizedMsg };
          }
          return c;
        })
      );
    });

    connection.on(
      "MessageDeleted",
      (data: {
        conversationId: number;
        messageId: number;
        content: string;
        isDeleted: boolean;
        updatedAt?: string;
      }) => {
        messageDeletedListeners.current.forEach((listener) => {
          try {
            listener(data);
          } catch (err) {
            console.error("MessageDeleted listener error:", err);
          }
        });

        setConversations((prev) =>
          prev.map((c) => {
            if (
              c.id === data.conversationId &&
              c.lastMessage?.id === data.messageId
            ) {
              return {
                ...c,
                lastMessage: {
                  ...c.lastMessage,
                  content: data.content,
                  isDeleted: true,
                },
              };
            }
            return c;
          })
        );
      }
    );

    connection.on("UserTyping", (event: TypingEvent) => {
      userTypingListeners.current.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error("UserTyping listener error:", err);
        }
      });
    });

    connection.on("MessagesRead", (event: ReadReceiptEvent) => {
      messagesReadListeners.current.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error("MessagesRead listener error:", err);
        }
      });
    });

    connection.on("ConversationUpdated", (summary: ConversationSummary) => {
      // Normalize lastMessage isMine using currentUser
      if (summary.lastMessage && currentUserRef.current) {
        summary.lastMessage.isMine =
          summary.lastMessage.senderUserId === currentUserRef.current.id;
      }

      const isViewingThis =
        summary.id === activeConversationIdRef.current;

      if (isViewingThis) {
        summary.unreadCount = 0;
        chatApi
          .markAsRead(summary.id)
          .then(() => refreshUnreadCount())
          .catch(() => {});
      }

      conversationUpdatedListeners.current.forEach((listener) => {
        try {
          listener(summary);
        } catch (err) {
          console.error("ConversationUpdated listener error:", err);
        }
      });

      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== summary.id);
        return [summary, ...filtered];
      });

      // Deliver last message to active room if open
      if (summary.lastMessage && isViewingThis) {
        receiveMessageListeners.current.forEach((listener) => {
          try {
            listener(summary.lastMessage!);
          } catch (err) {
            console.error("ConversationUpdated fallback error:", err);
          }
        });
      }

      if (!isViewingThis) {
        refreshUnreadCount();
      }
    });

    connection
      .start()
      .then(() => {
        setConnectionState(connection.state);
        if (joinedConversationIdRef.current) {
          connection
            .invoke("JoinConversation", joinedConversationIdRef.current)
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.warn("SignalR ChatHub connection failed:", err);
        setConnectionState(connection.state);
      });

    connection.onreconnecting(() => {
      setConnectionState(HubConnectionState.Reconnecting);
    });

    connection.onreconnected(() => {
      setConnectionState(HubConnectionState.Connected);
      refreshUnreadCount();
      refreshConversations();
      if (joinedConversationIdRef.current) {
        connection
          .invoke("JoinConversation", joinedConversationIdRef.current)
          .catch(() => {});
      }
    });

    connection.onclose(() => {
      setConnectionState(HubConnectionState.Disconnected);
    });

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, [isAuthenticated, refreshConversations, refreshUnreadCount]);

  const joinConversation = useCallback(async (id: number) => {
    joinedConversationIdRef.current = id;
    if (connectionRef.current?.state === HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke("JoinConversation", id);
      } catch (err) {
        console.warn(`Failed to join conversation ${id}:`, err);
      }
    }
  }, []);

  const leaveConversation = useCallback(async (id: number) => {
    if (joinedConversationIdRef.current === id) {
      joinedConversationIdRef.current = null;
    }
    if (connectionRef.current?.state === HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke("LeaveConversation", id);
      } catch (err) {
        console.warn(`Failed to leave conversation ${id}:`, err);
      }
    }
  }, []);

  const sendTyping = useCallback(
    async (conversationId: number, isTyping: boolean) => {
      if (connectionRef.current?.state === HubConnectionState.Connected) {
        try {
          await connectionRef.current.invoke(
            "SendTyping",
            conversationId,
            isTyping
          );
        } catch {
          // ignore
        }
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      unreadChatCount,
      setUnreadChatCount,
      activeConversationId,
      setActiveConversationId,
      floatingConversationId,
      setFloatingConversationId,
      isFloatingMinimized,
      setIsFloatingMinimized,
      openFloatingChat,
      closeFloatingChat,
      conversations,
      setConversations,
      refreshConversations,
      refreshUnreadCount,
      connectionState,
      joinConversation,
      leaveConversation,
      sendTyping,
      onReceiveMessage,
      onMessageEdited,
      onMessageDeleted,
      onUserTyping,
      onMessagesRead,
      onConversationUpdated,
    }),
    [
      unreadChatCount,
      activeConversationId,
      floatingConversationId,
      isFloatingMinimized,
      openFloatingChat,
      closeFloatingChat,
      conversations,
      connectionState,
      refreshConversations,
      refreshUnreadCount,
      joinConversation,
      leaveConversation,
      sendTyping,
      onReceiveMessage,
      onMessageEdited,
      onMessageDeleted,
      onUserTyping,
      onMessagesRead,
      onConversationUpdated,
    ]
  );

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
