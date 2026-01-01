import React from "react";

interface ArrowBackIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const ArrowBackIcon: React.FC<ArrowBackIconProps> = ({
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
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

ArrowBackIcon.displayName = "ArrowBackIcon";
