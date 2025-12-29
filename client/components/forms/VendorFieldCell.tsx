import React, { useState, useRef, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  usePopoverContext,
} from "@/components/ui/popover";
import { usePopoverAutoClose } from "@/hooks/usePopoverAutoClose";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";
import { FieldCellShell } from "./FieldCellShell";
import { Check } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  usePopoverAutoClose({
    open,
    onOpenChange: setOpen,
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    contentRef: contentRef as React.RefObject<HTMLElement>,
  });

  useGlobalActionsScrollLock(open, {
    allowRefs: [
      triggerRef as React.RefObject<HTMLElement>,
      contentRef as React.RefObject<HTMLElement>,
    ],
  });

  // Filter options based on input
  const filteredOptions = options.filter((opt) =>
    opt?.label && typeof opt.label === 'string'
      ? opt.label.toLowerCase().includes((inputValue || '').toLowerCase())
      : false,
  );

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || inputValue || placeholder;

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setInputValue(optionValue);
    setOpen(false);
  };

  const handleCustomInput = (customValue: string) => {
    onChange?.(customValue);
    setInputValue(customValue);
    setOpen(false);
  };

  return (
    <FieldCellShell error={error}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            disabled={disabled}
            className="flex items-center justify-between gap-2 w-full h-9 px-3 rounded-md border border-0 text-sm bg-white text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            style={{
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            }}
            type="button"
          >
            <span
              style={{
                color:
                  value || inputValue
                    ? "var(--color-text-primary)"
                    : "#A1A1A9",
                fontSize: "13px",
                flex: 1,
                textAlign: "left",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayLabel}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          ref={contentRef}
          className="rounded-lg border border-[var(--color-border-light)] bg-white shadow-md"
          align="start"
          syncTriggerWidth={false}
          maxHeight={280}
          style={{ width: "max-content" }}
        >
          <div
            style={{
              padding: "8px 0",
              overflowY: "auto",
              overflowX: "hidden",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* Custom input field */}
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #E5E7EB" }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="w-full px-2 py-1 border border-[#DADADA] rounded text-[13px] outline-none"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              />
            </div>

            {/* Options list */}
            {filteredOptions.length > 0 && (
              <div>
                {filteredOptions.map((option) => {
                  const isSelected = value === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        textAlign: "left",
                        backgroundColor: isSelected
                          ? "rgba(36, 99, 235, 0.15)"
                          : "transparent",
                        color: "var(--color-text-primary)",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontFamily:
                          "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "background-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "rgba(36, 99, 235, 0.08)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          isSelected ? "rgba(36, 99, 235, 0.15)" : "transparent";
                      }}
                      type="button"
                    >
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                      {!isSelected && <div className="h-4 w-4 flex-shrink-0" />}
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Custom vendor input option */}
            {inputValue && !filteredOptions.find((o) => o.value === inputValue) && (
              <button
                onClick={() => handleCustomInput(inputValue)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  textAlign: "left",
                  backgroundColor: "rgba(36, 99, 235, 0.08)",
                  color: "var(--color-text-primary)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontStyle: "italic",
                }}
                type="button"
              >
                Add "{inputValue}" as vendor
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </FieldCellShell>
  );
};

VendorFieldCell.displayName = "VendorFieldCell";
