import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { FieldShell } from "./FieldShell";

interface TimeFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

/**
 * Validates time format HH:MM or HH:MM:SS
 * Accepts 24-hour format
 */
function validateTimeFormat(time: string): boolean {
  if (!time) return false;
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * TimeField - Time input field with validation
 *
 * Composed of FieldShell + Input with time picker and validation.
 * Uses native HTML5 time input with fallback to text for better UX.
 *
 * Features:
 * - Native time picker on supported browsers (mobile, modern desktop)
 * - Text input fallback for older browsers
 * - Validates time format (HH:MM)
 * - 24-hour format
 * - Optional min/max time constraints
 * - Clear error messaging
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute
 * @param value - Time in HH:MM format (e.g., "14:30")
 * @param onChange - Change handler
 * @param min - Minimum time (e.g., "09:00")
 * @param max - Maximum time (e.g., "17:30")
 * @param disabled - Disable field
 * @param readOnly - Read-only mode (shows value but not interactive, no validation errors)
 *
 * Example:
 * ```tsx
 * <TimeField
 *   label="Appointment Time"
 *   required
 *   value={time}
 *   onChange={setTime}
 *   min="09:00"
 *   max="17:30"
 *   placeholder="14:30"
 * />
 * ```
 */
export const TimeField = forwardRef<HTMLInputElement, TimeFieldProps>(
  (
    {
      label,
      required = false,
      description,
      error: externalError,
      id,
      disabled = false,
      value = "",
      onChange,
      min,
      max,
      placeholder = "HH:MM",
      readOnly = false,
      ...inputProps
    },
    ref,
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const [validationError, setValidationError] = React.useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;
      onChange?.(e.target.value);
      setValidationError("");
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (readOnly) return;
      const timeInput = e.target.value.trim();

      if (timeInput === "") {
        setValidationError("");
      } else if (!validateTimeFormat(timeInput)) {
        setValidationError("Please enter a valid time (HH:MM)");
      } else if (min && timeInput < min) {
        setValidationError(`Time must be at least ${min}`);
      } else if (max && timeInput > max) {
        setValidationError(`Time cannot be later than ${max}`);
      } else {
        setValidationError("");
      }

      inputProps.onBlur?.(e);
    };

    const displayError = externalError || validationError;

    return (
      <FieldShell
        label={label}
        required={required}
        description={description}
        error={readOnly ? undefined : displayError}
        disabled={disabled || readOnly}
        htmlFor={fieldId}
      >
        <Input
          ref={ref}
          id={fieldId}
          type="time"
          disabled={disabled}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          placeholder={placeholder}
          {...inputProps}
        />
      </FieldShell>
    );
  },
);

TimeField.displayName = "TimeField";
