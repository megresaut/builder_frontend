import React from "react";

type TaskPriority = "Low" | "Normal" | "High" | "low" | "normal" | "high";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  Low: { label: "Low", color: "#059669" },
  low: { label: "Low", color: "#059669" },
  Normal: { label: "Normal", color: "#2463eb" },
  normal: { label: "Normal", color: "#2463eb" },
  High: { label: "High", color: "#d97706" },
  high: { label: "High", color: "#d97706" },
};

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({
  priority,
}) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG["Normal"];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        color: "#303030",
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

export default TaskPriorityBadge;
