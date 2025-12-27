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
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M13.5 2.25L15.75 4.5M1.5 16.5H3.75L14.625 5.625C14.9234 5.32663 15.0898 4.92 15.0898 4.5C15.0898 4.08 14.9234 3.67337 14.625 3.375L14.625 3.375C14.3266 3.07663 13.92 2.91019 13.5 2.91019C13.08 2.91019 12.6734 3.07663 12.375 3.375L1.5 14.25V16.5Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.5 16.5H16.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

EditIcon.displayName = "EditIcon";
