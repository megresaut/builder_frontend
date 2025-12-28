import React from "react";

interface SearchIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const SearchIcon: React.FC<SearchIconProps> = ({
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
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.34-4.34" />
  </svg>
);

SearchIcon.displayName = "SearchIcon";
