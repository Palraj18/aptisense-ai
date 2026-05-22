import React from "react";

export const ProgressRing = ({
  value = 0,
  size = 70,
  color = "#7C3AED"
}) => {

  const safeValue = Number(value) || 0;
  const safeSize = Number(size) || 70;

  const stroke = 7;
  const radius = (safeSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (safeValue / 100) * circumference;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: safeSize, height: safeSize }}
    >
      <svg
        width={safeSize}
        height={safeSize}
        className="-rotate-90"
      >
        <circle
          cx={safeSize / 2}
          cy={safeSize / 2}
          r={radius}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
          fill="none"
        />

        <circle
          cx={safeSize / 2}
          cy={safeSize / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
          style={{
            filter: `drop-shadow(0 0 10px ${color})`
          }}
        />
      </svg>

      <span className="absolute text-sm font-bold text-white">
        {safeValue}%
      </span>
    </div>
  );
};