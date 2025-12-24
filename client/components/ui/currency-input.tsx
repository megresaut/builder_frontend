import React, { forwardRef, useState, useCallback } from "react";

interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "onChange"
  > {
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
 * CurrencyInput - Formatted currency input field with clean editing experience
 *
 * Features:
 * - While focused: raw, unformatted numeric string (e.g. "1234.5")
 * - While not focused: formatted currency (e.g. "$1,234.50")
 * - User can freely edit dollars and decimals
 * - Formatting happens ONLY on blur, never during typing
 * - Accepts pasted values like "$1,234.56" and normalizes
 * - Always emits numeric value via onChange
 *
 * @param value - Numeric value (e.g., 1234.56)
 * @param onChange - Callback with raw numeric value
 * @param placeholder - Placeholder text
 * @param error - Show error styling (red border)
 * @param showCurrencySymbol - Display "$" prefix (default: true)
 * @param currencySymbol - Custom currency symbol (default: "$")
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @param allowNegative - Allow negative values (default: false)
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
    const [isFocused, setIsFocused] = useState(false);
    const [draftValue, setDraftValue] = useState<string>("");

    /**
     * Format a numeric value as currency for display (when NOT focused)
     * Uses Intl.NumberFormat for proper locale-aware formatting
     */
    const formatForDisplay = useCallback(
      (num: number): string => {
        if (isNaN(num)) return "";

        const formatter = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        });

        return formatter.format(num);
      },
      [decimalPlaces],
    );

    /**
     * Parse input string to numeric value
     * Accepts: "1", "12.34", "$1,234.56", "1,234.56"
     */
    const parseInputValue = useCallback(
      (input: string | number): number => {
        // Ensure input is a string
        const inputStr =
          typeof input === "number" ? input.toString() : input || "";

        // Remove currency symbol and thousand separators
        const cleaned = inputStr
          .replace(currencySymbol, "")
          .replace(/,/g, "")
          .trim();

        // Handle empty input
        if (cleaned === "" || cleaned === "-") {
          return 0;
        }

        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      },
      [currencySymbol],
    );

    /**
     * Convert numeric value to unformatted string for editing
     */
    const numToEditString = useCallback((num: number): string => {
      if (num === 0) return "";
      return num.toString();
    }, []);

    /**
     * Sanitize user input to allow only digits, one decimal point, and optional minus
     * Does NOT format or pad with zeros
     */
    const sanitizeInput = useCallback(
      (input: string): string => {
        // Remove any non-digit, non-decimal characters (except minus)
        let sanitized = input.replace(/[^\d.-]/g, "");

        // Handle multiple minus signs (keep only the first)
        const minusCount = (sanitized.match(/-/g) || []).length;
        if (minusCount > 1) {
          sanitized = sanitized.replace(/-/g, "");
          if (allowNegative && input.includes("-")) {
            sanitized = "-" + sanitized;
          }
        }

        // Prevent leading minus if not allowed
        if (!allowNegative && sanitized.startsWith("-")) {
          sanitized = sanitized.slice(1);
        }

        // Handle multiple decimal points (keep only the first)
        const parts = sanitized.split(".");
        if (parts.length > 2) {
          sanitized = parts[0] + "." + parts.slice(1).join("");
        }

        // Limit decimal places
        if (parts.length === 2 && parts[1].length > decimalPlaces) {
          sanitized = parts[0] + "." + parts[1].slice(0, decimalPlaces);
        }

        return sanitized;
      },
      [allowNegative, decimalPlaces],
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Sanitize input (no formatting, no padding)
      const sanitized = sanitizeInput(input);

      // Update draft value for display while typing
      setDraftValue(sanitized);

      // Parse and emit numeric value immediately
      const numValue = parseInputValue(sanitized);
      onChange?.(numValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);

      // Show unformatted, unpaded value (e.g., "1234.5" not "1234.50" and not "$1,234.50")
      const numValue =
        typeof value === "string" ? parseFloat(value) : (value as number);
      if (!isNaN(numValue) && numValue !== 0) {
        setDraftValue(numToEditString(numValue));
      } else {
        setDraftValue("");
      }

      rest.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      // Parse the draft value to get numeric value
      const numValue = parseInputValue(draftValue);

      // Update the numeric model
      onChange?.(numValue);

      // Clear draft (formatted value will be displayed)
      setDraftValue("");

      rest.onBlur?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow standard navigation and editing keys
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

    // Determine what to display
    const displayValue = isFocused
      ? draftValue
      : formatForDisplay(parseInputValue(draftValue || (value as string)));

    const handleFocusWithBorder = (e: React.FocusEvent<HTMLInputElement>) => {
      handleFocus(e);
      e.currentTarget.style.borderColor = "#000000";
    };

    const handleBlurWithBorder = (e: React.FocusEvent<HTMLInputElement>) => {
      handleBlur(e);
      e.currentTarget.style.borderColor = error
        ? "#ef4444"
        : "var(--color-border-light)";
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocusWithBorder}
        onBlur={handleBlurWithBorder}
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
          fontSize: "14px",
          fontWeight: 400,
          letterSpacing: "0.5px",
          lineHeight: 1.43,
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          color: "var(--color-text-primary)",
          width: "100%",
          boxSizing: "border-box",
          textAlign: "right",
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "text",
          outline: "none",
        }}
        {...rest}
      />
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
