import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  MoreVerticalIcon,
  PinIcon,
  EditPencilIcon,
  TrashIcon,
} from "./ChatIcons";

interface MessageActionsMenuProps {
  isPinned: boolean;
  canEdit?: boolean;
  align?: "left" | "right";
  compact?: boolean;
  onTogglePin: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface MenuItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
  highlight?: boolean;
}

/**
 * Compact three-dots trigger button that opens a Pin / Edit / Delete popover for a message.
 * Automatically flips upward when near the bottom of its scroll container so menus don't clip.
 */
export function MessageActionsMenu({
  isPinned,
  canEdit = true,
  align = "right",
  compact = false,
  onTogglePin,
  onEdit,
  onDelete,
}: MessageActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [openRightward, setOpenRightward] = useState(align === "left");
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const btnRect = buttonRef.current.getBoundingClientRect();
      // Walk up to the scrollable message stream container so edge detection matches the dock height too.
      let scrollParent: HTMLElement | null = buttonRef.current.parentElement;
      while (scrollParent) {
        const overflowY = window.getComputedStyle(scrollParent).overflowY;
        if (overflowY === "auto" || overflowY === "scroll") break;
        scrollParent = scrollParent.parentElement;
      }
      const scrollRect = scrollParent?.getBoundingClientRect();
      const boundaryBottom = scrollRect
        ? scrollRect.bottom
        : window.innerHeight;
      const boundaryLeft = scrollRect ? scrollRect.left : 0;
      const boundaryRight = scrollRect ? scrollRect.right : window.innerWidth;
      const menuWidth = compact ? 140 : 154;

      setOpenUpward(btnRect.bottom + 130 > boundaryBottom);

      // Flip horizontally if opening toward the configured side would clip outside the container.
      const preferRightward = align === "left";
      if (preferRightward && btnRect.left + menuWidth > boundaryRight - 8) {
        setOpenRightward(false);
      } else if (!preferRightward && btnRect.right - menuWidth < boundaryLeft + 8) {
        setOpenRightward(true);
      } else {
        setOpenRightward(preferRightward);
      }
    }
    setIsOpen((prev) => !prev);
  };

  const items: MenuItem[] = [
    {
      label: isPinned ? "Unpin message" : "Pin message",
      icon: <PinIcon size={compact ? 13 : 14} filled={isPinned} />,
      onClick: onTogglePin,
      highlight: isPinned,
    },
    ...(canEdit && onEdit
      ? [
          {
            label: "Edit",
            icon: <EditPencilIcon size={compact ? 13 : 14} />,
            onClick: onEdit,
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: "Delete",
            icon: <TrashIcon size={compact ? 13 : 14} />,
            onClick: onDelete,
            danger: true,
          },
        ]
      : []),
  ];

  const triggerSize = compact ? 24 : 28;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Message actions"
        aria-label="Message actions"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        style={{
          width: triggerSize,
          height: triggerSize,
          borderRadius: "50%",
          border: "none",
          backgroundColor:
            isOpen || hovered ? "var(--bg-hover)" : "transparent",
          color:
            isOpen || hovered
              ? "var(--text-primary)"
              : "var(--text-secondary)",
          opacity: isOpen || hovered ? 1 : 0.72,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          transition: "background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease",
        }}
      >
        <MoreVerticalIcon size={compact ? 15 : 16} />
      </button>

      {isOpen && (
        <div
          role="menu"
          style={{
            position: "absolute",
            ...(openUpward
              ? { bottom: "calc(100% + 4px)" }
              : { top: "calc(100% + 4px)" }),
            ...(openRightward ? { left: 0 } : { right: 0 }),
            minWidth: compact ? 136 : 150,
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: 8,
            boxShadow: "var(--shadow-lg)",
            padding: 4,
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: compact ? "6px 8px" : "7px 10px",
                borderRadius: 6,
                border: "none",
                backgroundColor: "transparent",
                color: item.danger
                  ? "#e02424"
                  : item.highlight
                  ? "#f59e0b"
                  : "var(--text-primary)",
                fontSize: compact ? 12 : 13,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = item.danger
                  ? "rgba(224, 36, 36, 0.1)"
                  : "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
