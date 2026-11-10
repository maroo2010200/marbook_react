import React, { useId } from "react";

export interface MarshmallowLoaderProps {
  size?: "sm" | "md" | "lg";
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  inline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_CONFIGS = {
  sm: { width: 44, height: 36, labelSize: "12px", sublabelSize: "11px", gap: "8px" },
  md: { width: 110, height: 90, labelSize: "13px", sublabelSize: "12px", gap: "8px" },
  lg: { width: 170, height: 140, labelSize: "15px", sublabelSize: "13px", gap: "10px" },
};

export const MarshmallowLoader: React.FC<MarshmallowLoaderProps> = ({
  size = "md",
  label,
  sublabel,
  inline = false,
  className = "",
  style = {},
}) => {
  const id = useId();
  const cfg = SIZE_CONFIGS[size];

  // Resolve default labels if undefined
  const displayLabel =
    label !== undefined
      ? label
      : size === "lg"
      ? "Toasting marshmallow..."
      : size === "md"
      ? "Toasting..."
      : null;

  return (
    <div
      className={`marshmallow-loader ${className}`}
      style={{
        display: inline ? "inline-flex" : "flex",
        flexDirection: inline ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: cfg.gap,
        padding: inline ? 0 : size === "lg" ? "24px 0" : "12px 0",
        ...style,
      }}
    >
      <svg
        width={cfg.width}
        height={cfg.height}
        viewBox="0 0 180 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible", flexShrink: 0 }}
        role="img"
        aria-label="Marshmallow roasting over campfire"
      >
        <defs>
          {/* Campfire ambient glow */}
          <radialGradient id={`${id}-fg`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#EA580C" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
          </radialGradient>

          {/* Marshmallow 3D cylinder clip path */}
          <clipPath id={`${id}-mbc`}>
            <rect x="78" y="40" width="48" height="36" rx="10" ry="10" />
          </clipPath>

          {/* Marshmallow soft fluffy body gradient */}
          <linearGradient id={`${id}-mbg`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="45%" stopColor="#F9F1E6" />
            <stop offset="85%" stopColor="#F3DFBE" />
            <stop offset="100%" stopColor="#E9B97C" />
          </linearGradient>

          {/* Marshmallow bottom fire heat reflection */}
          <linearGradient id={`${id}-bhg`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
            <stop offset="65%" stopColor="#F59E0B" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.65" />
          </linearGradient>

          {/* Wood stick gradient */}
          <linearGradient id={`${id}-stk`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5C3317" />
            <stop offset="30%" stopColor="#8B5226" />
            <stop offset="70%" stopColor="#A46332" />
            <stop offset="100%" stopColor="#4A260F" />
          </linearGradient>

          {/* Campfire log gradient */}
          <linearGradient id={`${id}-lg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A2810" />
            <stop offset="50%" stopColor="#6B3A19" />
            <stop offset="100%" stopColor="#2D1506" />
          </linearGradient>
        </defs>

        {/* Campfire ambient glow */}
        <ellipse
          className="m-loader-glow"
          cx="90"
          cy="115"
          rx="65"
          ry="25"
          fill={`url(#${id}-fg)`}
        />

        {/* CAMPFIRE LOGS */}
        <g transform="rotate(-14 75 130)">
          <rect x="52" y="125" width="52" height="13" rx="6" fill={`url(#${id}-lg)`} />
          <ellipse cx="54" cy="131.5" rx="4" ry="6" fill="#8B5226" />
          <ellipse cx="54" cy="131.5" rx="2" ry="3.5" fill="#5C3317" />
        </g>
        <g transform="rotate(16 105 130)">
          <rect x="76" y="126" width="54" height="13" rx="6" fill={`url(#${id}-lg)`} />
          <ellipse cx="128" cy="132.5" rx="4" ry="6" fill="#8B5226" />
          <ellipse cx="128" cy="132.5" rx="2" ry="3.5" fill="#5C3317" />
        </g>

        {/* Red hot coals */}
        <ellipse cx="90" cy="129" rx="22" ry="6" fill="#B91C1C" />
        <ellipse cx="90" cy="128" rx="14" ry="3.5" fill="#F97316" opacity="0.9" />
        <ellipse cx="90" cy="127.5" rx="7" ry="2" fill="#FEF08A" />

        {/* CAMPFIRE FLAMES */}
        <path
          className="m-loader-flame-back"
          d="M90 78 C75 96 66 110 70 126 C75 132 105 132 110 126 C114 110 105 96 90 78 Z"
          fill="#C2410C"
          opacity="0.8"
        />
        <path
          className="m-loader-flame-mid"
          d="M90 84 C80 100 72 112 76 126 C80 131 100 131 104 126 C108 112 100 100 90 84 Z"
          fill="#EA580C"
        />
        <path
          className="m-loader-flame-mid"
          d="M91 93 C83 105 78 114 81 125 C84 129 97 129 100 125 C103 114 98 105 91 93 Z"
          fill="#F59E0B"
        />
        <path
          className="m-loader-flame-core"
          d="M91 104 C86 112 83 118 85 125 C87 128 95 128 97 125 C99 118 95 112 91 104 Z"
          fill="#FEF08A"
        />

        {/* Rising Sparks / Embers */}
        <circle className="m-loader-ember-1" cx="86" cy="110" r="1.8" fill="#FDE047" />
        <circle className="m-loader-ember-2" cx="95" cy="108" r="1.5" fill="#F97316" />
        <circle className="m-loader-ember-3" cx="91" cy="102" r="1.2" fill="#FEF08A" />

        {/* SKEWER + MARSHMALLOW (Rocks & Rotates Together) */}
        <g className="m-loader-skewer">
          {/* Back stick segment */}
          <path
            d="M 12 71 L 82 60"
            stroke={`url(#${id}-stk)`}
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Hot steam wisps */}
          <path
            className="m-loader-steam-1"
            d="M 94 38 Q 91 32 96 26"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
          />
          <path
            className="m-loader-steam-2"
            d="M 110 36 Q 115 30 110 24"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
          />

          {/* MARSHMALLOW (Soft squash & rotating toasted surface) */}
          <g className="m-loader-squash">
            {/* Marshmallow body base */}
            <rect
              x="78"
              y="40"
              width="48"
              height="36"
              rx="10"
              ry="10"
              fill={`url(#${id}-mbg)`}
              stroke="var(--border-color, #E5D3B8)"
              strokeWidth="1"
            />

            {/* Toasted surface rolling over marshmallow (clipped to body) */}
            <g clipPath={`url(#${id}-mbc)`}>
              <g className="m-loader-toast">
                {/* Toast band 1 */}
                <path
                  d="M 74 38 Q 102 36 130 38 Q 130 46 102 44 Q 74 46 74 38 Z"
                  fill="#B45309"
                  opacity="0.85"
                />
                <ellipse cx="102" cy="40" rx="18" ry="3" fill="#78350F" opacity="0.75" />
                <circle cx="94" cy="40.5" r="1.5" fill="#451A03" opacity="0.8" />
                <circle cx="108" cy="39.5" r="1.2" fill="#451A03" opacity="0.7" />

                {/* Toast band 2 */}
                <path
                  d="M 74 58 Q 102 56 130 58 Q 130 67 102 65 Q 74 67 74 58 Z"
                  fill="#D97706"
                  opacity="0.8"
                />
                <ellipse cx="103" cy="61" rx="16" ry="3.5" fill="#92400E" opacity="0.75" />
                <circle cx="98" cy="61.5" r="1.3" fill="#451A03" opacity="0.8" />
                <circle cx="111" cy="60.5" r="1" fill="#451A03" opacity="0.7" />

                {/* Seamless wrap duplicate (shifted by 40px) */}
                <path
                  d="M 74 78 Q 102 76 130 78 Q 130 86 102 84 Q 74 86 74 78 Z"
                  fill="#B45309"
                  opacity="0.85"
                />
                <ellipse cx="102" cy="80" rx="18" ry="3" fill="#78350F" opacity="0.75" />
                <circle cx="94" cy="80.5" r="1.5" fill="#451A03" opacity="0.8" />
                <circle cx="108" cy="79.5" r="1.2" fill="#451A03" opacity="0.7" />

                <path
                  d="M 74 98 Q 102 96 130 98 Q 130 107 102 105 Q 74 107 74 98 Z"
                  fill="#D97706"
                  opacity="0.8"
                />
                <ellipse cx="103" cy="101" rx="16" ry="3.5" fill="#92400E" opacity="0.75" />
                <circle cx="98" cy="101.5" r="1.3" fill="#451A03" opacity="0.8" />
                <circle cx="111" cy="100.5" r="1" fill="#451A03" opacity="0.7" />
              </g>

              {/* Bottom heat glow from campfire */}
              <rect
                x="78"
                y="40"
                width="48"
                height="36"
                rx="10"
                ry="10"
                fill={`url(#${id}-bhg)`}
              />
              {/* Top highlight sheen */}
              <ellipse cx="102" cy="43" rx="18" ry="2" fill="#FFFFFF" opacity="0.65" />
            </g>

            {/* Cute squinty smiling face */}
            <g opacity="0.85">
              <path
                d="M 94 56 Q 96.5 53 99 56"
                stroke="#451A03"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 106 54 Q 108.5 51 111 54"
                stroke="#451A03"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 101 60 Q 103 63 105 60"
                stroke="#78350F"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />
              <ellipse cx="93" cy="58" rx="2.5" ry="1.2" fill="#F59E0B" opacity="0.7" />
              <ellipse cx="112" cy="56" rx="2.5" ry="1.2" fill="#F59E0B" opacity="0.7" />
            </g>
          </g>

          {/* Front stick segment */}
          <path
            d="M 124 53.5 L 158 48"
            stroke={`url(#${id}-stk)`}
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          <path
            d="M 158 48 L 165 47"
            stroke="#A46332"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {(displayLabel || sublabel) && (
        <div style={{ textAlign: "center" }}>
          {displayLabel && (
            <div
              style={{
                fontSize: cfg.labelSize,
                fontWeight: 600,
                color: "var(--primary)",
                letterSpacing: "0.2px",
              }}
            >
              {displayLabel}
            </div>
          )}
          {sublabel && (
            <div
              style={{
                fontSize: cfg.sublabelSize,
                color: "var(--text-secondary)",
                marginTop: "2px",
              }}
            >
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarshmallowLoader;
