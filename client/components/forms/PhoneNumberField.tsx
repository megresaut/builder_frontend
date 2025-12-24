import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { FieldShell } from "./FieldShell";

interface PhoneNumberFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  readOnly?: boolean;
}

/**
 * Validates phone number format
 * Accepts various formats:
 * - 1234567890 (10 digits)
 * - (123) 456-7890
 * - 123-456-7890
 * - +1 234 567 8900 (with optional country code)
 * - +441234567890
 */
function validatePhoneNumber(phoneNumber: string): boolean {
  // Extract only digits and + sign
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // Must have at least 10 digits (minimum valid phone number)
  const digitCount = cleaned.replace(/\D/g, "").length;
  return digitCount >= 10 && digitCount <= 15;
}

/**
 * Formats a phone number with parentheses and dashes
 * Preserves country code if present
 * Examples:
 * - "1234567890" -> "(123) 456-7890"
 * - "+11234567890" -> "+1 (123) 456-7890"
 * - "+441234567890" -> "+44 (123) 456-7890"
 */
function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return "";

  // Extract country code if present
  let countryCode = "";
  let digits = phoneNumber;

  const countryCodeMatch = phoneNumber.match(/^(\+\d{1,3})\s*/);
  if (countryCodeMatch) {
    countryCode = countryCodeMatch[1];
    digits = phoneNumber.slice(countryCodeMatch[0].length);
  }

  // Remove all non-digits from the phone number part
  const cleaned = digits.replace(/\D/g, "");

  // Format based on length
  if (cleaned.length === 10) {
    // Standard format: (123) 456-7890
    return `${countryCode}${countryCode ? " " : ""}(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    // US format with leading 1: (123) 456-7890
    return `${countryCode}${countryCode ? " " : ""}(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length > 10) {
    // For longer numbers, try to format the last 10 digits with parentheses
    const lastTen = cleaned.slice(-10);
    const prefix = cleaned.slice(0, -10);
    return `${countryCode}${countryCode ? " " : ""}${prefix} (${lastTen.slice(0, 3)}) ${lastTen.slice(3, 6)}-${lastTen.slice(6)}`;
  }

  // Return as-is if we can't format it properly
  return phoneNumber;
}

/**
 * PhoneNumberField - Phone number input with flexible validation
 *
 * Features:
 * - Single input field for phone number
 * - Accepts optional country code (e.g., +1, +44, +86)
 * - Multiple formats supported:
 *   - 1234567890 (10 digits)
 *   - (123) 456-7890
 *   - 123-456-7890
 *   - +1 234 567 8900
 *   - +441234567890
 * - Real-time validation on blur
 * - Clear error messaging
 * - Optional validation callback
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - External error message
 * @param id - HTML id attribute
 * @param value - Phone number (with or without country code)
 * @param onChange - Change handler
 * @param onValidationChange - Callback when validation state changes
 * @param disabled - Disable field
 * @param readOnly - Read-only mode (shows value but not interactive, no validation errors)
 *
 * Example:
 * ```tsx
 * <PhoneNumberField
 *   label="Phone Number"
 *   required
 *   value={phone}
 *   onChange={setPhone}
 *   onValidationChange={setIsPhoneValid}
 *   placeholder="+1 (123) 456-7890"
 * />
 * ```
 */
export const PhoneNumberField = forwardRef<
  HTMLInputElement,
  PhoneNumberFieldProps
>(
  (
    {
      label,
      required = false,
      description,
      error: externalError,
      id,
      disabled = false,
      value = "",
      onChange,
      onValidationChange,
      placeholder = "+1 (123) 456-7890",
      readOnly = false,
      ...inputProps
    },
    ref,
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const [isFocused, setIsFocused] = React.useState(false);
    const [draftValue, setDraftValue] = React.useState("");
    const [validationError, setValidationError] = React.useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setDraftValue(input);
      onChange?.(input);
      setValidationError("");
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Show unformatted value while editing
      setDraftValue(value);
      inputProps.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const phoneInput = draftValue.trim();

      if (phoneInput === "") {
        setValidationError("");
        setDraftValue("");
        onChange?.("");
        onValidationChange?.(false);
      } else if (!validatePhoneNumber(phoneInput)) {
        setValidationError("Please enter a valid phone number");
        onValidationChange?.(false);
      } else {
        setValidationError("");
        const formatted = formatPhoneNumber(phoneInput);
        setDraftValue("");
        onChange?.(formatted);
        onValidationChange?.(true);
      }

      inputProps.onBlur?.(e);
    };

    const displayError = externalError || validationError;
    const displayValue = isFocused ? draftValue : value;

    return (
      <FieldShell
        label={label}
        required={required}
        description={description}
        error={readOnly ? undefined : displayError}
        disabled={disabled || readOnly}
        htmlFor={fieldId}
      >
        <Input
          ref={ref}
          id={fieldId}
          type="tel"
          disabled={disabled}
          readOnly={readOnly}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          {...inputProps}
        />
      </FieldShell>
    );
  },
);

PhoneNumberField.displayName = "PhoneNumberField";
