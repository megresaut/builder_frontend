import React from "react";

interface CalendarIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const CalendarIcon: React.FC<CalendarIconProps> = ({
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
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

CalendarIcon.displayName = "CalendarIcon";
