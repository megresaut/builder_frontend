import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { FieldShell } from "./FieldShell";

interface NumberFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  step?: string | number;
  min?: string | number;
  max?: string | number;
}

/**
 * NumberField - Numeric input field with FieldShell wrapper
 *
 * Composed of FieldShell + Input for consistent number field styling.
 * Handles integer and decimal inputs with step control.
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param placeholder - Input placeholder
 * @param disabled - Disable field
 * @param step - Step increment (e.g., "0.01" for decimals)
 * @param min - Minimum value
 * @param max - Maximum value
 * @param onChange - Change handler
 * @param value - Field value
 *
 * Example:
 * ```tsx
 * <NumberField
 *   label="Quantity"
 *   required
 *   placeholder="0"
 *   min="0"
 *   step="1"
 *   error={errors.quantity}
 *   value={quantity}
 *   onChange={(e) => setQuantity(Number(e.target.value))}
 * />
 * ```
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  (
    {
      label,
      required = false,
      description,
      error,
      id,
      disabled = false,
      step = "1",
      ...inputProps
    },
    ref,
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <FieldShell
        label={label}
        required={required}
        description={description}
        error={error}
        disabled={disabled}
        htmlFor={fieldId}
      >
        <Input
          ref={ref}
          id={fieldId}
          type="number"
          disabled={disabled}
          step={step}
          {...inputProps}
        />
      </FieldShell>
    );
  },
);

NumberField.displayName = "NumberField";
