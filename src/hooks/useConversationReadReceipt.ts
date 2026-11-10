import { useState, useEffect, useCallback } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

/**
 * Hook to manage conversation read receipt tracking and message seen status.
 * Automatically synchronizes with initial conversation state and live SignalR read receipts.
 */
export function useConversationReadReceipt(
  conversationId: number | null,
  otherParticipantLastReadAt?: string | null
) {
  const { onMessagesRead } = useChat();
  const { user: currentUser } = useAuth();
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(null);

  // Reset when conversation changes
  useEffect(() => {
    setLastReadTimestamp(null);
  }, [conversationId]);

  // Sync initial or updated timestamp from conversation summary
  useEffect(() => {
    if (otherParticipantLastReadAt) {
      setLastReadTimestamp((prev) => {
        if (!prev) return otherParticipantLastReadAt;
        return new Date(otherParticipantLastReadAt).getTime() > new Date(prev).getTime()
          ? otherParticipantLastReadAt
          : prev;
      });
    }
  }, [otherParticipantLastReadAt]);

  // Subscribe to live SignalR read receipts, ignoring receipts from the current user
  useEffect(() => {
    if (!conversationId) return;

    const unsub = onMessagesRead((event) => {
      if (
        event.conversationId === conversationId &&
        (!currentUser || event.readerUserId !== currentUser.id)
      ) {
        setLastReadTimestamp(event.readAt);
      }
    });

    return () => unsub();
  }, [conversationId, currentUser, onMessagesRead]);

  // Check if a specific message timestamp has been seen by the other participant
  const isMessageSeen = useCallback(
    (createdAt: string): boolean => {
      if (!lastReadTimestamp) return false;
      const readMs = new Date(lastReadTimestamp).getTime();
      const msgMs = new Date(createdAt).getTime();
      return !isNaN(readMs) && !isNaN(msgMs) && readMs >= msgMs;
    },
    [lastReadTimestamp]
  );

  return { lastReadTimestamp, isMessageSeen };
}

