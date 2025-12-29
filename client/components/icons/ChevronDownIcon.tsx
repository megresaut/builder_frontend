interface ChevronDownIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({ width = 24, height = 24, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
};
