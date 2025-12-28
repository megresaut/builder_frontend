import React from "react";

interface ClockIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const ClockIcon: React.FC<ClockIconProps> = ({
  width = 16,
  height = 16,
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
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

ClockIcon.displayName = "ClockIcon";
