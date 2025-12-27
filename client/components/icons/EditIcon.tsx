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
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12.8536 1.14645C13.0488 0.951184 13.3654 0.951184 13.5607 1.14645L14.8536 2.43934C15.0488 2.63461 15.0488 2.95119 14.8536 3.14645L5.35355 12.6464C5.26161 12.7384 5.13669 12.7901 5.00632 12.7918L2.01053 12.8496C1.73435 12.8532 1.50799 12.6318 1.5045 12.3556L1.44679 9.35978C1.44506 9.22941 1.49673 9.10449 1.58869 9.01253L11.0887 -0.487479M12.1464 2.85355L13.1464 3.85355"
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
    />
  </svg>
);

EditIcon.displayName = "EditIcon";
