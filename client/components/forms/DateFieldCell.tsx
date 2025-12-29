import React, { useState, useRef } from "react";
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
 * Renders a date picker trigger in a table cell that opens a DatePicker popover.
 * Stores and displays ISO date strings (YYYY-MM-DD).
 */
export const DateFieldCell: React.FC<DateFieldCellProps> = ({
  value,
  onChange,
  disabled = false,
  error = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const parsedDate = value ? new Date(value) : null;
  const displayValue = value
    ? format(new Date(value), "MMM d, yyyy")
    : "Select date";

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const isoString = date.toISOString().split("T")[0];
      onChange?.(isoString);
      setIsOpen(false);
    }
  };

  return (
    <FieldCellShell error={error}>
      <button
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between gap-2 w-full h-9 px-3 rounded-md border border-0 text-sm bg-white text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        style={{
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
        }}
        type="button"
      >
        <span
          style={{
            color: value ? "var(--color-text-primary)" : "#A1A1A9",
            fontSize: "13px",
            flex: 1,
            textAlign: "left",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {displayValue}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.5)",
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "16px",
              zIndex: 51,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <DatePicker
              value={parsedDate}
              onChange={handleDateChange}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </FieldCellShell>
  );
};

DateFieldCell.displayName = "DateFieldCell";
