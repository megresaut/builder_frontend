import React from "react";

interface ArrowForwardIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const ArrowForwardIcon: React.FC<ArrowForwardIconProps> = ({
  width = 20,
  height = 20,
  className = "",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

ArrowForwardIcon.displayName = "ArrowForwardIcon";
