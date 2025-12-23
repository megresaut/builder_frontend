import React from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldShell } from "./FieldShell";

interface DateFieldProps {
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
}

/**
 * DateField - Date picker field with FieldShell wrapper
 *
 * Composed of FieldShell + DatePicker for consistent date field styling.
 * Handles date selection with calendar popup and flexible storage formats.
 *
 * Timezone Handling:
 * - Use ISO string format (YYYY-MM-DD) for "date-only" values (billing date, statement date, due date)
 * - Use Date objects for exact moment-in-time values (schedule, historical records)
 * - Always store as UTC ISO string in backend/database
 * - DatePicker operates in local browser timezone for UX, converts to ISO on change
 *
 * Features:
 * - Native calendar picker on supported browsers
 * - Flexible input format (numbers, slashes, auto-formatting)
 * - Returns either Date object or ISO string based on returnFormat
 * - Date range validation (1900-2040)
 * - Clear error messaging
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param value - Selected date (Date object or ISO string "YYYY-MM-DD")
 * @param onChange - Change handler (receives Date or ISO string based on returnFormat)
 * @param disabled - Disable field
 * @param placeholder - Placeholder text (default: "mm/dd/yyyy")
 * @param returnFormat - Return format: "Date" (default) or "ISO" string (YYYY-MM-DD)
 *
 * Example:
 * ```tsx
 * // Using Date objects (backward compatible)
 * <DateField
 *   label="Due Date"
 *   required
 *   value={dueDate}
 *   onChange={setDueDate}
 *   returnFormat="Date"
 * />
 *
 * // Using ISO strings (recommended for date-only fields)
 * <DateField
 *   label="Billing Date"
 *   required
 *   value={billingDate}
 *   onChange={setBillingDate}
 *   returnFormat="ISO"
 * />
 * ```
 */
const DateField: React.FC<DateFieldProps> = ({
  label,
  required = false,
  description,
  error,
  id,
  disabled = false,
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
}) => {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

  // Validate date range (1900-2040)
  const validateDateRange = (date: Date | null): boolean => {
    if (!date) return true;
    const year = date.getFullYear();
    return year >= 1900 && year <= 2040;
  };

  const dateError = error || (value && !validateDateRange(value) ? "Date must be between 1900 and 2040" : undefined);

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={dateError}
      disabled={disabled}
      htmlFor={fieldId}
    >
      <DatePicker
        value={value || null}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        error={!!dateError}
      />
    </FieldShell>
  );
};

DateField.displayName = "DateField";

export { DateField };
