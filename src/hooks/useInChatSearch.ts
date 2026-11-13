import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { Message } from "../types/chat";

export interface UseInChatSearchReturn {
  isSearching: boolean;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  currentMatchIndex: number;
  matchingMessageIds: number[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleNextMatch: () => void;
  handlePrevMatch: () => void;
  closeSearch: () => void;
  isCurrentMatch: (messageId: number) => boolean;
  isMatching: (messageId: number) => boolean;
}

export function useInChatSearch(
  messages: Message[],
  elementIdPrefix: string = "msg-"
): UseInChatSearchReturn {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Compute matching messages (case-insensitive)
  const matchingMessageIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter((m) => !m.isDeleted && m.content.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  // Adjust match index when matching list changes (start at most recent match)
  useEffect(() => {
    if (matchingMessageIds.length > 0) {
      setCurrentMatchIndex(matchingMessageIds.length - 1);
    } else {
      setCurrentMatchIndex(0);
    }
  }, [matchingMessageIds.length, searchQuery]);

  // Next / Previous navigation
  const handleNextMatch = useCallback(() => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) =>
      prev < matchingMessageIds.length - 1 ? prev + 1 : 0
    );
  }, [matchingMessageIds.length]);

  const handlePrevMatch = useCallback(() => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) =>
      prev > 0 ? prev - 1 : matchingMessageIds.length - 1
    );
  }, [matchingMessageIds.length]);

  // Smooth scroll to active matched message element
  useEffect(() => {
    if (!isSearching || matchingMessageIds.length === 0) return;
    const targetId = matchingMessageIds[currentMatchIndex];
    if (targetId) {
      const el = document.getElementById(`${elementIdPrefix}${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentMatchIndex, matchingMessageIds, isSearching, elementIdPrefix]);

  // Auto-focus input when search is opened
  useEffect(() => {
    if (isSearching) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isSearching]);

  const closeSearch = useCallback(() => {
    setIsSearching(false);
    setSearchQuery("");
  }, []);

  const isCurrentMatch = useCallback(
    (msgId: number) => {
      return (
        isSearching &&
        matchingMessageIds.length > 0 &&
        matchingMessageIds[currentMatchIndex] === msgId
      );
    },
    [isSearching, matchingMessageIds, currentMatchIndex]
  );

  const isMatching = useCallback(
    (msgId: number) => {
      return (
        isSearching &&
        matchingMessageIds.length > 0 &&
        matchingMessageIds.includes(msgId)
      );
    },
    [isSearching, matchingMessageIds]
  );

  return {
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    currentMatchIndex,
    matchingMessageIds,
    inputRef,
    handleNextMatch,
    handlePrevMatch,
    closeSearch,
    isCurrentMatch,
    isMatching,
  };
}

