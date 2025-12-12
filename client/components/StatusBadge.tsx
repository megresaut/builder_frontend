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
    | "Cancelled";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = (status: StatusBadgeProps["status"]): string => {
    switch (status) {
      case "Paid":
        return "rgb(39, 176, 125)";
      case "Pending":
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
      case "Cancelled":
        return "rgb(100, 100, 100)";
      default:
        return "rgb(100, 100, 100)";
    }
  };

  const dotColor = getStatusColor(status);

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
        textTransform: "capitalize",
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
      {status}
    </div>
  );
};
