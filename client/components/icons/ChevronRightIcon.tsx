interface ChevronRightIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const ChevronRightIcon: React.FC<ChevronRightIconProps> = ({ width = 24, height = 24, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
};
