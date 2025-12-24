import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { FieldShell } from "./FieldShell";

interface PercentFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: number | string;
  onChange?: (value: number | string) => void;
  min?: number;
  max?: number;
  step?: number;
  allowNegative?: boolean;
}

/**
 * PercentField - Percent/rate input field with % icon
 *
 * Composed of FieldShell + Input with percent formatting and validation.
 * Displays % symbol in right slot of input field.
 *
 * Features:
 * - Shows % icon in right slot
 * - Accepts numeric values (e.g., 5 means 5%)
 * - Optional validation for min/max range (0-100 by default)
 * - Supports negative percentages (e.g., discount, refund)
 * - Real-time validation on blur
 * - Clear error messaging
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param value - Numeric value (e.g., 5 for 5%)
 * @param onChange - Change handler
 * @param min - Minimum value (default: 0 or -100 if allowNegative)
 * @param max - Maximum value (default: 100)
 * @param step - Step increment (default: 0.01)
 * @param allowNegative - Allow negative percentages (default: false)
 * @param disabled - Disable field
 *
 * Example:
 * ```tsx
 * <PercentField
 *   label="Tax Rate"
 *   required
 *   value={taxRate}
 *   onChange={setTaxRate}
 *   min={0}
 *   max={100}
 *   step={0.01}
 *   placeholder="5.25"
 * />
 * ```
 */
export const PercentField = forwardRef<HTMLInputElement, PercentFieldProps>(
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
      min = 0,
      max = 100,
      step = 0.01,
      allowNegative = false,
      placeholder = "0",
      ...inputProps
    },
    ref,
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const [validationError, setValidationError] = React.useState<string>("");

    const numValue = typeof value === "string" ? (value ? parseFloat(value) : "") : value;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      onChange?.(input);
      setValidationError("");
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const input = e.target.value.trim();

      if (input === "") {
        setValidationError("");
      } else {
        const num = parseFloat(input);

        if (isNaN(num)) {
          setValidationError("Please enter a valid number");
        } else if (!allowNegative && num < 0) {
          setValidationError("Percentage cannot be negative");
        } else if (num < (min ?? -Infinity)) {
          setValidationError(`Percentage must be at least ${min}%`);
        } else if (num > (max ?? Infinity)) {
          setValidationError(`Percentage cannot exceed ${max}%`);
        } else {
          setValidationError("");
        }
      }

      inputProps.onBlur?.(e);
    };

    const displayError = error || validationError;

    return (
      <FieldShell
        label={label}
        required={required}
        description={description}
        error={displayError}
        disabled={disabled}
        htmlFor={fieldId}
      >
        <div style={{ position: "relative" }}>
          <Input
            ref={ref}
            id={fieldId}
            type="number"
            disabled={disabled}
            value={numValue}
            onChange={handleChange}
            onBlur={handleBlur}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            style={{
              paddingRight: "32px",
            }}
            {...inputProps}
          />
          <div
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#303030",
              fontWeight: 500,
              fontSize: "14px",
              pointerEvents: "none",
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          >
            %
          </div>
        </div>
      </FieldShell>
    );
  },
);

PercentField.displayName = "PercentField";
