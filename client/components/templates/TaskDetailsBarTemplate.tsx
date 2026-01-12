import React from "react";
import { StatusSelectField } from "@/components/forms/StatusSelectField";
import { PrioritySelectField } from "@/components/forms/PrioritySelectField";
import { DateField } from "@/components/forms/DateField";

interface TaskDetailsBarTemplateProps {
  status: string;
  priority: string;
  dueDate: Date | string | null;
  onStatusChange: (newStatus: string) => void;
  onPriorityChange: (newPriority: string) => void;
  onDueDateChange: (newDate: Date | string | null) => void;
}

export const TaskDetailsBarTemplate: React.FC<TaskDetailsBarTemplateProps> = ({
  status,
  priority,
  dueDate,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
}) => {
  return (
    <div className="flex flex-wrap items-end gap-6 w-full p-6">
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
    </div>
  );
};

export default TaskDetailsBarTemplate;
