import React from "react";

interface RecordBillIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const RecordBillIcon: React.FC<RecordBillIconProps> = ({
  width = 22,
  height = 22,
  className = "",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

RecordBillIcon.displayName = "RecordBillIcon";
