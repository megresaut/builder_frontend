import React, { forwardRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FieldShell } from "./FieldShell";

interface TextAreaFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "type"> {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  autoGrow?: boolean;
}

/**
 * TextAreaField - Textarea input field with FieldShell wrapper
 *
 * Composed of FieldShell + Textarea for consistent textarea styling.
 * Supports auto-growing textarea that expands with content.
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param placeholder - Textarea placeholder
 * @param disabled - Disable field
 * @param autoGrow - Auto expand height as user types (default: true)
 * @param onChange - Change handler
 * @param value - Field value
 *
 * Example:
 * ```tsx
 * <TextAreaField
 *   label="Notes"
 *   placeholder="Enter any additional notes..."
 *   autoGrow
 *   error={errors.notes}
 *   value={notes}
 *   onChange={(e) => setNotes(e.target.value)}
 * />
 * ```
 */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    {
      label,
      required = false,
      description,
      error,
      id,
      disabled = false,
      autoGrow = true,
      ...textareaProps
    },
    ref,
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <FieldShell
        label={label}
        required={required}
        description={description}
        error={error}
        disabled={disabled}
        htmlFor={fieldId}
      >
        <Textarea
          ref={ref}
          id={fieldId}
          disabled={disabled}
          autoGrow={autoGrow}
          {...textareaProps}
        />
      </FieldShell>
    );
  },
);

TextAreaField.displayName = "TextAreaField";
