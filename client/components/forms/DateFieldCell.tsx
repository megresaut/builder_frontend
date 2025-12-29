import React from "react";
import { FieldCellShell } from "./FieldCellShell";

interface DateFieldCellProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  id?: string;
}

/**
 * DateFieldCell - Date input for table cells
 *
 * Renders a native date input in a table cell.
 * Stores and displays ISO date strings (YYYY-MM-DD).
 */
export const DateFieldCell: React.FC<DateFieldCellProps> = ({
  value,
  onChange,
  disabled = false,
  error = false,
  id,
}) => {
  return (
    <FieldCellShell error={error}>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9] disabled:opacity-50"
        style={{
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
        }}
      />
    </FieldCellShell>
  );
};

DateFieldCell.displayName = "DateFieldCell";
