interface PinIconProps {
  width?: number;
  height?: number;
  className?: string;
  isPinned?: boolean;
}

export const PinIcon: React.FC<PinIconProps> = ({ width = 24, height = 24, className = "", isPinned = false }) => {
  if (isPinned) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M4 7h16M9 4v4M15 4v4M6 11v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9M9 14h6M9 18h6" />
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10.5 1.5H3.75A2.25 2.25 0 0 0 1.5 3.75V20.25A2.25 2.25 0 0 0 3.75 22.5H20.25A2.25 2.25 0 0 0 22.5 20.25V13.5M16.5 6L8.25 14.25M8.25 6L16.5 14.25" />
    </svg>
  );
};
