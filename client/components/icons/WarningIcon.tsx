interface WarningIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const WarningIcon: React.FC<WarningIconProps> = ({
  width = 24,
  height = 24,
  color = "currentColor",
  className = "",
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.27 20.55 2.59 20.72C2.91 20.89 3.27 20.98 3.64 21H20.36C20.73 21 21.09 20.91 21.41 20.74C21.73 20.57 22 20.32 22.18 20.02C22.36 19.72 22.45 19.38 22.45 19.02C22.45 18.66 22.36 18.32 22.18 18.02L13.71 3.86C13.53 3.56 13.26 3.32 12.94 3.15C12.62 2.98 12.26 2.89 11.89 2.89C11.52 2.89 11.17 2.98 10.85 3.15C10.53 3.32 10.26 3.56 10.08 3.86H10.29Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
