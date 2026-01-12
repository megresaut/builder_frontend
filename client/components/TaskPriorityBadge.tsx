import React from "react";

type TaskPriority = "Low" | "Normal" | "High" | "low" | "normal" | "high";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

const PRIORITY_CONFIG: Record<string, { 
  label: string; 
  bgColor: string; 
  textColor: string;
  icon: string;
}> = {
  "Low": {
    label: "Low",
    bgColor: "#d1fae5",
    textColor: "#059669",
    icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d00136e8e1c6cf58d6c815854d88154dd44b4c88?placeholderIfAbsent=true",
  },
  "low": {
    label: "Low",
    bgColor: "#d1fae5",
    textColor: "#059669",
    icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d00136e8e1c6cf58d6c815854d88154dd44b4c88?placeholderIfAbsent=true",
  },
  "Normal": {
    label: "Normal",
    bgColor: "#dbe9fe",
    textColor: "#2463eb",
    icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/c9d0f3b68ca31873b5757330959196672d1cd002?placeholderIfAbsent=true",
  },
  "normal": {
    label: "Normal",
    bgColor: "#dbe9fe",
    textColor: "#2463eb",
    icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/c9d0f3b68ca31873b5757330959196672d1cd002?placeholderIfAbsent=true",
  },
  "High": {
    label: "High",
    bgColor: "#ffd1d1",
    textColor: "#d97706",
    icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b49fb94e49bc0470a1d2a839219ff96b38013f9d?placeholderIfAbsent=true",
  },
  "high": {
    label: "High",
    bgColor: "#ffd1d1",
    textColor: "#d97706",
    icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b49fb94e49bc0470a1d2a839219ff96b38013f9d?placeholderIfAbsent=true",
  },
};

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({ priority }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG["Normal"];

  return (
    <div
      className="flex items-center gap-1 px-3 py-1 rounded-2xl font-['Geist',sans-serif] text-sm font-normal tracking-[-0.28px] leading-[1.4] whitespace-nowrap w-fit"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
    >
      <img
        loading="lazy"
        src={config.icon}
        alt=""
        className="w-3.5 h-3.5 object-contain flex-shrink-0"
      />
      <span>{config.label}</span>
    </div>
  );
};

export default TaskPriorityBadge;
