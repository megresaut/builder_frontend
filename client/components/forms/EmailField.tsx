import React, { forwardRef } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { FieldShell } from "./FieldShell";

interface EmailFieldProps
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

const emailSchema = z.string().email("Please enter a valid email address");

/**
 * EmailField - Email input field with built-in validation
 *
 * Composed of FieldShell + Input with real-time email validation.
 * Shows error message if email format is invalid.
 *
 * Features:
 * - Real-time validation on blur
 * - Clear error messaging
 * - Optional validation callback
 * - Accessible label and error handling
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - External error message (overrides validation)
 * @param id - HTML id attribute
 * @param value - Field value
 * @param onChange - Change handler
 * @param onValidationChange - Callback when validation state changes
 * @param disabled - Disable field
 * @param readOnly - Read-only mode (shows value but not interactive, no validation errors)
 *
 * Example:
 * ```tsx
 * <EmailField
 *   label="Email Address"
 *   required
 *   value={email}
 *   onChange={setEmail}
 *   onValidationChange={setIsEmailValid}
 *   placeholder="you@example.com"
 * />
 * ```
 */
export const EmailField = forwardRef<HTMLInputElement, EmailFieldProps>(
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
      placeholder = "you@example.com",
      readOnly = false,
      ...inputProps
    },
    ref,
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const [validationError, setValidationError] = React.useState<string>("");

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      if (inputValue.trim() === "") {
        setValidationError("");
        onValidationChange?.(false);
      } else {
        const result = emailSchema.safeParse(inputValue);
        if (!result.success) {
          const message = result.error.errors[0]?.message || "Invalid email";
          setValidationError(message);
          onValidationChange?.(false);
        } else {
          setValidationError("");
          onValidationChange?.(true);
        }
      }

      inputProps.onBlur?.(e);
    };

    const displayError = externalError || validationError;

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
          type="email"
          disabled={disabled}
          readOnly={readOnly}
          value={value}
          onChange={(e) => {
            onChange?.(e.target.value);
            setValidationError("");
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          {...inputProps}
        />
      </FieldShell>
    );
  },
);

EmailField.displayName = "EmailField";
