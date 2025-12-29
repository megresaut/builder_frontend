import React from "react";

interface DollarIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const DollarIcon: React.FC<DollarIconProps> = ({
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
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

DollarIcon.displayName = "DollarIcon";
