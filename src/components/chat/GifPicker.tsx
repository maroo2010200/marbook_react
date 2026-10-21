import { useState, useEffect, useRef } from "react";
import { extractMediaUrlFromLink } from "../../utils/richText";

interface GifItem {
  id: string;
  title: string;
  url: string;
  category: string;
}

const CURATED_GIFS: GifItem[] = [
  // Trending
  { id: "app-1", title: "Leonardo DiCaprio Clap", url: "https://media.giphy.com/media/3o7aCSPqXE5C6T8tBC/giphy.gif", category: "trending" },
  { id: "lau-1", title: "Minion Laughing", url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", category: "trending" },
  { id: "thu-1", title: "Thumbs Up Cool", url: "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif", category: "trending" },
  { id: "cat-1", title: "Funny Cat Glasses", url: "https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif", category: "trending" },
  { id: "dan-1", title: "Happy Dance", url: "https://media.giphy.com/media/l4pTfx2qLszoacZRS/giphy.gif", category: "trending" },
  { id: "par-1", title: "Confetti Celebration", url: "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif", category: "trending" },

  // Laugh
  { id: "lau-2", title: "Rolling on Floor Laughing", url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif", category: "laugh" },
  { id: "lau-3", title: "Giggle Face", url: "https://media.giphy.com/media/l1ug3xGEN1oZBT7qw/giphy.gif", category: "laugh" },
  { id: "lau-4", title: "Chuckle Grin", url: "https://media.giphy.com/media/9MFsKQ8A6HCN2/giphy.gif", category: "laugh" },
  { id: "lau-5", title: "Kramer Laugh", url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", category: "laugh" },

  // Love
  { id: "lov-1", title: "Heart Eyes", url: "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif", category: "love" },
  { id: "lov-2", title: "Sending Love", url: "https://media.giphy.com/media/M90mJvfWfd5mbUuULX/giphy.gif", category: "love" },
  { id: "lov-3", title: "Blowing Kiss", url: "https://media.giphy.com/media/R6gVNROjZa40P0NOGl/giphy.gif", category: "love" },
  { id: "lov-4", title: "Warm Hug", url: "https://media.giphy.com/media/26xBFT14ap4Af92E0/giphy.gif", category: "love" },

  // Thumbs Up
  { id: "thu-2", title: "Obama Nod", url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif", category: "thumbs" },
  { id: "thu-3", title: "Approving Nod", url: "https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif", category: "thumbs" },
  { id: "thu-4", title: "Borat Great Success", url: "https://media.giphy.com/media/diUKszNTUghVe/giphy.gif", category: "thumbs" },
  { id: "thu-5", title: "Double Thumbs", url: "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif", category: "thumbs" },

  // Applause
  { id: "app-2", title: "Clapping Ovation", url: "https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif", category: "applause" },
  { id: "app-3", title: "Well Done Applause", url: "https://media.giphy.com/media/fnK0jeA8vIh2QLq3IZ/giphy.gif", category: "applause" },
  { id: "app-4", title: "Standing Bravo", url: "https://media.giphy.com/media/nbvFVPiEiJH6JOGIok/giphy.gif", category: "applause" },
  { id: "app-5", title: "Gatsby Toast", url: "https://media.giphy.com/media/3o7aCSPqXE5C6T8tBC/giphy.gif", category: "applause" },

  // Party
  { id: "par-2", title: "Disco Party", url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif", category: "party" },
  { id: "par-3", title: "Celebrate Good Times", url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif", category: "party" },
  { id: "par-4", title: "Carlton Dance", url: "https://media.giphy.com/media/DhstvI455Y0sE/giphy.gif", category: "party" },
  { id: "par-5", title: "Fiesta Streamers", url: "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif", category: "party" },

  // Cats
  { id: "cat-2", title: "Typing Cat", url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif", category: "cats" },
  { id: "cat-3", title: "Surprised Kitten", url: "https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif", category: "cats" },
  { id: "cat-4", title: "Popcat Pop", url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif", category: "cats" },
  { id: "cat-5", title: "Chill Cat", url: "https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif", category: "cats" },

  // Shocked
  { id: "sho-1", title: "Shocked Face", url: "https://media.giphy.com/media/3o7TKTDnUxE0g2fSE8/giphy.gif", category: "shocked" },
  { id: "sho-2", title: "Mind Blown", url: "https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif", category: "shocked" },
  { id: "sho-3", title: "Gasp OMG", url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", category: "shocked" },

  // Dance
  { id: "dan-2", title: "Snoopy Dance", url: "https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif", category: "dance" },
  { id: "dan-3", title: "Groovy Moves", url: "https://media.giphy.com/media/14qb1Uhf40ndw4/giphy.gif", category: "dance" },
];

const CATEGORIES = [
  { id: "trending", label: "🔥 Trending" },
  { id: "laugh", label: "😂 Laugh" },
  { id: "love", label: "❤️ Love" },
  { id: "thumbs", label: "👍 Thumbs" },
  { id: "applause", label: "👏 Clap" },
  { id: "party", label: "🎉 Party" },
  { id: "cats", label: "🐱 Cats" },
  { id: "shocked", label: "😲 Wow" },
  { id: "dance", label: "🕺 Dance" },
];

interface GifPickerProps {
  onSelectGif: (url: string) => void;
  onClose: () => void;
}

export function GifPicker({ onSelectGif, onClose }: GifPickerProps) {
  const [activeTab, setActiveTab] = useState<string>("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Filter GIFs
  const filteredGifs = CURATED_GIFS.filter((gif) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        gif.title.toLowerCase().includes(q) ||
        gif.category.toLowerCase().includes(q)
      );
    }
    return gif.category === activeTab;
  });

  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    const url = customUrl.trim();
    if (!url) return;

    const detected = extractMediaUrlFromLink(url);
    if (!detected) {
      setCustomError("Please enter a valid GIF or image link (Giphy, Tenor, Imgur, or .gif/.png/.jpg).");
      return;
    }

    setCustomError(null);
    onSelectGif(detected.mediaUrl);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        right: 0,
        width: 360,
        maxHeight: 440,
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 14,
        boxShadow: "var(--shadow-lg, 0 12px 28px rgba(0,0,0,0.24))",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        overflow: "hidden",
        animation: "dropdownFadeIn 0.15s ease-out",
      }}
    >
      {/* Header with Search */}
      <div
        style={{
          padding: "12px 14px 8px",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
            Choose a GIF
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close GIF Picker"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 16,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          placeholder="Search reaction GIFs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 20,
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-hover)",
            color: "var(--text-primary)",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Category Pills (visible when no search query) */}
      {!searchQuery && (
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "8px 12px",
            overflowX: "auto",
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-hover)",
            scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              style={{
                background: activeTab === cat.id ? "var(--primary)" : "var(--bg-card)",
                color: activeTab === cat.id ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: 14,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.12s ease",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid of GIFs */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 10,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 8,
          maxHeight: 260,
        }}
      >
        {filteredGifs.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "30px 10px",
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            No GIFs found. You can paste any link below!
          </div>
        ) : (
          filteredGifs.map((gif) => (
            <div
              key={gif.id}
              onClick={() => {
                onSelectGif(gif.url);
                onClose();
              }}
              title={gif.title}
              style={{
                position: "relative",
                height: 100,
                borderRadius: 8,
                overflow: "hidden",
                cursor: "pointer",
                backgroundColor: "var(--bg-hover)",
                border: "2px solid transparent",
                transition: "transform 0.15s ease, border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.borderColor = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <img
                src={gif.url}
                alt={gif.title}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "1px 4px",
                  borderRadius: 3,
                  letterSpacing: "0.5px",
                  pointerEvents: "none",
                }}
              >
                GIF
              </span>
            </div>
          ))
        )}
      </div>

      {/* Paste Custom Link Footer */}
      <form
        onSubmit={handleCustomSend}
        style={{
          padding: "8px 12px 10px",
          borderTop: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-card)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            placeholder="Paste any GIF or image link..."
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              setCustomError(null);
            }}
            style={{
              flex: 1,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-hover)",
              color: "var(--text-primary)",
              fontSize: 12,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!customUrl.trim()}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              backgroundColor: customUrl.trim() ? "var(--primary)" : "var(--bg-hover)",
              color: customUrl.trim() ? "#fff" : "var(--text-muted)",
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: customUrl.trim() ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
            }}
          >
            Send Link
          </button>
        </div>
        {customError && (
          <span style={{ fontSize: 11, color: "#e02424" }}>
            {customError}
          </span>
        )}
      </form>
    </div>
  );
}
