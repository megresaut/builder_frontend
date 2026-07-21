import React from "react";

interface SparkleIconProps {
  width?: number;
  height?: number;
  className?: string;
}

/**
 * SparkleIcon — a clean monochrome two-star sparkle for AI-assisted actions.
 * Renders in currentColor so it inherits the button/text color (no tacky
 * multicolor emoji).
 */
export const SparkleIcon: React.FC<SparkleIconProps> = ({
  width = 16,
  height = 16,
  className = "",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M11.5 2.5l1.7 4.8 4.8 1.7-4.8 1.7-1.7 4.8-1.7-4.8L5 9l4.8-1.7z" />
    <path d="M18 13.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" />
  </svg>
);

SparkleIcon.displayName = "SparkleIcon";
