import React from "react";
import { FieldCellShell } from "./FieldCellShell";

interface NumberFieldCellProps {
  value?: string | number;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  placeholder?: string;
  decimals?: number;
}

/**
 * NumberFieldCell - Number input for table cells
 *
 * Renders a numeric input in a table cell with decimal place validation.
 * Default allows 1 decimal place for hours.
 */
export const NumberFieldCell: React.FC<NumberFieldCellProps> = ({
  value = "",
  onChange,
  disabled = false,
  error = false,
  id,
  placeholder = "0",
  decimals = 1,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const regex = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`);
    if (val === "" || regex.test(val)) {
      onChange?.(val);
    }
  };

  return (
    <FieldCellShell error={error}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
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

NumberFieldCell.displayName = "NumberFieldCell";
