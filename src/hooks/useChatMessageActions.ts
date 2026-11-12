import { useState, useCallback, type Dispatch, type SetStateAction } from "react";
import { chatApi } from "../api/chat";
import type { Message } from "../types/chat";

interface UseChatMessageActionsOptions {
  conversationId: number | null;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  onMutated?: () => void;
}

/**
 * Shared state and handlers for pinning, inline-editing, and deleting chat messages.
 * Scopes edit and delete targets by conversationId so switching chats auto-resets UI state.
 */
export function useChatMessageActions({
  conversationId,
  setMessages,
  onMutated,
}: UseChatMessageActionsOptions) {
  const [editState, setEditState] = useState<{
    conversationId: number;
    messageId: number;
    text: string;
  } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    conversationId: number;
    messageId: number;
  } | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [deleteMessageError, setDeleteMessageError] = useState<string | null>(
    null
  );

  const editingMessageId =
    conversationId && editState?.conversationId === conversationId
      ? editState.messageId
      : null;
  const editText =
    conversationId && editState?.conversationId === conversationId
      ? editState.text
      : "";
  const messageToDeleteId =
    conversationId && deleteTarget?.conversationId === conversationId
      ? deleteTarget.messageId
      : null;

  const setEditText = useCallback(
    (text: string) => {
      if (!conversationId) return;
      setEditState((prev) =>
        prev && prev.conversationId === conversationId
          ? { ...prev, text }
          : prev
      );
    },
    [conversationId]
  );

  const startEdit = useCallback(
    (msg: Message) => {
      if (!conversationId) return;
      setEditState({
        conversationId,
        messageId: msg.id,
        text: msg.content,
      });
    },
    [conversationId]
  );

  const cancelEdit = useCallback(() => {
    setEditState(null);
  }, []);

  const saveEdit = useCallback(
    async (messageId: number) => {
      const trimmed = editText.trim();
      if (!conversationId || !trimmed || isSavingEdit) return;

      setIsSavingEdit(true);
      try {
        const updated = await chatApi.editMessage(
          conversationId,
          messageId,
          trimmed
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...updated, isMine: true } : m
          )
        );
        setEditState(null);
        onMutated?.();
      } catch (err) {
        console.error("Failed to edit message:", err);
      } finally {
        setIsSavingEdit(false);
      }
    },
    [conversationId, editText, isSavingEdit, setMessages, onMutated]
  );

  const promptDelete = useCallback(
    (messageId: number) => {
      if (!conversationId) return;
      setDeleteMessageError(null);
      setDeleteTarget({ conversationId, messageId });
    },
    [conversationId]
  );

  const cancelDelete = useCallback(() => {
    if (isDeletingMessage) return;
    setDeleteTarget(null);
    setDeleteMessageError(null);
  }, [isDeletingMessage]);

  const confirmDelete = useCallback(async () => {
    if (!conversationId || !messageToDeleteId || isDeletingMessage) return;

    setIsDeletingMessage(true);
    setDeleteMessageError(null);
    try {
      await chatApi.deleteMessage(conversationId, messageToDeleteId);
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
      setDeleteTarget(null);
      onMutated?.();
    } catch (err) {
      console.error("Failed to delete message:", err);
      setDeleteMessageError("Failed to delete message. Please try again.");
    } finally {
      setIsDeletingMessage(false);
    }
  }, [
    conversationId,
    messageToDeleteId,
    isDeletingMessage,
    setMessages,
    onMutated,
  ]);

  const togglePin = useCallback(
    async (messageId: number) => {
      if (!conversationId) return;
      try {
        const res = await chatApi.togglePinMessage(conversationId, messageId);
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === messageId) return { ...m, isPinned: res.isPinned };
            if (res.isPinned) return { ...m, isPinned: false };
            return m;
          })
        );
      } catch (err) {
        console.error("Failed to pin message:", err);
      }
    },
    [conversationId, setMessages]
  );

  return {
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
  };
}

