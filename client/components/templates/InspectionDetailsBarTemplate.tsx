import React from "react";
import { DateField } from "@/components/forms/DateField";
import { SelectField } from "@/components/forms/SelectField";

interface InspectionDetailsBarTemplateProps {
  status: "In Progress" | "Completed";
  dueDate: string | Date | null;
  onStatusChange: (newStatus: "In Progress" | "Completed") => void;
  onDueDateChange: (newDate: string | Date | null) => void;
}

const STATUS_OPTIONS = [
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
];

export const InspectionDetailsBarTemplate: React.FC<InspectionDetailsBarTemplateProps> = ({
  status,
  dueDate,
  onStatusChange,
  onDueDateChange,
}) => {
  return (
    <div className="flex flex-wrap items-end gap-6 w-full p-4">
      <div className="flex-1 min-w-[180px]">
        <SelectField
          label="Status"
          value={status}
          onChange={(value) => onStatusChange(value as "In Progress" | "Completed")}
          options={STATUS_OPTIONS}
          placeholder="Select status"
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
