import React from "react";

interface EmailIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const EmailIcon: React.FC<EmailIconProps> = ({
  width = 14,
  height = 14,
  color = "currentColor",
  className = "",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M11.6673 11.667H2.33398C1.59961 11.667 1.00065 11.068 1.00065 10.3337V3.66699C1.00065 2.93262 1.59961 2.33366 2.33398 2.33366H11.6673C12.4017 2.33366 13.0007 2.93262 13.0007 3.66699V10.3337C13.0007 11.068 12.4017 11.667 11.6673 11.667Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.33398 3.33301L7.00065 7.66634L12.6673 3.33301"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

EmailIcon.displayName = "EmailIcon";
