import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../api/users";
import { postsApi } from "../api/posts";
import { getMediaUrl } from "../utils/media";
import { formatRelativeTime } from "../utils/time";
import type { UserSearchResult } from "../types/user";
import type { Post } from "../types/posts";

interface SearchBarProps {
  onSearchSubmit?: (query: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function SearchBar({ onSearchSubmit, className, style }: SearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [previewUsers, setPreviewUsers] = useState<UserSearchResult[]>([]);
  const [previewPosts, setPreviewPosts] = useState<Post[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global hotkey Ctrl+K / Cmd+K to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsFocused(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener to dismiss preview
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch quick preview results (debounced 250ms)
  const fetchPreview = useCallback(async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setPreviewUsers([]);
      setPreviewPosts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [usersRes, postsRes] = await Promise.allSettled([
        usersApi.searchUsers(trimmed, 1, 3),
        postsApi.searchPosts(trimmed, 1, 3),
      ]);

      if (usersRes.status === "fulfilled") {
        setPreviewUsers(usersRes.value.items || []);
      } else {
        setPreviewUsers([]);
      }

      if (postsRes.status === "fulfilled") {
        setPreviewPosts(postsRes.value.items || []);
      } else {
        setPreviewPosts([]);
      }
    } catch (err) {
      console.error("Quick preview search failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (val.trim().length >= 2) {
      setIsOpen(true);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchPreview(val);
      }, 250);
    } else {
      setPreviewUsers([]);
      setPreviewPosts([]);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setPreviewUsers([]);
    setPreviewPosts([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const executeFullSearch = (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    setIsOpen(false);
    inputRef.current?.blur();
    if (onSearchSubmit) {
      onSearchSubmit(q);
    } else {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeFullSearch();
  };

  const handleUserClick = (userId: number) => {
    setIsOpen(false);
    navigate(`/profile/${userId}`);
  };

  const handlePostClick = (postId: number) => {
    setIsOpen(false);
    navigate(`/feed?postId=${postId}`);
  };

  const isMac = typeof window !== "undefined" && navigator.platform?.toUpperCase().indexOf("MAC") >= 0;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: isFocused ? 380 : 280,
        transition: "max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
    >
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 38,
            backgroundColor: isFocused ? "var(--bg-card)" : "var(--bg-hover)",
            borderRadius: 20,
            padding: "0 12px 0 14px",
            border: isFocused
              ? "1.5px solid var(--primary)"
              : "1.5px solid transparent",
            boxShadow: isFocused
              ? "0 0 0 3px rgba(24, 119, 242, 0.15), var(--shadow-sm)"
              : "none",
            transition: "all 0.2s ease",
            position: "relative",
          }}
        >
          {/* Animated Search Icon */}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isFocused ? "var(--primary)" : "var(--text-secondary)",
              marginRight: 8,
              transition: "color 0.2s ease",
              flexShrink: 0,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
              if (query.trim().length >= 2) setIsOpen(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder="Search Marbook..."
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: 14,
              fontFamily: "inherit",
              padding: 0,
            }}
          />

          {/* Clear Button ✕ */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear search"
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 4,
                fontSize: 13,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}

          {/* Ctrl+K Hotkey Badge (Hidden when typing or focused) */}
          {!query && !isFocused && (
            <kbd
              title={`Press ${isMac ? "⌘" : "Ctrl"}+K to search`}
              style={{
                border: "1px solid var(--border-color)",
                borderRadius: 4,
                padding: "1px 5px",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-card)",
                fontFamily: "inherit",
                userSelect: "none",
                flexShrink: 0,
              }}
            >
              {isMac ? "⌘K" : "Ctrl K"}
            </kbd>
          )}
        </div>
      </form>

      {/* Quick Preview Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            minWidth: 340,
            backgroundColor: "var(--bg-card)",
            borderRadius: 12,
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border-color)",
            zIndex: 1000,
            overflow: "hidden",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* Loading Indicator */}
          {isLoading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 16px",
                fontSize: 13,
                color: "var(--text-secondary)",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid var(--primary)",
                  borderTopColor: "transparent",
                  animation: "spin 0.6s linear infinite",
                }}
              />
              <span>Searching for &ldquo;{query}&rdquo;...</span>
            </div>
          )}

          {/* People Section */}
          {previewUsers.length > 0 && (
            <div style={{ padding: "8px 0" }}>
              <div
                style={{
                  padding: "4px 16px 6px",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--text-secondary)",
                }}
              >
                People
              </div>
              {previewUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 16px",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <img
                    src={getMediaUrl(user.avatarUrl)}
                    alt={user.name}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      objectFit: "cover",
                      backgroundColor: "var(--bg-hover)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.name}
                    </div>
                    {user.username && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        @{user.username}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Posts Section */}
          {previewPosts.length > 0 && (
            <div
              style={{
                padding: "8px 0",
                borderTop:
                  previewUsers.length > 0
                    ? "1px solid var(--border-color)"
                    : "none",
              }}
            >
              <div
                style={{
                  padding: "4px 16px 6px",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--text-secondary)",
                }}
              >
                Posts
              </div>
              {previewPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 16px",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <img
                    src={getMediaUrl(post.userAvatarUrl)}
                    alt={post.userName}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {post.userName} &bull;{" "}
                      {formatRelativeTime(post.createdAt)}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginTop: 2,
                      }}
                    >
                      {post.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Quick Results */}
          {!isLoading &&
            previewUsers.length === 0 &&
            previewPosts.length === 0 && (
              <div
                style={{
                  padding: "20px 16px",
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                }}
              >
                No quick results for &ldquo;{query}&rdquo;
              </div>
            )}

          {/* See All Results Button */}
          <div
            onClick={() => executeFullSearch()}
            style={{
              padding: "12px 16px",
              backgroundColor: "var(--bg-hover)",
              borderTop: "1px solid var(--border-color)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontWeight: 600,
              fontSize: 13,
              color: "var(--primary)",
              transition: "filter 0.15s ease",
            }}
          >
            <span>See all results for &ldquo;{query}&rdquo;</span>
            <span style={{ fontSize: 16 }}>&rarr;</span>
          </div>
        </div>
      )}
    </div>
  );
}
