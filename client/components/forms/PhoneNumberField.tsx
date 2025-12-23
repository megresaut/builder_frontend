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
export const PhoneNumberField = forwardRef<HTMLInputElement, PhoneNumberFieldProps>(
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
      ...inputProps
    },
    ref,
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const [validationError, setValidationError] = React.useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
      setValidationError("");
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const phoneInput = e.target.value.trim();

      if (phoneInput === "") {
        setValidationError("");
        onValidationChange?.(false);
      } else if (!validatePhoneNumber(phoneInput)) {
        setValidationError("Please enter a valid phone number");
        onValidationChange?.(false);
      } else {
        setValidationError("");
        onValidationChange?.(true);
      }

      inputProps.onBlur?.(e);
    };

    const displayError = externalError || validationError;

    return (
      <FieldShell
        label={label}
        required={required}
        description={description}
        error={displayError}
        disabled={disabled}
        htmlFor={fieldId}
      >
        <Input
          ref={ref}
          id={fieldId}
          type="tel"
          disabled={disabled}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          {...inputProps}
        />
      </FieldShell>
    );
  },
);

PhoneNumberField.displayName = "PhoneNumberField";
