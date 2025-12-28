import React from "react";

interface UserIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const UserIcon: React.FC<UserIconProps> = ({
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
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.5" fill="none" />
  </svg>
);

UserIcon.displayName = "UserIcon";
