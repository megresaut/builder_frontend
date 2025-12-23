import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { FieldShell } from "./FieldShell";

interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  readOnly?: boolean;
}

/**
 * TextField - Text input field with FieldShell wrapper
 *
 * Composed of FieldShell + Input for consistent text field styling.
 * Handles label, required indicator, helper text, and error messages.
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param placeholder - Input placeholder
 * @param disabled - Disable field
 * @param readOnly - Read-only mode (shows value but not interactive, no validation errors)
 * @param onChange - Change handler
 * @param value - Field value
 *
 * Example:
 * ```tsx
 * <TextField
 *   label="First Name"
 *   required
 *   placeholder="John"
 *   error={errors.firstName}
 *   value={firstName}
 *   onChange={(e) => setFirstName(e.target.value)}
 * />
 * ```
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      required = false,
      description,
      error,
      id,
      disabled = false,
      readOnly = false,
      ...inputProps
    },
    ref,
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <FieldShell
        label={label}
        required={required}
        description={description}
        error={readOnly ? undefined : error}
        disabled={disabled || readOnly}
        htmlFor={fieldId}
      >
        <Input
          ref={ref}
          id={fieldId}
          disabled={disabled}
          readOnly={readOnly}
          {...inputProps}
        />
      </FieldShell>
    );
  },
);

TextField.displayName = "TextField";
