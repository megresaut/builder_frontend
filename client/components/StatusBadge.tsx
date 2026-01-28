import React from "react";

interface StatusBadgeProps {
  status:
    | "Paid"
    | "Pending"
    | "Pending Approval"
    | "Partially Paid"
    | "Approved"
    | "Overdue"
    | "Draft"
    | "active"
    | "inactive"
    | "Dispatched"
    | "New"
    | "Completed"
    | "Cancelled"
    | "awaiting-submission"
    | "submitted"
    | "rejected";
  variant?: "fto-status" | "timesheet-status";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const getStatusColor = (status: StatusBadgeProps["status"], variant?: string): string => {
    // Timesheet status colors
    if (variant === "timesheet-status") {
      switch (status) {
        case "awaiting-submission":
          return "rgb(214, 133, 10)"; // Orange
        case "submitted":
          return "rgb(36, 99, 235)"; // Blue
        case "approved":
          return "rgb(39, 176, 125)"; // Green
        case "rejected":
          return "rgb(215, 42, 29)"; // Red
        default:
          return "rgb(100, 100, 100)";
      }
    }
    
    // FTO status colors
    if (variant === "fto-status") {
      switch (status) {
        case "New":
          return "rgb(36, 99, 235)"; // Blue
        case "Dispatched":
          return "rgb(36, 99, 235)"; // Blue
        case "Completed":
          return "rgb(39, 176, 125)"; // Green
        case "pending-approval":
          return "rgb(214, 133, 10)"; // Orange
        default:
          return "rgb(100, 100, 100)";
      }
    }
    
    // Default status colors
    switch (status) {
      case "Paid":
        return "rgb(39, 176, 125)";
      case "Pending":
      case "Pending Approval":
      case "Partially Paid":
        return "rgb(214, 133, 10)";
      case "Approved":
        return "rgb(36, 99, 235)";
      case "Overdue":
        return "rgb(215, 42, 29)";
      case "Draft":
        return "rgb(100, 100, 100)";
      case "active":
        return "rgb(5, 150, 105)";
      case "inactive":
        return "rgb(217, 119, 6)";
      case "Dispatched":
        return "rgb(36, 99, 235)";
      case "New":
        return "rgb(36, 99, 235)";
      case "Completed":
        return "rgb(39, 176, 125)";
      case "Cancelled":
        return "rgb(100, 100, 100)";
      default:
        return "rgb(100, 100, 100)";
    }
  };
  
  const getDisplayLabel = (status: StatusBadgeProps["status"]): string => {
    if (variant === "timesheet-status") {
      switch (status) {
        case "awaiting-submission":
          return "Awaiting Submission";
        case "submitted":
          return "Submitted";
        case "approved":
          return "Approved";
        case "rejected":
          return "Rejected";
        default:
          return status;
      }
    }
    return status;
  };

  const dotColor = getStatusColor(status, variant);
  const displayLabel = getDisplayLabel(status);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        color: dotColor,
        gap: "8px",
        fontSize: "14px",
        fontWeight: "400",
        letterSpacing: "-0.32px",
        lineHeight: "22.4px",
        textTransform: variant === "timesheet-status" ? "none" : "capitalize",
        width: "fit-content",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: dotColor,
          flexShrink: 0,
        }}
      />
      {displayLabel}
    </div>
  );
};
