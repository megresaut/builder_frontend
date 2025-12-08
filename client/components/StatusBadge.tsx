import React from "react";

interface StatusBadgeProps {
  status:
    | "Paid"
    | "Pending"
    | "Approved"
    | "Overdue"
    | "Draft"
    | "active"
    | "inactive";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = (
    status: StatusBadgeProps["status"],
  ): { backgroundColor: string; color: string } => {
    switch (status) {
      case "Paid":
        return {
          backgroundColor: "rgb(210, 249, 231)",
          color: "rgb(39, 176, 125)",
        };
      case "Pending":
        return {
          backgroundColor: "rgb(254, 242, 205)",
          color: "rgb(214, 133, 10)",
        };
      case "Approved":
        return {
          backgroundColor: "rgb(226, 236, 254)",
          color: "rgb(36, 99, 235)",
        };
      case "Overdue":
        return {
          backgroundColor: "rgb(255, 227, 224)",
          color: "rgb(215, 42, 29)",
        };
      case "Draft":
        return {
          backgroundColor: "rgb(245, 245, 245)",
          color: "rgb(100, 100, 100)",
        };
      case "active":
        return {
          backgroundColor: "rgb(200, 255, 220)",
          color: "rgb(5, 150, 105)",
        };
      case "inactive":
        return {
          backgroundColor: "rgb(255, 245, 200)",
          color: "rgb(217, 119, 6)",
        };
      default:
        return {
          backgroundColor: "rgb(245, 245, 245)",
          color: "rgb(100, 100, 100)",
        };
    }
  };

  const getStatusIcon = (status: StatusBadgeProps["status"]) => {
    switch (status) {
      case "Paid":
      case "Approved":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              width: "16px",
              height: "16px",
            }}
          >
            <path d="M21.801 10A10 10 0 1 1 17 3.335" />
            <path d="m9 11 3 3L22 4" />
          </svg>
        );
      case "Pending":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              width: "16px",
              height: "16px",
            }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        );
      case "Overdue":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              width: "16px",
              height: "16px",
            }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        );
      default:
        return null;
    }
  };

  const styles = getStatusStyles(status);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        gap: "6px",
        padding: "4px 12px",
        borderRadius: "16px",
        fontSize: "14px",
        fontWeight: "400",
        letterSpacing: "-0.32px",
        lineHeight: "22.4px",
        textTransform: "capitalize",
        width: "fit-content",
      }}
    >
      {getStatusIcon(status)}
      {status}
    </div>
  );
};
