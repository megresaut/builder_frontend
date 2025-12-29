import React from "react";

interface ExpandCollapseIconProps {
  width?: number;
  height?: number;
  className?: string;
  expanded?: boolean;
}

export const ExpandCollapseIcon: React.FC<ExpandCollapseIconProps> = ({
  width = 18,
  height = 18,
  className = "",
  expanded = false,
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
    {expanded ? (
      <path d="m18 15-6-6-6 6" />
    ) : (
      <path d="m6 9 6 6 6-6" />
    )}
  </svg>
);

ExpandCollapseIcon.displayName = "ExpandCollapseIcon";
