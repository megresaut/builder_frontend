import React from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldShell } from "./FieldShell";

interface DateFieldProps {
  label?: string;
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
  compact?: boolean;
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
 * @param readOnly - Read-only mode (shows value but not interactive, no validation errors)
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
  returnFormat = "Date",
  readOnly = false,
  compact = false,
}) => {
  // Ensure placeholder is lowercase
  const normalizedPlaceholder = placeholder.toLowerCase();
  const fieldId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : "date-field");

  // Convert value to Date object for DatePicker
  const dateValue = React.useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      // Parse ISO string (YYYY-MM-DD) to Date
      const [year, month, day] = value.split("-").map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }
    return null;
  }, [value]);

  // Validate date range (1900-2040)
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
      // Convert Date to ISO string (YYYY-MM-DD)
      const isoString = newDate.toISOString().split("T")[0];
      onChange?.(isoString);
    } else {
      // Return Date object
      onChange?.(newDate);
    }
  };

  // Compact mode: render input only without FieldShell wrapper
  if (compact) {
    return (
      <DatePicker
        value={dateValue}
        onChange={handleDateChange}
        disabled={disabled}
        placeholder={normalizedPlaceholder}
        error={!!dateError}
        compact
      />
    );
  }

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={readOnly ? undefined : dateError}
      disabled={disabled || readOnly}
      htmlFor={fieldId}
    >
      <DatePicker
        value={dateValue}
        onChange={handleDateChange}
        disabled={disabled}
        placeholder={normalizedPlaceholder}
        error={!!dateError}
      />
    </FieldShell>
  );
};

DateField.displayName = "DateField";

export { DateField };
