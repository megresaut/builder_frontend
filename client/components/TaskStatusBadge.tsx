import React from "react";

type TaskStatus = "Not Started" | "In Progress" | "Completed" | "not_started" | "in_progress" | "completed";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  "Not Started": { label: "Not Started", color: "#d97706" },
  "not_started": { label: "Not Started", color: "#d97706" },
  "In Progress": { label: "In Progress", color: "#2463eb" },
  "in_progress": { label: "In Progress", color: "#2463eb" },
  "Completed": { label: "Completed", color: "#059669" },
  "completed": { label: "Completed", color: "#059669" },
};

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG["Not Started"];

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

export default TaskStatusBadge;
