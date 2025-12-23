import React, { forwardRef, useState } from "react";
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
  showCharCount?: boolean;
  readOnly?: boolean;
}

/**
 * TextAreaField - Textarea input field with FieldShell wrapper
 *
 * Composed of FieldShell + Textarea for consistent textarea styling.
 * Supports auto-growing textarea that expands with content and optional character count.
 *
 * Features:
 * - Auto-expanding height as user types
 * - Optional character count display (e.g., "45 / 500")
 * - Validates against maxLength if provided
 * - Accessible label and error handling
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param placeholder - Textarea placeholder
 * @param disabled - Disable field
 * @param autoGrow - Auto expand height as user types (default: true)
 * @param showCharCount - Show character count display (default: false)
 * @param maxLength - Maximum number of characters (enables char count if showCharCount=true)
 * @param onChange - Change handler
 * @param value - Field value
 * @param readOnly - Read-only mode (shows value but not interactive, no validation errors)
 *
 * Example:
 * ```tsx
 * <TextAreaField
 *   label="Notes"
 *   placeholder="Enter any additional notes..."
 *   autoGrow
 *   showCharCount
 *   maxLength={500}
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
      showCharCount = false,
      value = "",
      maxLength,
      onChange,
      readOnly = false,
      ...textareaProps
    },
    ref,
  ) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const [charCount, setCharCount] = useState(String(value).length);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (readOnly) return;
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    const charCountText = maxLength ? `${charCount} / ${maxLength}` : `${charCount}`;
    const isNearLimit = maxLength && charCount >= maxLength * 0.9;

    return (
      <FieldShell
        label={label}
        required={required}
        description={description}
        error={readOnly ? undefined : error}
        disabled={disabled || readOnly}
        htmlFor={fieldId}
      >
        <div style={{ position: "relative" }}>
          <Textarea
            ref={ref}
            id={fieldId}
            disabled={disabled}
            readOnly={readOnly}
            autoGrow={autoGrow}
            value={value}
            maxLength={maxLength}
            onChange={handleChange}
            {...textareaProps}
          />
          {showCharCount && (
            <div
              style={{
                fontSize: "12px",
                color: isNearLimit ? "#ef4444" : "var(--color-text-muted)",
                marginTop: "4px",
                textAlign: "right",
                fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              }}
            >
              {charCountText}
            </div>
          )}
        </div>
      </FieldShell>
    );
  },
);

TextAreaField.displayName = "TextAreaField";
