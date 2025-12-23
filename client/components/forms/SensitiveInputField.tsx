import React, { forwardRef, useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { FieldShell } from "./FieldShell";

interface SensitiveInputFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  maskChar?: string;
  visibleDigits?: number;
}

/**
 * SensitiveInputField - Secure input for sensitive data like bank accounts, routing numbers, EIN
 *
 * Composed of FieldShell + masked input with reveal/remask toggle.
 *
 * Features:
 * - Masks value by default (shows only last N digits as bullets)
 * - Does not mask while user is actively typing
 * - Eye icon to toggle reveal/remask on demand
 * - Copy button enabled only when revealed
 * - Precise validation error messages
 * - Read-only mode: always masked, no copy, no validation errors
 * - No logging or persistence of sensitive values
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute
 * @param value - Sensitive value (e.g., bank account, routing number)
 * @param onChange - Change handler
 * @param disabled - Disable field
 * @param readOnly - Read-only mode (always masked, no copy)
 * @param maskChar - Character to use for masking (default: "●")
 * @param visibleDigits - Number of last digits to show (default: 4)
 * @param placeholder - Placeholder text
 *
 * Example:
 * ```tsx
 * <SensitiveInputField
 *   label="Bank Account Number"
 *   required
 *   value={accountNumber}
 *   onChange={setAccountNumber}
 *   error={errors.accountNumber}
 *   placeholder="Enter bank account number"
 * />
 * ```
 */
export const SensitiveInputField = forwardRef<HTMLInputElement, SensitiveInputFieldProps>(
  (
    {
      label,
      required = false,
      description,
      error,
      id,
      disabled = false,
      readOnly = false,
      value = "",
      onChange,
      maskChar = "●",
      visibleDigits = 4,
      placeholder,
      ...inputProps
    },
    ref,
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const [isRevealed, setIsRevealed] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const getMaskedValue = (val: string): string => {
      if (!val) return "";
      if (val.length <= visibleDigits) return val;
      const hiddenCount = val.length - visibleDigits;
      return maskChar.repeat(hiddenCount) + val.slice(-visibleDigits);
    };

    const displayValue = isRevealed || readOnly === false ? value : getMaskedValue(value);

    const handleCopy = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!isRevealed || !value) return;

      try {
        await navigator.clipboard.writeText(value);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };

    const toggleReveal = (e: React.MouseEvent) => {
      e.preventDefault();
      if (!readOnly) {
        setIsRevealed(!isRevealed);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;
      onChange?.(e.target.value);
    };

    return (
      <FieldShell
        label={label}
        required={required}
        description={description}
        error={readOnly ? undefined : error}
        disabled={disabled}
        htmlFor={fieldId}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <input
            ref={ref}
            id={fieldId}
            type="text"
            disabled={disabled || readOnly}
            readOnly={readOnly}
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            style={{
              borderRadius: "8px",
              backgroundColor: readOnly ? "#f5f5f5" : "white",
              borderColor: error ? "#ef4444" : "var(--color-border-light)",
              borderStyle: "solid",
              borderWidth: error ? "2px" : "1px",
              padding: "8px 12px",
              paddingRight: "80px",
              fontSize: "14px",
              fontWeight: 400,
              letterSpacing: "0.5px",
              lineHeight: 1.43,
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              color: "#303030",
              width: "100%",
              boxSizing: "border-box",
              outline: "none",
              opacity: disabled ? 0.6 : 1,
              cursor: readOnly ? "default" : disabled ? "not-allowed" : "text",
            }}
            onFocus={(e) => {
              if (!readOnly && !disabled) {
                e.currentTarget.style.borderColor = "#000000";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? "#ef4444" : "var(--color-border-light)";
            }}
            {...inputProps}
          />

          {!readOnly && (
            <div
              style={{
                position: "absolute",
                right: "8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {isRevealed && value && (
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={disabled}
                  title="Copy to clipboard"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: disabled ? "not-allowed" : "pointer",
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {copySuccess ? (
                    <Check className="w-4 h-4" style={{ color: "#22c55e" }} />
                  ) : (
                    <Copy className="w-4 h-4" style={{ color: "#303030" }} />
                  )}
                </button>
              )}

              {value && (
                <button
                  type="button"
                  onClick={toggleReveal}
                  disabled={disabled}
                  title={isRevealed ? "Hide" : "Reveal"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: disabled ? "not-allowed" : "pointer",
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {isRevealed ? (
                    <EyeOff className="w-4 h-4" style={{ color: "#303030" }} />
                  ) : (
                    <Eye className="w-4 h-4" style={{ color: "#303030" }} />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </FieldShell>
    );
  },
);

SensitiveInputField.displayName = "SensitiveInputField";
