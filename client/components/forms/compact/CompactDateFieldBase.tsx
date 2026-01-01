import React from "react";
import { DatePicker } from "@/components/ui/date-picker";

interface CompactDateFieldBaseProps {
  value?: Date | string | null;
  onChange?: (date: Date | string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  returnFormat?: "Date" | "ISO";
  readOnly?: boolean;
}

/**
 * CompactDateFieldBase - Date picker without FieldShell wrapper
 *
 * Raw DatePicker component with compact styling (32px height, 6px padding).
 * No label or field shell, ideal for custom layouts.
 *
 * @param value - Selected date (Date object or ISO string "YYYY-MM-DD")
 * @param onChange - Change handler
 * @param disabled - Disable field
 * @param placeholder - Placeholder text
 * @param returnFormat - Return format: "Date" or "ISO" string
 * @param readOnly - Read-only mode
 */
const CompactDateFieldBase = React.forwardRef<
  HTMLInputElement,
  CompactDateFieldBaseProps
>(({
  disabled = false,
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  returnFormat = "Date",
  readOnly = false,
}, ref) => {
  const dateValue = React.useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      const [year, month, day] = value.split("-").map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }
    return null;
  }, [value]);

  const handleDateChange = (newDate: Date | null) => {
    if (readOnly) return;
    if (returnFormat === "ISO" && newDate) {
      const isoString = newDate.toISOString().split("T")[0];
      onChange?.(isoString);
    } else {
      onChange?.(newDate);
    }
  };

  return (
    <DatePicker
      ref={ref}
      value={dateValue}
      onChange={handleDateChange}
      disabled={disabled || readOnly}
      placeholder={placeholder}
    />
  );
});

CompactDateFieldBase.displayName = "CompactDateFieldBase";

export { CompactDateFieldBase };
