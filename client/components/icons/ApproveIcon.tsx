import React from "react";

interface ApproveIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const ApproveIcon: React.FC<ApproveIconProps> = ({
  width = 16,
  height = 16,
  className = "",
}) => (
  <img
    loading="lazy"
    src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b13c8f79f0bbe495c159d6f52432780ef6582cfb?placeholderIfAbsent=true"
    width={width}
    height={height}
    alt="Approve"
    className={className}
  />
);

ApproveIcon.displayName = "ApproveIcon";
