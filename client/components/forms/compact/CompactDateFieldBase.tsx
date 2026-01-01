import React from "react";
import { CompactInput } from "./CompactInput";

interface CompactDateFieldBaseProps {
  value?: Date | string | null;
  onChange?: (date: Date | string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  returnFormat?: "Date" | "ISO";
  readOnly?: boolean;
}

/**
 * CompactDateFieldBase - Date input without FieldShell wrapper
 *
 * Simple text input with 32px height and 6px padding for compact inline editing.
 * Users can type date as MM/DD/YYYY or use date picker.
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
  // Format value for display
  const displayValue = React.useMemo(() => {
    if (!value) return "";
    if (value instanceof Date) {
      return value.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    }
    if (typeof value === "string") {
      const [year, month, day] = value.split("-").map(Number);
      if (year && month && day) {
        return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
      }
    }
    return "";
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (readOnly) return;

    // Parse MM/DD/YYYY format
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = inputValue.match(dateRegex);

    if (match) {
      const [, month, day, year] = match;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      if (returnFormat === "ISO") {
        const isoString = date.toISOString().split("T")[0];
        onChange?.(isoString);
      } else {
        onChange?.(date);
      }
    } else if (inputValue === "") {
      onChange?.(null);
    }
  };

  return (
    <CompactInput
      ref={ref}
      type="text"
      value={displayValue}
      onChange={handleChange}
      disabled={disabled || readOnly}
      placeholder={placeholder}
    />
  );
});

CompactDateFieldBase.displayName = "CompactDateFieldBase";

export { CompactDateFieldBase };
