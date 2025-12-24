import React, { forwardRef } from "react";

interface PercentInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value?: number | string;
  onChange?: (value: number) => void;
  placeholder?: string;
  error?: boolean;
  showPercentSymbol?: boolean;
  decimalPlaces?: number;
  min?: number;
  max?: number;
  allowNegative?: boolean;
}

/**
 * PercentInput - Formatted percentage input field
 *
 * Provides automatic formatting for percentage values.
 * Used for upcharge %, management fee %, tax rate %, etc.
 *
 * Features:
 * - Automatic decimal place handling
 * - Optional "%" symbol suffix
 * - Right-aligned for scannability
 * - Min/max bounds enforcement
 * - Validation-friendly (returns raw number 0-100)
 * - Works with form libraries (react-hook-form, etc.)
 *
 * @param value - Percentage value as number (0-100, e.g., 15.5 for 15.5%)
 * @param onChange - Callback with numeric percentage value
 * @param placeholder - Placeholder text (default: "0.00%")
 * @param error - Show error styling (red border)
 * @param showPercentSymbol - Display "%" suffix (default: true)
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @param min - Minimum percentage (default: 0)
 * @param max - Maximum percentage (default: 100)
 * @param allowNegative - Allow negative percentages (default: false)
 *
 * Example:
 * ```tsx
 * const [upcharge, setUpcharge] = useState(0);
 *
 * <PercentInput
 *   value={upcharge}
 *   onChange={setUpcharge}
 *   placeholder="0.00%"
 *   min={0}
 *   max={50}
 * />
 * // User enters "15.5%" → onChange called with 15.5
 * ```
 */
export const PercentInput = forwardRef<HTMLInputElement, PercentInputProps>(
  (
    {
      value = "",
      onChange,
      placeholder = "0.00%",
      error = false,
      showPercentSymbol = true,
      decimalPlaces = 2,
      min = 0,
      max = 100,
      allowNegative = false,
      disabled = false,
      ...rest
    },
    ref,
  ) => {
    const formatPercent = (num: number | string) => {
      if (!num && num !== 0) return "";

      const numValue = typeof num === "string" ? parseFloat(num) : num;
      if (isNaN(numValue)) return "";

      // Clamp to min/max
      let clamped = Math.max(min, Math.min(max, numValue));

      // Format with decimal places
      const formatter = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });

      const formatted = formatter.format(clamped);
      const suffix = showPercentSymbol ? "%" : "";

      return `${formatted}${suffix}`;
    };

    const parseInput = (inputValue: string): number => {
      // Remove % symbol and whitespace
      let cleaned = inputValue.replace(/%/g, "").trim();

      // Remove spaces
      cleaned = cleaned.replace(/\s/g, "");

      const num = parseFloat(cleaned);
      if (isNaN(num)) return 0;

      // Clamp to bounds
      return Math.max(min, Math.min(max, num));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numericValue = parseInput(inputValue);

      if (onChange) {
        onChange(numericValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      if (key === "." && e.currentTarget.value.includes(".")) {
        e.preventDefault();
      }

      // Allow negative only if allowNegative
      if (key === "-" && !allowNegative) {
        e.preventDefault();
      }
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={formatPercent(value)}
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

PercentInput.displayName = "PercentInput";
