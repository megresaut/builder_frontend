import React from "react";

interface CloseIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const CloseIcon: React.FC<CloseIconProps> = ({
  width = 12,
  height = 12,
  className = "",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    className={className}
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

CloseIcon.displayName = "CloseIcon";
