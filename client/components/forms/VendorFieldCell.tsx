import React, { useState } from "react";
import { ComboboxFieldWithCustomInput } from "./ComboboxFieldWithCustomInput";
import { FieldCellShell } from "./FieldCellShell";

interface VendorFieldCellProps {
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  placeholder?: string;
}

/**
 * VendorFieldCell - Combobox with custom input for vendor selection in table cells
 *
 * Allows selecting from predefined vendors or typing a custom vendor name.
 */
export const VendorFieldCell: React.FC<VendorFieldCellProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  error = false,
  id,
  placeholder = "Select or type vendor...",
}) => {
  return (
    <FieldCellShell error={error}>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          height: "100%",
          minHeight: "100%",
        }}
      >
        <div style={{ width: "100%", display: "flex", alignItems: "center" }}>
          <ComboboxFieldWithCustomInput
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
      </div>
    </FieldCellShell>
  );
};

VendorFieldCell.displayName = "VendorFieldCell";
