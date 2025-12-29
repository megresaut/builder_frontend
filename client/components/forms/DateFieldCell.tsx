import React, { useMemo } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldCellShell } from "./FieldCellShell";
import { format } from "date-fns";

interface DateFieldCellProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  id?: string;
}

/**
 * DateFieldCell - Date picker for table cells
 *
 * Renders a DatePicker trigger in a table cell without visible borders.
 * Stores and displays ISO date strings (YYYY-MM-DD).
 */
export const DateFieldCell: React.FC<DateFieldCellProps> = ({
  value,
  onChange,
  disabled = false,
  error = false,
  id,
}) => {
  // Convert ISO string to Date object for DatePicker
  const dateValue = useMemo(() => {
    if (!value) return null;
    if (typeof value === "string") {
      const [year, month, day] = value.split("-").map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }
    return null;
  }, [value]);

  const displayValue = value ? format(new Date(value), "MM/dd/yyyy") : "Select date";

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      // Convert Date to ISO string (YYYY-MM-DD)
      const isoString = newDate.toISOString().split("T")[0];
      onChange?.(isoString);
    }
  };

  return (
    <FieldCellShell error={error}>
      <div className="date-field-cell-wrapper">
        <DatePicker
          value={dateValue}
          onChange={handleDateChange}
          disabled={disabled}
          error={false}
          placeholder="mm/dd/yyyy"
          className="w-full"
        />
      </div>
    </FieldCellShell>
  );
};

DateFieldCell.displayName = "DateFieldCell";
