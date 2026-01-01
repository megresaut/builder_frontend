import React, { forwardRef, useState, useCallback } from "react";

export interface CompactCurrencyInputProps
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
 * CompactCurrencyInput - Currency input optimized for inline editing
 *
 * Features:
 * - Height: 32px (compact)
 * - Padding: 6px 12px (compact)
 * - Text-align: right (for currency values)
 * - All CurrencyInput features preserved (formatting, blur behavior)
 * - While focused: raw, unformatted numeric string (e.g. "1234.5")
 * - While not focused: formatted currency (e.g. "$1,234.50")
 *
 * @param value - Numeric value (e.g., 1234.56)
 * @param onChange - Callback with raw numeric value
 * @param error - Show error styling (red border)
 * @param showCurrencySymbol - Display "$" prefix (default: true)
 * @param currencySymbol - Custom currency symbol (default: "$")
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @param allowNegative - Allow negative values (default: false)
 */
export const CompactCurrencyInput = forwardRef<
  HTMLInputElement,
  CompactCurrencyInputProps
>(
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

    const parseInputValue = useCallback(
      (input: string | number): number => {
        const inputStr =
          typeof input === "number" ? input.toString() : input || "";

        const cleaned = inputStr
          .replace(currencySymbol, "")
          .replace(/,/g, "")
          .trim();

        if (cleaned === "" || cleaned === "-") {
          return 0;
        }

        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      },
      [currencySymbol],
    );

    const numToEditString = useCallback((num: number): string => {
      if (num === 0) return "";
      return num.toString();
    }, []);

    const sanitizeInput = useCallback(
      (input: string): string => {
        let sanitized = input.replace(/[^\d.-]/g, "");

        const minusCount = (sanitized.match(/-/g) || []).length;
        if (minusCount > 1) {
          sanitized = sanitized.replace(/-/g, "");
          if (allowNegative && input.includes("-")) {
            sanitized = "-" + sanitized;
          }
        }

        if (!allowNegative && sanitized.startsWith("-")) {
          sanitized = sanitized.slice(1);
        }

        const parts = sanitized.split(".");
        if (parts.length > 2) {
          sanitized = parts[0] + "." + parts.slice(1).join("");
        }

        if (parts.length === 2 && parts[1].length > decimalPlaces) {
          sanitized = parts[0] + "." + parts[1].slice(0, decimalPlaces);
        }

        return sanitized;
      },
      [allowNegative, decimalPlaces],
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const sanitized = sanitizeInput(input);
      setDraftValue(sanitized);
      const numValue = parseInputValue(sanitized);
      onChange?.(numValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
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
      const numValue = parseInputValue(draftValue);
      onChange?.(numValue);
      setDraftValue("");
      rest.onBlur?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

      if (/[\d.]/.test(e.key)) {
        rest.onKeyDown?.(e);
        return;
      }

      if (allowNegative && e.key === "-") {
        rest.onKeyDown?.(e);
        return;
      }

      e.preventDefault();
    };

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
          padding: "6px 12px",
          height: "32px",
          fontSize: "14px",
          fontWeight: 400,
          letterSpacing: "-0.28px",
          lineHeight: 1.4,
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

CompactCurrencyInput.displayName = "CompactCurrencyInput";
