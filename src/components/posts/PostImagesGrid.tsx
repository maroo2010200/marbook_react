import { useState } from "react";
import { getPostOptimizedUrl, getMediaUrl, isVideoMedia } from "../../utils/media";

export interface PostImagesGridProps {
  images: string[];
  onImageClick?: (index: number) => void;
}

export function PostImagesGrid({ images, onImageClick }: PostImagesGridProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const count = images.length;
  const handleClick = (idx: number) => {
    if (onImageClick) {
      onImageClick(idx);
    }
  };

  const imageStyle = (idx: number): React.CSSProperties => ({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    cursor: "pointer",
    filter: hoveredIdx === idx ? "brightness(0.92)" : "none",
    transition: "filter 0.15s ease, transform 0.15s ease",
    display: "block",
  });

  const renderCellMedia = (idx: number, customStyle?: React.CSSProperties) => {
    const rawUrl = images[idx];
    const isVideo = isVideoMedia(rawUrl);
    const mediaUrl = getMediaUrl(rawUrl);

    if (isVideo) {
      return (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            backgroundColor: "#000",
            overflow: "hidden",
          }}
        >
          <video
            src={mediaUrl}
            preload="metadata"
            style={{
              ...imageStyle(idx),
              ...customStyle,
              backgroundColor: "#000",
              pointerEvents: "none",
            }}
          />
          {/* Centered Play Button overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                hoveredIdx === idx ? "rgba(0, 0, 0, 0.45)" : "rgba(0, 0, 0, 0.25)",
              transition: "background-color 0.2s ease",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "rgba(0, 0, 0, 0.65)",
                backdropFilter: "blur(4px)",
                border: "2px solid rgba(255, 255, 255, 0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 18,
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                transform: hoveredIdx === idx ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.2s ease",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 2 }}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            {/* Corner Video Pill */}
            <span
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                padding: "2px 8px",
                borderRadius: 4,
                backgroundColor: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(2px)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.5px",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              VIDEO
            </span>
          </div>
        </div>
      );
    }

    return (
      <img
        src={getPostOptimizedUrl(rawUrl)}
        alt={`Attachment ${idx + 1}`}
        loading="lazy"
        style={{
          ...imageStyle(idx),
          ...customStyle,
        }}
      />
    );
  };

  // 1 Media: Full natural visibility without cropping
  if (count === 1) {
    if (isVideoMedia(images[0])) {
      return (
        <div
          style={{
            marginTop: 10,
            borderRadius: 8,
            overflow: "hidden",
            maxHeight: 650,
            backgroundColor: "#000",
            position: "relative",
          }}
        >
          <video
            src={getMediaUrl(images[0])}
            controls
            playsInline
            preload="metadata"
            style={{
              width: "100%",
              maxHeight: 650,
              display: "block",
              margin: "0 auto",
              backgroundColor: "#000",
            }}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          marginTop: 10,
          borderRadius: 8,
          overflow: "hidden",
          maxHeight: 650,
          backgroundColor: "#f0f2f5",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => handleClick(0)}
        onMouseEnter={() => setHoveredIdx(0)}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <img
          src={getPostOptimizedUrl(images[0])}
          alt="Post attachment"
          loading="lazy"
          style={{
            maxWidth: "100%",
            maxHeight: 650,
            width: "auto",
            height: "auto",
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
            filter: hoveredIdx === 0 ? "brightness(0.95)" : "none",
            transition: "filter 0.15s ease",
          }}
        />
      </div>
    );
  }

  // 2 Media: 2 columns side by side
  if (count === 2) {
    return (
      <div
        style={{
          marginTop: 10,
          borderRadius: 8,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 4,
          height: 320,
          backgroundColor: "#e4e6eb",
        }}
      >
        {images.map((_, idx) => (
          <div
            key={idx}
            style={{ width: "100%", height: "100%", overflow: "hidden" }}
            onClick={() => handleClick(idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {renderCellMedia(idx)}
          </div>
        ))}
      </div>
    );
  }

  // 3 Media: 1 large on left, 2 stacked on right
  if (count === 3) {
    return (
      <div
        style={{
          marginTop: 10,
          borderRadius: 8,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 4,
          height: 360,
          backgroundColor: "#e4e6eb",
        }}
      >
        {/* Left main media */}
        <div
          style={{ width: "100%", height: "100%", overflow: "hidden" }}
          onClick={() => handleClick(0)}
          onMouseEnter={() => setHoveredIdx(0)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {renderCellMedia(0)}
        </div>

        {/* Right 2 stacked media */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: "1fr 1fr",
            gap: 4,
            height: "100%",
          }}
        >
          {[1, 2].map((idx) => (
            <div
              key={idx}
              style={{ width: "100%", height: "100%", overflow: "hidden" }}
              onClick={() => handleClick(idx)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {renderCellMedia(idx)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4 Media: 2x2 grid
  if (count === 4) {
    return (
      <div
        style={{
          marginTop: 10,
          borderRadius: 8,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 4,
          height: 360,
          backgroundColor: "#e4e6eb",
        }}
      >
        {images.map((_, idx) => (
          <div
            key={idx}
            style={{ width: "100%", height: "100%", overflow: "hidden" }}
            onClick={() => handleClick(idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {renderCellMedia(idx)}
          </div>
        ))}
      </div>
    );
  }

  // 5+ Media: 2x2 grid with +N on the 4th media
  const extraCount = count - 4;
  return (
    <div
      style={{
        marginTop: 10,
        borderRadius: 8,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 4,
        height: 380,
        backgroundColor: "#e4e6eb",
      }}
    >
      {[0, 1, 2].map((idx) => (
        <div
          key={idx}
          style={{ width: "100%", height: "100%", overflow: "hidden" }}
          onClick={() => handleClick(idx)}
          onMouseEnter={() => setHoveredIdx(idx)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {renderCellMedia(idx)}
        </div>
      ))}

      {/* 4th cell with +N overlay */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          cursor: "pointer",
        }}
        onClick={() => handleClick(3)}
        onMouseEnter={() => setHoveredIdx(3)}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {renderCellMedia(3)}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.52)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.5px",
            transition: "background-color 0.15s ease",
            zIndex: 2,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.65)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.52)")
          }
        >
          +{extraCount}
        </div>
      </div>
    </div>
  );
}
