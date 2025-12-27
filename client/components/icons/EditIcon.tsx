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
  <img
    loading="lazy"
    src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/a3538686d5a58b85f4e48b4bddb618c6b8c6ffb3?placeholderIfAbsent=true"
    width={width}
    height={height}
    alt="Edit"
    className={className}
    style={{ objectFit: "contain" }}
  />
);

EditIcon.displayName = "EditIcon";
