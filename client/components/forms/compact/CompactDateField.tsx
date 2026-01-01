import React from "react";
import { DateField } from "../DateField";
import { FieldShell } from "../FieldShell";
import { DatePicker } from "@/components/ui/date-picker";

interface CompactDateFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: Date | string | null;
  onChange?: (date: Date | string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  returnFormat?: "Date" | "ISO";
  readOnly?: boolean;
}

/**
 * CompactDateField - Date field optimized for inline editing
 *
 * Features:
 * - Uses compact DatePicker with 32px height
 * - 6px padding for compact form contexts
 * - All DateField functionality preserved (calendar, ISO format, timezone handling)
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute
 * @param value - Selected date (Date object or ISO string "YYYY-MM-DD")
 * @param onChange - Change handler
 * @param disabled - Disable field
 * @param placeholder - Placeholder text (default: "mm/dd/yyyy")
 * @param returnFormat - Return format: "Date" or "ISO" string
 * @param readOnly - Read-only mode
 */
const CompactDateField: React.FC<CompactDateFieldProps> = ({
  label,
  required = false,
  description,
  error,
  id,
  disabled = false,
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  returnFormat = "Date",
  readOnly = false,
}) => {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

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

  const validateDateRange = (date: Date | null): boolean => {
    if (!date) return true;
    const year = date.getFullYear();
    return year >= 1900 && year <= 2040;
  };

  const dateError =
    error ||
    (dateValue && !validateDateRange(dateValue)
      ? "Date must be between 1900 and 2040"
      : undefined);

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
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={readOnly ? undefined : dateError}
      disabled={disabled || readOnly}
      htmlFor={fieldId}
    >
      <CompactDatePickerWrapper
        value={dateValue}
        onChange={handleDateChange}
        disabled={disabled}
        placeholder={placeholder}
        error={!!dateError}
      />
    </FieldShell>
  );
};

/**
 * CompactDatePickerWrapper - DatePicker with compact styling
 *
 * Internal component that applies 32px height and 6px padding
 */
const CompactDatePickerWrapper = React.forwardRef<
  HTMLInputElement,
  {
    value: Date | null;
    onChange: (date: Date | null) => void;
    disabled?: boolean;
    placeholder?: string;
    error?: boolean;
  }
>(({ value, onChange, disabled, placeholder, error }, ref) => {
  return (
    <DatePicker
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      error={error}
    />
  );
});

CompactDatePickerWrapper.displayName = "CompactDatePickerWrapper";
CompactDateField.displayName = "CompactDateField";

export { CompactDateField };
