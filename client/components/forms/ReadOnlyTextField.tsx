import React from "react";
import { FieldShell } from "./FieldShell";

interface ReadOnlyTextFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  id?: string;
  value?: string | number;
  placeholder?: string;
}

/**
 * ReadOnlyTextField - Display-only text field with FieldShell wrapper
 *
 * Used for showing calculated values, derived data, IDs, or other non-editable content.
 * Styled differently from disabled (implies copyable, not just unavailable).
 *
 * Features:
 * - Light gray background to indicate read-only state
 * - No border on focus (not interactive)
 * - Semantic FieldShell integration
 * - Copyable content (user can select and copy text)
 * - Clean typography matching other fields
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param id - HTML id attribute
 * @param value - Display value (text or number)
 * @param placeholder - Placeholder text when empty
 *
 * Example:
 * ```tsx
 * <ReadOnlyTextField
 *   label="Order ID"
 *   value={orderId}
 *   description="Auto-generated identifier"
 * />
 * ```
 */
export const ReadOnlyTextField: React.FC<ReadOnlyTextFieldProps> = ({
  label,
  required = false,
  description,
  id,
  value = "",
  placeholder = "—",
}) => {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      disabled={false}
      htmlFor={fieldId}
    >
      <div
        style={{
          borderRadius: "8px",
          backgroundColor: "#f5f5f5",
          border: "1px solid var(--color-border-light)",
          padding: "8px 12px",
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: 1.43,
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          color: value ? "#303030" : "#717179",
          minHeight: "44px",
          display: "flex",
          alignItems: "center",
          userSelect: "text",
          cursor: "default",
        }}
      >
        {value || placeholder}
      </div>
    </FieldShell>
  );
};

ReadOnlyTextField.displayName = "ReadOnlyTextField";
