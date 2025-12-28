import React from "react";

interface BellIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const BellIcon: React.FC<BellIconProps> = ({
  width = 18,
  height = 18,
  className = "",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10.268 21a2 2 0 0 0 3.464 0" />
    <path d="M3.262 15.326A7 7 0 1 0 19.659 9" />
  </svg>
);

BellIcon.displayName = "BellIcon";
