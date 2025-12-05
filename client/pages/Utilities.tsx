export const StatusBadge = ({ status }: { status: "pushed" | "push-failed" }) => {
  if (status === "pushed") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
        style={{
          backgroundColor: "rgb(209, 250, 229)",
          color: "rgb(5, 150, 105)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_bills_pushed)">
            <path
              d="M5.00065 8.00016L7.00065 10.0002L11.0007 6.00016M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z"
              stroke="#059669"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_bills_pushed">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
        Pushed
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1"
      style={{
        backgroundColor: "rgb(255, 228, 223)",
        color: "rgb(217, 119, 6)",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_bills_failed)">
          <path
            d="M8.00065 5.3335V8.00016M8.00065 10.6668H8.00732M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z"
            stroke="#D97706"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_bills_failed">
            <rect width="16" height="16" fill="white" />
          </clipPath>
        </defs>
      </svg>
      Push Failed
    </span>
  );
};
