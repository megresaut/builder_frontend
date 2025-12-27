import React from "react";

interface EditIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const EditIcon: React.FC<EditIconProps> = ({
  width = 18,
  height = 18,
  color = "currentColor",
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
      d="M11.3333 1.33337L14.6667 4.66671M1 15H4.33333L13.5 5.83337C13.942 5.39135 14.1906 4.78794 14.1906 4.15837C14.1906 3.52881 13.942 2.9254 13.5 2.48337C13.058 2.04135 12.4546 1.79272 11.825 1.79272C11.1954 1.79272 10.592 2.04135 10.15 2.48337L1 11.6667V15Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1 15H15"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

EditIcon.displayName = "EditIcon";
