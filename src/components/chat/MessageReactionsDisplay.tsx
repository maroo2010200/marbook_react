import { useMemo } from "react";
import type { MessageReactionItem } from "../../types/chat";

interface MessageReactionsDisplayProps {
  reactions?: MessageReactionItem[];
  currentUserId?: number;
  isMine?: boolean;
  onToggleReaction: (emoji: string) => void;
  compact?: boolean;
}

interface GroupedReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
  userNames: string[];
}

export function MessageReactionsDisplay({
  reactions = [],
  currentUserId,
  isMine = false,
  onToggleReaction,
  compact = false,
}: MessageReactionsDisplayProps) {
  const groups = useMemo(() => {
    if (!reactions || reactions.length === 0) return [];

    const map = new Map<string, { count: number; hasReacted: boolean; userNames: string[] }>();
    for (const r of reactions) {
      if (!map.has(r.emoji)) {
        map.set(r.emoji, { count: 0, hasReacted: false, userNames: [] });
      }
      const g = map.get(r.emoji)!;
      g.count += 1;
      if (currentUserId && r.userId === currentUserId) {
        g.hasReacted = true;
      }
      g.userNames.push(r.userName || "User");
    }

    const result: GroupedReaction[] = [];
    map.forEach((value, emoji) => {
      result.push({
        emoji,
        count: value.count,
        hasReacted: value.hasReacted,
        userNames: value.userNames,
      });
    });
    return result;
  }, [reactions, currentUserId]);

  if (groups.length === 0) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 4,
        marginTop: -6,
        marginBottom: 2,
        zIndex: 2,
        alignSelf: isMine ? "flex-end" : "flex-start",
        padding: "0 4px",
      }}
    >
      {groups.map((g) => {
        const tooltip =
          g.userNames.length > 3
            ? `${g.userNames.slice(0, 3).join(", ")} and ${g.userNames.length - 3} others`
            : g.userNames.join(", ");

        return (
          <button
            key={g.emoji}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleReaction(g.emoji);
            }}
            title={tooltip}
            aria-label={`${g.emoji} (${g.count})`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: compact ? "1px 5px" : "2px 7px",
              borderRadius: 12,
              border: g.hasReacted
                ? "1.5px solid var(--primary)"
                : "1px solid var(--border-color)",
              backgroundColor: g.hasReacted
                ? "rgba(59, 130, 246, 0.14)"
                : "var(--bg-card)",
              color: g.hasReacted ? "var(--primary)" : "var(--text-secondary)",
              fontSize: compact ? 11 : 12,
              fontWeight: 600,
              cursor: "pointer",
              lineHeight: 1.2,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <span
              style={{
                fontFamily:
                  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                fontSize: compact ? 12 : 13,
              }}
            >
              {g.emoji}
            </span>
            {g.count > 1 && (
              <span style={{ fontSize: compact ? 10 : 11 }}>{g.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

