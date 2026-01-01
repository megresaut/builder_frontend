import React from "react";

interface PlusIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const PlusIcon: React.FC<PlusIconProps> = ({
  width = 18,
  height = 18,
  className = "",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
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
    <path d="M12 5v14M5 12h14" />
  </svg>
);

PlusIcon.displayName = "PlusIcon";
