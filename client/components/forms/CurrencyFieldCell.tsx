import React from "react";
import { FieldCellShell } from "./FieldCellShell";

interface CurrencyFieldCellProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  placeholder?: string;
}

/**
 * CurrencyFieldCell - Currency input for table cells
 *
 * Renders a currency input in a table cell with validation.
 * Accepts: $1234.56 or 1234.56 format
 */
export const CurrencyFieldCell: React.FC<CurrencyFieldCellProps> = ({
  value = "",
  onChange,
  disabled = false,
  error = false,
  id,
  placeholder = "$0",
}) => {
  const displayValue = value ? `$${parseFloat(value.replace(/[^\d.-]/g, "")).toFixed(2)}` : placeholder;

  return (
    <FieldCellShell error={error}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "" || /^\$?[\d,]*\.?\d{0,2}$/.test(val)) {
            onChange?.(val);
          }
        }}
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

CurrencyFieldCell.displayName = "CurrencyFieldCell";
