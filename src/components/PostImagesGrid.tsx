import { useState } from "react";
import { getMediaUrl } from "../utils/media";

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

  // 1 Image: Full width, natural feel with max-height
  if (count === 1) {
    return (
      <div
        style={{
          marginTop: 10,
          borderRadius: 8,
          overflow: "hidden",
          maxHeight: 500,
          backgroundColor: "#f0f2f5",
          cursor: "pointer",
        }}
        onClick={() => handleClick(0)}
        onMouseEnter={() => setHoveredIdx(0)}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <img
          src={getMediaUrl(images[0])}
          alt="Post attachment"
          loading="lazy"
          style={{
            width: "100%",
            maxHeight: 500,
            objectFit: "cover",
            display: "block",
            filter: hoveredIdx === 0 ? "brightness(0.94)" : "none",
            transition: "filter 0.15s ease",
          }}
        />
      </div>
    );
  }

  // 2 Images: 2 columns side by side
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
        {images.map((img, idx) => (
          <div
            key={idx}
            style={{ width: "100%", height: "100%", overflow: "hidden" }}
            onClick={() => handleClick(idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <img
              src={getMediaUrl(img)}
              alt={`Attachment ${idx + 1}`}
              loading="lazy"
              style={imageStyle(idx)}
            />
          </div>
        ))}
      </div>
    );
  }

  // 3 Images: 1 large on left, 2 stacked on right
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
        {/* Left main image */}
        <div
          style={{ width: "100%", height: "100%", overflow: "hidden" }}
          onClick={() => handleClick(0)}
          onMouseEnter={() => setHoveredIdx(0)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <img
            src={getMediaUrl(images[0])}
            alt="Attachment 1"
            loading="lazy"
            style={imageStyle(0)}
          />
        </div>

        {/* Right 2 stacked images */}
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
              <img
                src={getMediaUrl(images[idx])}
                alt={`Attachment ${idx + 1}`}
                loading="lazy"
                style={imageStyle(idx)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4 Images: 2x2 grid
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
        {images.map((img, idx) => (
          <div
            key={idx}
            style={{ width: "100%", height: "100%", overflow: "hidden" }}
            onClick={() => handleClick(idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <img
              src={getMediaUrl(img)}
              alt={`Attachment ${idx + 1}`}
              loading="lazy"
              style={imageStyle(idx)}
            />
          </div>
        ))}
      </div>
    );
  }

  // 5+ Images: 2x2 grid with +N on the 4th image
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
          <img
            src={getMediaUrl(images[idx])}
            alt={`Attachment ${idx + 1}`}
            loading="lazy"
            style={imageStyle(idx)}
          />
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
        <img
          src={getMediaUrl(images[3])}
          alt="Attachment 4"
          loading="lazy"
          style={imageStyle(3)}
        />
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
