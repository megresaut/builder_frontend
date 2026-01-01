import React from "react";
import { FieldCellShell } from "./FieldCellShell";

interface TextFieldCellProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  placeholder?: string;
}

/**
 * TextFieldCell - Text input for table cells
 *
 * Renders a simple text input in a table cell.
 */
export const TextFieldCell: React.FC<TextFieldCellProps> = ({
  value = "",
  onChange,
  disabled = false,
  error = false,
  id,
  placeholder = "",
}) => {
  return (
    <FieldCellShell error={error}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9] disabled:opacity-50"
        style={{
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
        }}
      />
    </FieldCellShell>
  );
};

TextFieldCell.displayName = "TextFieldCell";
