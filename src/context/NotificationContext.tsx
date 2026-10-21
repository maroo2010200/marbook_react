import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { useAuth } from "./AuthContext";
import { notificationsApi } from "../api/notifications";
import type { NotificationItem } from "../types/notifications";

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  toastNotification: NotificationItem | null;
  clearToast: () => void;
  connectionState: HubConnectionState;
  subscribeToNotifications: (
    listener: (notification: NotificationItem) => void
  ) => () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const BACKEND_BASE = "http://localhost:5244";

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toastNotification, setToastNotification] =
    useState<NotificationItem | null>(null);
  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    HubConnectionState.Disconnected
  );

  const connectionRef = useRef<HubConnection | null>(null);
  const listenersRef = useRef<Set<(notification: NotificationItem) => void>>(
    new Set()
  );
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastNotification(null);
  }, []);

  const subscribeToNotifications = useCallback(
    (listener: (notification: NotificationItem) => void) => {
      listenersRef.current.add(listener);
      return () => {
        listenersRef.current.delete(listener);
      };
    },
    []
  );

  // Initial fetch of unread count when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;
    notificationsApi
      .getUnreadCount()
      .then((count) => {
        if (isMounted) setUnreadCount(count);
      })
      .catch(() => {
        // ignore
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Connect to SignalR Hub
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
      .withUrl(`${BACKEND_BASE}/hubs/notifications`, {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    connectionRef.current = connection;

    connection.on(
      "ReceiveNotification",
      (dto: NotificationItem, count?: number) => {
        // 1. Update unread count
        if (typeof count === "number") {
          setUnreadCount(count);
        } else {
          setUnreadCount((prev) => prev + 1);
        }

        // 2. Dispatch to registered listeners (e.g., active dropdown list)
        listenersRef.current.forEach((listener) => {
          try {
            listener(dto);
          } catch (err) {
            console.error("Notification listener error:", err);
          }
        });

        // 3. Trigger live floating toast banner
        setToastNotification(dto);
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = setTimeout(() => {
          setToastNotification(null);
        }, 5000);
      }
    );

    connection.on(
      "NotificationDeleted",
      (_id: number, count?: number) => {
        if (typeof count === "number") {
          setUnreadCount(count);
        } else {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    );

    connection
      .start()
      .then(() => {
        setConnectionState(connection.state);
      })
      .catch((err) => {
        console.warn("SignalR connection failed:", err);
        setConnectionState(connection.state);
      });

    connection.onreconnecting(() => {
      setConnectionState(HubConnectionState.Reconnecting);
    });

    connection.onreconnected(() => {
      setConnectionState(HubConnectionState.Connected);
      // Re-fetch latest unread count upon reconnect
      notificationsApi.getUnreadCount().then(setUnreadCount).catch(() => {});
    });

    connection.onclose(() => {
      setConnectionState(HubConnectionState.Disconnected);
    });

    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      connection.stop();
      connectionRef.current = null;
    };
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        toastNotification,
        clearToast,
        connectionState,
        subscribeToNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
