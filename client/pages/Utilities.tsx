export const StatusBadge = ({
  status,
}: {
  status: "pushed" | "push-failed" | "dispatched" | "approved" | "pending-approval";
}) => {
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

  if (status === "approved") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-1"
        style={{
          backgroundColor: "rgb(220, 252, 231)",
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
          <g clipPath="url(#clip0_approved)">
            <path
              d="M4.99967 8.00004L6.99967 10L10.9997 6.00004M14.6663 8.00004C14.6663 11.6819 11.6816 14.6667 7.99967 14.6667C4.31778 14.6667 1.33301 11.6819 1.33301 8.00004C1.33301 4.31814 4.31778 1.33337 7.99967 1.33337C11.6816 1.33337 14.6663 4.31814 14.6663 8.00004Z"
              stroke="#059669"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_approved">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
        Approved
      </span>
    );
  }

  if (status === "pending-approval") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-1"
        style={{
          backgroundColor: "rgb(239, 246, 255)",
          color: "rgb(36, 99, 235)",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.91602 7H11.0827"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Pending Approval
      </span>
    );
  }

  if (status === "dispatched") {
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
          <g clipPath="url(#clip0_dispatched)">
            <path
              d="M8.00065 5.3335V8.00016M8.00065 10.6668H8.00732M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z"
              stroke="#D97706"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_dispatched">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
        Dispatched
      </span>
    );
  }

  // Default: push-failed
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
