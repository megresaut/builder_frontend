import React from "react";

interface StatusIndicatorProps {
  type: "priority" | "status";
  value: string;
  size?: "sm" | "md";
}

const priorityColors: Record<string, string> = {
  low: "#059669",      // green
  normal: "#2463EB",   // blue
  medium: "#2463EB",   // blue (alias for normal)
  high: "#D97706",     // orange
  urgent: "#DC2626",   // red
};

const statusColors: Record<string, string> = {
  not_started: "#D97706",    // orange
  open: "#D97706",            // orange (alias)
  in_progress: "#2463EB",     // blue
  completed: "#059669",       // green
  deferred: "#B45309",        // amber
  closed: "#475569",          // slate (terminal — distinct from completed)
  cancelled: "#E11D48",       // rose
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  type,
  value,
  size = "md",
}) => {
  const colorMap = type === "priority" ? priorityColors : statusColors;
  const color = colorMap[value.toLowerCase()] || "#6B7280"; // default gray
  
  const dotSize = size === "sm" ? "6px" : "8px";

  return (
    <div
      style={{
        width: dotSize,
        height: dotSize,
        borderRadius: "50%",
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
};

StatusIndicator.displayName = "StatusIndicator";
