import React, { forwardRef, useState, useEffect } from "react";

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: number | string;
  onChange?: (value: number) => void;
  placeholder?: string;
  error?: boolean;
  showCurrencySymbol?: boolean;
  currencySymbol?: string;
  decimalPlaces?: number;
  allowNegative?: boolean;
}

/**
 * CurrencyInput - Formatted currency input field with natural typing behavior
 *
 * Features:
 * - User can type naturally: "1", "12", "12.", "12.3", "12.34"
 * - Only allows numbers + one decimal point
 * - Limits to 2 decimal places
 * - Supports backspace/delete naturally
 * - Accepts pasted values like "$1,234.56" or "1,234.56" and normalizes
 * - Shows thousands separators while editing (removed on focus, restored on blur)
 * - Always stores and emits numeric value consistently
 * - Displays currency formatted "$1,234.56" when not focused
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
    const [displayValue, setDisplayValue] = useState<string>("");
    const [isFocused, setIsFocused] = useState(false);

    // Initialize display value when external value changes
    useEffect(() => {
      if (value !== undefined && value !== null && value !== "") {
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        if (!isNaN(numValue)) {
          setDisplayValue(formatForDisplay(numValue, !isFocused));
        }
      } else {
        setDisplayValue("");
      }
    }, [value, isFocused]);

    /**
     * Format a numeric value for display
     * @param num - Numeric value
     * @param includeFormatting - Whether to include thousands separators and currency symbol
     */
    function formatForDisplay(num: number, includeFormatting: boolean): string {
      if (!includeFormatting) {
        // Show plain number without thousands separators (for editing)
        return num.toFixed(decimalPlaces);
      }

      // Show formatted with thousands separators and currency symbol
      const formatted = num
        .toFixed(decimalPlaces)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return showCurrencySymbol ? `${currencySymbol}${formatted}` : formatted;
    }

    /**
     * Parse input string to numeric value
     * Accepts: "1", "12.34", "1,234.56", "$1,234.56"
     */
    function parseInputValue(input: string): number {
      // Remove currency symbol and thousand separators
      const cleaned = input
        .replace(currencySymbol, "")
        .replace(/,/g, "")
        .trim();

      // Handle empty input
      if (cleaned === "" || cleaned === "-") {
        return 0;
      }

      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }

    /**
     * Validate and constrain input
     * - Only allows digits, decimal point, and minus sign (if allowed)
     * - Limits to 2 decimal places
     */
    function sanitizeInput(input: string): string {
      // Remove any non-digit, non-decimal characters (except minus for negative)
      let sanitized = input.replace(/[^\d.-]/g, "");

      // Handle multiple minus signs
      const minusCount = (sanitized.match(/-/g) || []).length;
      if (minusCount > 1) {
        sanitized = sanitized.replace(/-/g, "");
        sanitized = "-" + sanitized;
      }

      // Prevent leading minus if not allowed
      if (!allowNegative && sanitized.startsWith("-")) {
        sanitized = sanitized.slice(1);
      }

      // Handle multiple decimal points
      const parts = sanitized.split(".");
      if (parts.length > 2) {
        sanitized = parts[0] + "." + parts.slice(1).join("");
      }

      // Limit decimal places
      if (parts.length === 2 && parts[1].length > decimalPlaces) {
        sanitized = parts[0] + "." + parts[1].slice(0, decimalPlaces);
      }

      return sanitized;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Sanitize input
      const sanitized = sanitizeInput(input);

      // Update display value (without formatting while editing)
      setDisplayValue(sanitized);

      // Parse and emit numeric value
      const numValue = parseInputValue(sanitized);
      onChange?.(numValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);

      // Show unformatted value when focused
      const numValue = parseInputValue(displayValue);
      if (numValue === 0 && displayValue === "") {
        setDisplayValue("");
      } else {
        setDisplayValue(numValue.toFixed(decimalPlaces));
      }

      rest.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      // Format value on blur
      const numValue = parseInputValue(displayValue);
      setDisplayValue(formatForDisplay(numValue, true));

      rest.onBlur?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow standard keys
      if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Home" ||
        e.key === "End" ||
        e.key === "Tab" ||
        e.ctrlKey ||
        e.metaKey
      ) {
        rest.onKeyDown?.(e);
        return;
      }

      // Allow digits and decimal point
      if (/[\d.]/.test(e.key)) {
        rest.onKeyDown?.(e);
        return;
      }

      // Allow minus if negative is allowed
      if (allowNegative && e.key === "-") {
        rest.onKeyDown?.(e);
        return;
      }

      // Prevent all other keys
      e.preventDefault();
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
