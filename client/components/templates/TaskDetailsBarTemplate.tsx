import React from "react";
import { StatusSelectField } from "@/components/forms/StatusSelectField";
import { PrioritySelectField } from "@/components/forms/PrioritySelectField";
import { DateField } from "@/components/forms/DateField";

interface TaskDetailsBarTemplateProps {
  status: string;
  priority: string;
  dueDate: Date | string | null;
  lastUpdated: string;
  onStatusChange: (newStatus: string) => void;
  onPriorityChange: (newPriority: string) => void;
  onDueDateChange: (newDate: Date | string | null) => void;
  variant?: "white" | "gray";
}

export const TaskDetailsBarTemplate: React.FC<TaskDetailsBarTemplateProps> = ({
  status,
  priority,
  dueDate,
  lastUpdated,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  variant = "white",
}) => {
  const bgClass = variant === "gray" ? "bg-[#f5f5f5]" : "bg-white";

  return (
    <div className={`flex flex-wrap items-end gap-6 w-full mb-2 p-6 rounded-lg ${bgClass}`}>
      <div className="flex-1 min-w-[180px]">
        <StatusSelectField
          label="Status"
          value={status}
          onChange={onStatusChange}
        />
      </div>

      <div className="flex-1 min-w-[180px]">
        <PrioritySelectField
          label="Priority"
          value={priority}
          onChange={onPriorityChange}
        />
      </div>

      <div className="flex-1 min-w-[180px]">
        <DateField
          label="Due Date"
          value={dueDate}
          onChange={onDueDateChange}
          returnFormat="Date"
        />
      </div>

      <div className="flex-1 flex justify-end text-xs text-[#717179] font-medium pb-1">
        Last Updated <span className="text-[#303030] font-bold ml-1">{lastUpdated}</span>
      </div>
    </div>
  );
};

export default TaskDetailsBarTemplate;
