import React from "react";

interface ApproveIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const ApproveIcon: React.FC<ApproveIconProps> = ({
  width = 18,
  height = 18,
  className = "",
}) => (
  <img
    loading="lazy"
    src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/e9050bb8a2ada9e901e47d68747b77108632e1b9?placeholderIfAbsent=true"
    width={width}
    height={height}
    alt="Approve"
    className={className}
  />
);

ApproveIcon.displayName = "ApproveIcon";
