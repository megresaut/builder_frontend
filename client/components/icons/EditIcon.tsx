import React from "react";

interface EditIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const EditIcon: React.FC<EditIconProps> = ({
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
      d="M10.7145 2.68607C11.1052 2.29537 11.7383 2.29537 12.129 2.68607L11.9749 2.84016C12.3656 3.23085 12.3656 3.86402 11.9749 4.25472L5.6117 10.6179C5.46262 10.767 5.28452 10.8795 5.08646 10.9445L2.03645 11.7978C1.74626 11.8816 1.44259 11.7399 1.35879 11.4497L0.505513 8.39971C0.440448 8.20165 0.552982 8.02355 0.701865 7.87467L7.06503 1.51149C7.45572 1.1208 8.08889 1.1208 8.47958 1.51149L10.7145 2.68607Z"
      fill={color}
    />
  </svg>
);

EditIcon.displayName = "EditIcon";
