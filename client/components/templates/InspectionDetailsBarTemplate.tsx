import React, { useState } from "react";
import { DateField } from "@/components/forms/DateField";
import { ChevronDownIcon } from "@/components/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface InspectionDetailsBarTemplateProps {
  status: "In Progress" | "Completed";
  dueDate: string | Date | null;
  onStatusChange: (newStatus: "In Progress" | "Completed") => void;
  onDueDateChange: (newDate: string | Date | null) => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case "Completed":
      return "#059669";
    case "In Progress":
      return "#f59e0b";
    default:
      return "#525252";
  }
};

export const InspectionDetailsBarTemplate: React.FC<InspectionDetailsBarTemplateProps> = ({
  status,
  dueDate,
  onStatusChange,
  onDueDateChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-end gap-6 w-full p-4">
      <div className="flex-1 min-w-[180px]">
        <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">Status</label>
        <div className="relative">
          <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <PopoverTrigger asChild>
              <button
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-normal hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getStatusColor(status) }}
                  />
                  <span className="text-gray-900">{status}</span>
                </div>
                <ChevronDownIcon width={16} height={16} className="text-gray-600" />
              </button>
            </PopoverTrigger>

            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 min-w-[180px]" align="start">
              <div className="flex flex-col">
                {["In Progress", "Completed"].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onStatusChange(option as "In Progress" | "Completed");
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getStatusColor(option) }}
                    />
                    <span className="text-gray-900">{option}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
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
