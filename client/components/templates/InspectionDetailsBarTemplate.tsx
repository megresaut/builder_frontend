import React from "react";
import { SelectField } from "@/components/forms/SelectField";
import { DateField } from "@/components/forms/DateField";

interface InspectionDetailsBarTemplateProps {
  status: "In Progress" | "Completed";
  dueDate: string | Date | null;
  onStatusChange: (newStatus: "In Progress" | "Completed") => void;
  onDueDateChange: (newDate: string | Date | null) => void;
}

export const InspectionDetailsBarTemplate: React.FC<InspectionDetailsBarTemplateProps> = ({
  status,
  dueDate,
  onStatusChange,
  onDueDateChange,
}) => {
  const statusOptions = [
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
  ];

  return (
    <div className="flex flex-wrap items-end gap-6 w-full p-4">
      <div className="flex-1 min-w-[180px]">
        <SelectField
          label="Status"
          value={status}
          onChange={(value) => onStatusChange(value as "In Progress" | "Completed")}
          options={statusOptions}
        />
      </div>

      <div className="flex-1 min-w-[180px]">
        <DateField
          label="Inspection Due Date"
          value={dueDate}
          onChange={onDueDateChange}
          returnFormat="Date"
        />
      </div>
    </div>
  );
};

export default InspectionDetailsBarTemplate;
