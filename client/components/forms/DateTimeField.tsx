import React, { forwardRef, useState } from "react";
import { FieldShell } from "./FieldShell";
import { DateField } from "./DateField";
import { TimeField } from "./TimeField";

interface DateTimeFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  datePlaceholder?: string;
  timePlaceholder?: string;
  minDate?: string;
  maxDate?: string;
  minTime?: string;
  maxTime?: string;
  readOnly?: boolean;
}

/**
 * DateTimeField - Combined date and time input field
 *
 * Composed of DateField + TimeField for convenient datetime selection.
 * Stores value as ISO 8601 datetime string (YYYY-MM-DDTHH:MM).
 * Separates date and time inputs for better UX on both desktop and mobile.
 *
 * Features:
 * - Separate date picker and time input
 * - Native HTML5 date/time inputs for best UX
 * - Stores as ISO 8601 format (YYYY-MM-DDTHH:MM)
 * - Optional min/max date and time constraints
 * - Clear error messaging
 * - Flexible value handling
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute
 * @param value - ISO datetime string (e.g., "2024-01-15T14:30")
 * @param onChange - Change handler
 * @param disabled - Disable field
 * @param datePlaceholder - Date input placeholder
 * @param timePlaceholder - Time input placeholder
 * @param minDate - Minimum date (YYYY-MM-DD)
 * @param maxDate - Maximum date (YYYY-MM-DD)
 * @param minTime - Minimum time (HH:MM)
 * @param maxTime - Maximum time (HH:MM)
 * @param readOnly - Read-only mode (shows value but not interactive, no validation errors)
 *
 * Example:
 * ```tsx
 * <DateTimeField
 *   label="Appointment"
 *   required
 *   value={dateTime}
 *   onChange={setDateTime}
 *   minDate="2024-01-01"
 *   maxDate="2024-12-31"
 *   minTime="09:00"
 *   maxTime="17:30"
 * />
 * ```
 */
export const DateTimeField = forwardRef<HTMLDivElement, DateTimeFieldProps>(
  (
    {
      label,
      required = false,
      description,
      error,
      id,
      disabled = false,
      value = "",
      onChange,
      datePlaceholder = "mm/dd/yyyy",
      timePlaceholder = "HH:MM",
      minDate,
      maxDate,
      minTime,
      maxTime,
      readOnly = false,
    },
    ref,
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const [validationError, setValidationError] = React.useState<string>("");

    // Parse ISO datetime into date and time
    const parseDateTime = (
      isoString: string,
    ): { date: string; time: string } => {
      if (!isoString) return { date: "", time: "" };

      const [datePart, timePart] = isoString.split("T");
      return {
        date: datePart || "",
        time: timePart?.slice(0, 5) || "",
      };
    };

    const { date: currentDate, time: currentTime } = parseDateTime(value);

    const handleDateChange = (newDate: Date | null) => {
      if (!newDate) {
        onChange?.("");
        return;
      }

      const dateStr = newDate.toISOString().split("T")[0];
      const newValue = currentTime
        ? `${dateStr}T${currentTime}`
        : dateStr;

      onChange?.(newValue);
      setValidationError("");
    };

    const handleTimeChange = (timeStr: string) => {
      if (!timeStr) {
        if (currentDate) {
          onChange?.(currentDate);
        }
        return;
      }

      if (currentDate) {
        onChange?.(`${currentDate}T${timeStr}`);
      } else {
        // Time selected without a date - this is invalid
        setValidationError("Please select a date first");
      }
      setValidationError("");
    };

    const displayError = error || validationError;

    return (
      <FieldShell
        label={label}
        required={required}
        description={description}
        error={readOnly ? undefined : displayError}
        disabled={disabled || readOnly}
        htmlFor={fieldId}
      >
        <div ref={ref} style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1 }}>
            <DateField
              label="Date"
              value={currentDate ? new Date(currentDate) : null}
              onChange={handleDateChange}
              disabled={disabled}
              readOnly={readOnly}
              placeholder={datePlaceholder}
            />
          </div>
          <div style={{ flex: 1 }}>
            <TimeField
              label="Time"
              value={currentTime}
              onChange={handleTimeChange}
              disabled={disabled}
              readOnly={readOnly}
              placeholder={timePlaceholder}
              min={minTime}
              max={maxTime}
            />
          </div>
        </div>
      </FieldShell>
    );
  },
);

DateTimeField.displayName = "DateTimeField";
