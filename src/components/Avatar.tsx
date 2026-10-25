import React, { useState, useRef } from "react";
import { getAvatarThumbnailUrl } from "../utils/media";

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  fontSize?: number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function Avatar({
  src,
  name,
  size = 36,
  fontSize,
  borderRadius = "50%",
  style,
  className,
  onClick,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const prevSrcRef = useRef(src);

  if (prevSrcRef.current !== src) {
    prevSrcRef.current = src;
    setHasError(false);
  }

  const initial = (name?.trim() || "U").charAt(0).toUpperCase();
  const calculatedFontSize = fontSize ?? Math.max(11, Math.round(size * 0.42));
  const fullUrl = src ? getAvatarThumbnailUrl(src, size) : "";

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius,
        backgroundColor: "var(--primary)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: calculatedFontSize,
        overflow: "hidden",
        flexShrink: 0,
        userSelect: "none",
        ...style,
      }}
    >
      {fullUrl && !hasError ? (
        <img
          src={fullUrl}
          alt={name || "User avatar"}
          onError={() => setHasError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
