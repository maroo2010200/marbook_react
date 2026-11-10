import React, { useId } from "react";

interface MarshmallowLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const MarshmallowLogo: React.FC<MarshmallowLogoProps> = ({
  size = 28,
  className = "",
  style = {},
}) => {
  const id = useId();

  return (
    <svg
      className={`marshmallow-logo-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        flexShrink: 0,
        display: "inline-block",
        verticalAlign: "middle",
        transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        ...style,
      }}
      role="img"
      aria-label="Marshmallow Logo"
    >
      <defs>
        {/* Soft body ivory/cream gradient */}
        <linearGradient id={`${id}-body`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFDF9" />
          <stop offset="55%" stopColor="#FAF4EB" />
          <stop offset="100%" stopColor="#F2E3CF" />
        </linearGradient>

        {/* Toasted top cap caramel gradient */}
        <linearGradient id={`${id}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDF5E8" />
          <stop offset="55%" stopColor="#E9B97C" />
          <stop offset="100%" stopColor="#C96B32" />
        </linearGradient>
      </defs>

      {/* Ground soft shadow */}
      <ellipse cx="16" cy="27" rx="10" ry="2.2" fill="#000000" opacity="0.18" />

      {/* Marshmallow Cylinder Body */}
      <path
        d="M 6 11 C 6 8.5 26 8.5 26 11 L 26 21 C 26 24.8 6 24.8 6 21 Z"
        fill={`url(#${id}-body)`}
        stroke="#C96B32"
        strokeWidth="1.2"
        strokeOpacity="0.35"
      />

      {/* Toasted Caramel Top Cap */}
      <ellipse
        cx="16"
        cy="11"
        rx="10"
        ry="4.5"
        fill={`url(#${id}-top)`}
        stroke="#C96B32"
        strokeWidth="1.2"
        strokeOpacity="0.45"
      />
      {/* Caramel toasted crust patch on top */}
      <ellipse cx="17.5" cy="10.5" rx="3.5" ry="1.5" fill="#92400E" opacity="0.65" />
      <circle cx="14" cy="11.2" r="0.8" fill="#78350F" opacity="0.5" />

      {/* Cheerful Kawaii Face */}
      {/* Left squinty eye */}
      <path
        d="M 11.5 17.5 Q 13 15.8 14.5 17.5"
        stroke="#451A03"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right squinty eye */}
      <path
        d="M 17.5 17.5 Q 19 15.8 20.5 17.5"
        stroke="#451A03"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Sweet smile */}
      <path
        d="M 15 19.8 Q 16 21.2 17 19.8"
        stroke="#78350F"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rosy amber blush on cheeks */}
      <circle cx="10" cy="18.5" r="1.3" fill="#F59E0B" opacity="0.75" />
      <circle cx="22" cy="18.5" r="1.3" fill="#F59E0B" opacity="0.75" />
    </svg>
  );
};

export default MarshmallowLogo;

