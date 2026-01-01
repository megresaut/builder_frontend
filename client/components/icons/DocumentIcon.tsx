import React from "react";

interface DocumentIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const DocumentIcon: React.FC<DocumentIconProps> = ({
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
    <line x1="4" x2="20" y1="9" y2="9" />
    <line x1="4" x2="20" y1="15" y2="15" />
    <line x1="10" x2="8" y1="3" y2="21" />
    <line x1="16" x2="14" y1="3" y2="21" />
  </svg>
);

DocumentIcon.displayName = "DocumentIcon";
