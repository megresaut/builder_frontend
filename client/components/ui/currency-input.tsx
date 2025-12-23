import React, { forwardRef, useState } from "react";

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
    const [inputValue, setInputValue] = useState<string>(
      value ? formatCurrency(value) : ""
    );

    // Update input value when prop changes
    React.useEffect(() => {
      setInputValue(value ? formatCurrency(value) : "");
    }, [value]);

    function formatCurrency(val: number | string): string {
      if (!val && val !== 0) return "";

      const num = typeof val === "string" ? parseFloat(val.replace(/[$,]/g, "")) : val;
      if (isNaN(num)) return "";

      const formatted = num.toFixed(decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const prefix = showCurrencySymbol ? currencySymbol : "";
      return `${prefix}${formatted}`;
    }

    function validateAmount(val: string): boolean {
      if (!val) return false;
      const num = parseFloat(val.replace(/[$,]/g, ""));
      return !isNaN(num) && num >= 0;
    }

    function parseAmount(val: string): number {
      const num = parseFloat(val.replace(/[$,]/g, ""));
      return isNaN(num) ? 0 : num;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;

      // Remove any existing currency symbols and commas to get clean input
      const cleanVal = val.replace(/[$,]/g, "");

      // If currency symbol is enabled, prepend it to the clean input
      if (showCurrencySymbol && cleanVal) {
        val = currencySymbol + cleanVal;
      } else if (!cleanVal) {
        val = "";
      } else {
        val = cleanVal;
      }

      setInputValue(val);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const val = e.target.value;
      
      if (val && validateAmount(val)) {
        const numValue = parseAmount(val);
        setInputValue(formatCurrency(numValue));
        if (onChange) {
          onChange(numValue);
        }
      } else if (val === "") {
        setInputValue("");
        if (onChange) {
          onChange(0);
        }
      } else {
        // Invalid input, revert to previous value
        setInputValue(value ? formatCurrency(value) : "");
      }

      if (rest.onBlur) {
        rest.onBlur(e);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;

      // Prevent deleting the currency symbol
      if (showCurrencySymbol) {
        const currencyLength = currencySymbol.length;
        if (input.selectionStart !== null && input.selectionStart <= currencyLength) {
          if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();
            return;
          }
          // If cursor is in the currency symbol area, move it to the right
          if (input.selectionStart < currencyLength) {
            e.preventDefault();
            input.setSelectionRange(currencyLength, currencyLength);
            return;
          }
        }
      }

      if (e.key === "Enter") {
        const val = input.value;

        if (val && validateAmount(val)) {
          const numValue = parseAmount(val);
          setInputValue(formatCurrency(numValue));
          if (onChange) {
            onChange(numValue);
          }
        } else if (val === "") {
          setInputValue("");
          if (onChange) {
            onChange(0);
          }
        }
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      // Position cursor after the currency symbol
      if (showCurrencySymbol) {
        const currencyLength = currencySymbol.length;
        setTimeout(() => {
          input.setSelectionRange(currencyLength, currencyLength);
        }, 0);
      }

      if (rest.onFocus) {
        rest.onFocus(e);
      }
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
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
