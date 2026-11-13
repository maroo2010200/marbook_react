import type { UseInChatSearchReturn } from "../../hooks/useInChatSearch";
import {
  SearchIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SharedAssetsIcon,
  CloseIcon,
} from "./ChatIcons";

export interface ChatSearchBarProps {
  search: UseInChatSearchReturn;
  onOpenSharedMedia: () => void;
  compact?: boolean;
}

export function ChatSearchBar({
  search,
  onOpenSharedMedia,
  compact = false,
}: ChatSearchBarProps) {
  const {
    isSearching,
    searchQuery,
    setSearchQuery,
    currentMatchIndex,
    matchingMessageIds,
    inputRef,
    handleNextMatch,
    handlePrevMatch,
    closeSearch,
  } = search;

  if (!isSearching) return null;

  return (
    <div
      className="chat-search-toolbar"
      style={{
        backgroundColor: "var(--bg-main)",
        borderBottom: "1px solid var(--border-color)",
        padding: compact ? "5px 10px" : "8px 16px",
        display: "flex",
        alignItems: "center",
        gap: compact ? 6 : 8,
        fontSize: compact ? 12 : 13.5,
        zIndex: 3,
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      <div
        style={{
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <SearchIcon size={compact ? 13 : 15} />
      </div>

      <input
        ref={inputRef}
        type="text"
        className="chat-search-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (e.shiftKey) handlePrevMatch();
            else handleNextMatch();
          } else if (e.key === "Escape") {
            closeSearch();
          }
        }}
        placeholder={compact ? "Search in chat..." : "Search in this chat..."}
        style={{
          flex: 1,
          minWidth: 0,
          backgroundColor: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-primary)",
          fontSize: compact ? 12 : 13.5,
        }}
      />

      {/* Match Counter */}
      {searchQuery.trim() && (
        <span
          style={{
            fontSize: compact ? 11 : 12,
            fontWeight: 600,
            color:
              matchingMessageIds.length > 0
                ? "var(--text-secondary)"
                : "var(--danger)",
            whiteSpace: "nowrap",
          }}
        >
          {matchingMessageIds.length > 0
            ? compact
              ? `${currentMatchIndex + 1}/${matchingMessageIds.length}`
              : `${currentMatchIndex + 1} of ${matchingMessageIds.length}`
            : "No matches"}
        </span>
      )}

      {/* Up/Down buttons */}
      <button
        type="button"
        title="Previous match (Shift+Enter)"
        aria-label="Previous match"
        onClick={handlePrevMatch}
        disabled={matchingMessageIds.length === 0}
        style={{
          background: "none",
          border: "none",
          color:
            matchingMessageIds.length > 0
              ? "var(--text-primary)"
              : "var(--text-muted)",
          cursor: matchingMessageIds.length > 0 ? "pointer" : "default",
          padding: compact ? 2 : 4,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChevronUpIcon size={compact ? 14 : 16} />
      </button>

      <button
        type="button"
        title="Next match (Enter)"
        aria-label="Next match"
        onClick={handleNextMatch}
        disabled={matchingMessageIds.length === 0}
        style={{
          background: "none",
          border: "none",
          color:
            matchingMessageIds.length > 0
              ? "var(--text-primary)"
              : "var(--text-muted)",
          cursor: matchingMessageIds.length > 0 ? "pointer" : "default",
          padding: compact ? 2 : 4,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChevronDownIcon size={compact ? 14 : 16} />
      </button>

      {/* Quick button: Media & files (hidden in very narrow compact mode or styled neatly) */}
      <button
        type="button"
        onClick={onOpenSharedMedia}
        title="View all media, links & docs"
        aria-label="View all media, links & docs"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          backgroundColor: "var(--bg-hover)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
          borderRadius: "var(--radius-full)",
          padding: compact ? "2px 8px" : "4px 10px",
          fontSize: compact ? 11 : 12,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--border-color)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
        }
      >
        <SharedAssetsIcon size={compact ? 12 : 13} />
        {!compact && <span>Media & files</span>}
      </button>

      {/* Close Search */}
      <button
        type="button"
        onClick={closeSearch}
        title="Close search (Esc)"
        aria-label="Close search"
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          padding: compact ? 2 : 4,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CloseIcon size={compact ? 14 : 15} />
      </button>
    </div>
  );
}
