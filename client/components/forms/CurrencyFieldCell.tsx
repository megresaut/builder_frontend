import React, { useState, useRef, useEffect } from "react";
import { FieldCellShell } from "./FieldCellShell";

interface CurrencyFieldCellProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  placeholder?: string;
}

const formatCurrency = (value: string): string => {
  if (!value) return "$0.00";
  const numValue = parseFloat(value.replace(/[^\d.-]/g, ""));
  if (isNaN(numValue)) return "$0.00";
  return `$${numValue.toFixed(2)}`;
};

const parseNumericValue = (value: string): number => {
  const numValue = parseFloat(value.replace(/[^\d.-]/g, ""));
  return isNaN(numValue) ? 0 : numValue;
};

/**
 * CurrencyFieldCell - Spreadsheet-style currency cell
 *
 * Display mode: Shows formatted currency ($X.XX)
 * Edit mode: Shows numeric input only
 * Click to enter edit, blur/Enter/Escape to exit
 */
export const CurrencyFieldCell: React.FC<CurrencyFieldCellProps> = ({
  value = "",
  onChange,
  disabled = false,
  error = false,
  id,
  placeholder = "$0",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const numericValue = parseNumericValue(value);
  const displayValue = formatCurrency(value);

  // Enter edit mode
  const handleDisplayClick = () => {
    if (disabled) return;
    setIsEditing(true);
    setDraftValue(numericValue.toString());
  };

  // Commit changes and exit edit mode
  const handleCommit = () => {
    const parsedValue = parseNumericValue(draftValue);
    onChange?.(parsedValue.toString());
    setIsEditing(false);
    setDraftValue("");
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setDraftValue("");
    }
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <FieldCellShell error={error}>
      {!isEditing ? (
        <div
          onClick={handleDisplayClick}
          className="cursor-pointer w-full text-right select-none"
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "13px",
            color: disabled ? "#A1A1A9" : "#303030",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {displayValue}
        </div>
      ) : (
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draftValue}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || /^[\d]*\.?\d{0,2}$/.test(val)) {
              setDraftValue(val);
            }
          }}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          placeholder="0"
          disabled={disabled}
          className="w-full bg-transparent outline-none text-[13px] text-right placeholder-[#A1A1A9] disabled:opacity-50"
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          }}
        />
      )}
    </FieldCellShell>
  );
};

CurrencyFieldCell.displayName = "CurrencyFieldCell";
