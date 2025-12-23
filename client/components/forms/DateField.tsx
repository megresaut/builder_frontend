import React from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldShell } from "./FieldShell";

interface DateFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * DateField - Date picker field with FieldShell wrapper
 *
 * Composed of FieldShell + DatePicker for consistent date field styling.
 * Handles date selection with calendar popup.
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param value - Selected date
 * @param onChange - Change handler (receives Date or null)
 * @param disabled - Disable field
 * @param placeholder - Placeholder text (default: "MM/DD/YYYY")
 *
 * Example:
 * ```tsx
 * <DateField
 *   label="Due Date"
 *   required
 *   value={dueDate}
 *   onChange={setDueDate}
 *   error={errors.dueDate}
 *   placeholder="MM/DD/YYYY"
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
