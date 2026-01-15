import React from "react";

interface HamburgerIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const HamburgerIcon: React.FC<HamburgerIconProps> = ({
  width = 16,
  height = 16,
  color = "#09090B",
  className = "",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M2 4H14M2 8H14M2 12H14"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

HamburgerIcon.displayName = "HamburgerIcon";
