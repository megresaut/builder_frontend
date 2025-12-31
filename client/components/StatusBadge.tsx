import React from "react";

type FTOStatusType = "pending-approval" | "dispatched" | "approved";
type TimesheetStatusType = "awaiting-submission" | "submitted" | "rejected" | "approved";
type ApprovalStatusType = "pending" | "approved" | "rejected";
type LegacyStatusType = "Paid" | "Pending" | "Pending Approval" | "Partially Paid" | "Overdue" | "Draft" | "active" | "inactive" | "Cancelled";

type StatusType = FTOStatusType | TimesheetStatusType | ApprovalStatusType | LegacyStatusType;

interface StatusBadgeProps {
  status: StatusType;
  variant?: "fto-status" | "timesheet-status" | "approval-status" | "legacy";
}

const FTO_STATUS_CONFIG: Record<FTOStatusType, { label: string; color: string }> = {
  "pending-approval": { label: "New", color: "#1E40AF" },
  dispatched: { label: "Dispatched", color: "#B45309" },
  approved: { label: "Completed", color: "#166534" },
};

const TIMESHEET_STATUS_CONFIG: Record<TimesheetStatusType, { label: string; color: string }> = {
  "awaiting-submission": { label: "Awaiting Submission", color: "#3730A3" },
  submitted: { label: "Submitted", color: "#991B1B" },
  rejected: { label: "Rejected", color: "#DC2626" },
  approved: { label: "Approved", color: "#065F46" },
};

const APPROVAL_STATUS_CONFIG: Record<ApprovalStatusType, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#D97706" },
  approved: { label: "Approved", color: "#059669" },
  rejected: { label: "Rejected", color: "#DC2626" },
};

const LEGACY_STATUS_CONFIG: Record<LegacyStatusType, { label: string; color: string }> = {
  Paid: { label: "Paid", color: "rgb(39, 176, 125)" },
  Pending: { label: "Pending", color: "rgb(214, 133, 10)" },
  "Pending Approval": { label: "Pending Approval", color: "rgb(214, 133, 10)" },
  "Partially Paid": { label: "Partially Paid", color: "rgb(214, 133, 10)" },
  Approved: { label: "Approved", color: "rgb(36, 99, 235)" },
  Overdue: { label: "Overdue", color: "rgb(215, 42, 29)" },
  Draft: { label: "Draft", color: "rgb(100, 100, 100)" },
  active: { label: "Active", color: "rgb(5, 150, 105)" },
  inactive: { label: "Inactive", color: "rgb(217, 119, 6)" },
  Cancelled: { label: "Cancelled", color: "rgb(100, 100, 100)" },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = "legacy" }) => {
  let config: { label: string; color: string } | undefined;

  if (variant === "fto-status") {
    config = FTO_STATUS_CONFIG[status as FTOStatusType];
  } else if (variant === "timesheet-status") {
    config = TIMESHEET_STATUS_CONFIG[status as TimesheetStatusType];
  } else {
    config = LEGACY_STATUS_CONFIG[status as LegacyStatusType];
  }

  if (!config) {
    config = { label: String(status), color: "rgb(100, 100, 100)" };
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        color: config.color,
        gap: "8px",
        fontSize: "14px",
        fontWeight: "400",
        letterSpacing: "-0.32px",
        lineHeight: "22.4px",
        width: "fit-content",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: config.color,
          flexShrink: 0,
        }}
      />
      {config.label}
    </div>
  );
};
