import React from "react";

interface DotsIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const DotsIcon: React.FC<DotsIconProps> = ({
  width = 18,
  height = 18,
  color = "currentColor",
  className = "",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

DotsIcon.displayName = "DotsIcon";
