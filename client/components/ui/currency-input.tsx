import React, { forwardRef } from "react";

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value?: number | string;
  onChange?: (value: number | string) => void;
  placeholder?: string;
  error?: boolean;
  showCurrencySymbol?: boolean;
  currencySymbol?: string;
  decimalPlaces?: number;
  allowNegative?: boolean;
}

/**
 * CurrencyInput - Formatted currency input field
 *
 * Provides automatic formatting, right-alignment, and currency symbol support.
 * Internally stores raw numeric value, displays formatted with commas and decimals.
 *
 * Features:
 * - Automatic thousand separators
 * - 2 decimal places by default
 * - Optional currency symbol prefix
 * - Right-aligned for better scannability
 * - Validation-friendly (returns raw number)
 * - Works with form libraries (react-hook-form, etc.)
 *
 * @param value - Numeric value (e.g., 1234.56)
 * @param onChange - Callback with raw numeric value
 * @param placeholder - Placeholder text
 * @param error - Show error styling (red border)
 * @param showCurrencySymbol - Display "$" prefix (default: true)
 * @param currencySymbol - Custom currency symbol (default: "$")
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @param allowNegative - Allow negative values (default: false)
 *
 * Example:
 * ```tsx
 * const [amount, setAmount] = useState(0);
 * 
 * <CurrencyInput
 *   value={amount}
 *   onChange={setAmount}
 *   placeholder="0.00"
 *   error={errors.amount}
 * />
 * ```
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value = "",
      onChange,
      placeholder = "0.00",
      error = false,
      showCurrencySymbol = true,
      currencySymbol = "$",
      decimalPlaces = 2,
      allowNegative = false,
      disabled = false,
      ...rest
    },
    ref,
  ) => {
    const formatCurrency = (num: number | string) => {
      if (!num && num !== 0) return "";

      const numValue = typeof num === "string" ? parseFloat(num) : num;
      if (isNaN(numValue)) return "";

      // Format with thousand separators and decimal places
      const formatter = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });

      const formatted = formatter.format(Math.abs(numValue));
      const sign = numValue < 0 ? "-" : "";
      const prefix = showCurrencySymbol ? currencySymbol : "";

      return `${sign}${prefix}${formatted}`;
    };

    const parseInput = (inputValue: string): number => {
      // Remove currency symbol and whitespace
      let cleaned = inputValue.replace(new RegExp(`\\${currencySymbol}`, "g"), "").trim();

      // Remove commas
      cleaned = cleaned.replace(/,/g, "");

      // Handle negative
      const isNegative = cleaned.startsWith("-");
      if (isNegative && !allowNegative) {
        cleaned = cleaned.substring(1);
      }

      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : isNegative ? -num : num;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numericValue = parseInput(inputValue);

      if (onChange) {
        onChange(numericValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const key = e.key;

      // Allow: backspace, delete, tab, escape, enter
      if ([8, 9, 27, 13, 46].includes(e.keyCode)) {
        return;
      }

      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
        return;
      }

      // Allow: numbers and decimal point
      if (!(/[0-9.]/.test(key))) {
        e.preventDefault();
      }

      // Prevent multiple decimal points
      if (key === "." && input.value.includes(".")) {
        e.preventDefault();
      }

      // Allow negative only if allowNegative is true
      if (key === "-" && !allowNegative) {
        e.preventDefault();
      }
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={formatCurrency(value)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          borderRadius: "8px",
          backgroundColor: "rgba(255, 255, 255, 1)",
          borderColor: error ? "#ef4444" : "var(--color-border-light)",
          borderStyle: "solid",
          borderWidth: error ? "2px" : "1px",
          padding: "8px 12px",
          fontSize: "16px",
          fontWeight: 400,
          letterSpacing: "-0.32px",
          lineHeight: 1.4,
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          color: "var(--color-text-primary)",
          width: "100%",
          boxSizing: "border-box",
          textAlign: "right",
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
        {...rest}
      />
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
