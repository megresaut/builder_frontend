import React from "react";

interface DownloadIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const DownloadIcon: React.FC<DownloadIconProps> = ({
  width = 18,
  height = 18,
  color = "currentColor",
  className = "",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M9 11.25L5.625 7.875M9 11.25L12.375 7.875M9 11.25V2.25M15.75 15.75H2.25"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

DownloadIcon.displayName = "DownloadIcon";
