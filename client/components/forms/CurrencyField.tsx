import React, { forwardRef } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FieldShell } from "./FieldShell";

interface CurrencyFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: number | string;
  onChange?: (value: number | string) => void;
  showCurrencySymbol?: boolean;
  currencySymbol?: string;
  decimalPlaces?: number;
  allowNegative?: boolean;
  readOnly?: boolean;
}

/**
 * CurrencyField - Currency input field with FieldShell wrapper
 *
 * Composed of FieldShell + CurrencyInput for consistent currency field styling.
 * Handles automatic formatting, thousand separators, and currency symbols.
 * 
 * This is the #1 most important PM-specific field.
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param value - Numeric value (e.g., 1234.56)
 * @param onChange - Change handler (receives raw numeric value)
 * @param showCurrencySymbol - Display "$" prefix (default: true)
 * @param currencySymbol - Custom currency symbol (default: "$")
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @param allowNegative - Allow negative values (default: false)
 * @param disabled - Disable field
 *
 * Example:
 * ```tsx
 * <CurrencyField
 *   label="Bill Amount"
 *   required
 *   value={amount}
 *   onChange={setAmount}
 *   error={errors.amount}
 * />
 * ```
 */
export const CurrencyField = forwardRef<HTMLInputElement, CurrencyFieldProps>(
  (
    {
      label,
      required = false,
      description,
      error,
      id,
      disabled = false,
      value,
      onChange,
      showCurrencySymbol = true,
      currencySymbol = "$",
      decimalPlaces = 2,
      allowNegative = false,
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
        <CurrencyInput
          ref={ref}
          id={fieldId}
          disabled={disabled}
          value={value}
          onChange={onChange}
          showCurrencySymbol={showCurrencySymbol}
          currencySymbol={currencySymbol}
          decimalPlaces={decimalPlaces}
          allowNegative={allowNegative}
          {...inputProps}
        />
      </FieldShell>
    );
  },
);

CurrencyField.displayName = "CurrencyField";
