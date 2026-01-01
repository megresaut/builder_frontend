import React from "react";

interface EyeIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const EyeIcon: React.FC<EyeIconProps> = ({
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
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

EyeIcon.displayName = "EyeIcon";
