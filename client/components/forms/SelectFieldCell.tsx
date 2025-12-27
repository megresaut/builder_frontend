import React, { useState } from "react";
import { useState, useRef } from "react";
import { Check } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { usePopoverAutoClose } from "@/hooks/usePopoverAutoClose";
import { FieldCellShell } from "./FieldCellShell";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldCellProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  id?: string;
}

/**
 * SelectFieldCell - Select dropdown for table cells
 *
 * Minimal select field optimized for use in table cells.
 * Features a clean text display with no border or chevron - just clickable text
 * with a dropdown popover below.
 *
 * Uses FieldCellShell for wrapper and Popover primitive for dropdown logic.
 * Includes keyboard navigation and search support.
 *
 * Keyboard Interactions:
 * - Enter/Space: Open dropdown (when closed) or select highlighted option
 * - ArrowDown: Navigate to next option (opens dropdown if closed)
 * - ArrowUp: Navigate to previous option
 * - Escape: Close dropdown and clear search
 * - Type character(s): Search options by label (clears after 500ms of inactivity)
 *
 * @param value - Selected value (string)
 * @param onChange - Change handler (receives selected value string)
 * @param options - Array of {value, label} options
 * @param placeholder - Placeholder text shown when no selection (default: "Select...")
 * @param disabled - Disable field (default: false)
 * @param error - Show error styling with red inset shadow (default: false)
 * @param id - HTML id attribute
 *
 * Example (Table cell):
 * ```tsx
 * <SelectFieldCell
 *   value={item.property}
 *   onChange={(value) => handleUpdateLineItem(item.id, "property", value)}
 *   options={[
 *     { value: "22 Indian Creek Dr", label: "22 Indian Creek Dr" },
 *     { value: "25 Park Ave", label: "25 Park Ave" },
 *   ]}
 *   placeholder="Select a Property"
 *   error={lineItemErrors[item.id]?.has("property")}
 * />
 * ```
 */
export const SelectFieldCell: React.FC<SelectFieldCellProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  error = false,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [searchText, setSearchText] = React.useState("");
  const [searchTimeout, setSearchTimeout] = React.useState<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fieldId = id || "select-cell";

  usePopoverAutoClose({
    open,
    onOpenChange: setOpen,
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    contentRef: contentRef as React.RefObject<HTMLElement>,
  });

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const isShowingPlaceholder = !value;

  const filteredOptions = searchText
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchText.toLowerCase()),
      )
    : options;

  const handleOpen = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchText("");
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) {
          handleOpen(true);
          setHighlightedIndex(0);
        } else if (filteredOptions.length > 0) {
          const selected = filteredOptions[highlightedIndex];
          onChange?.(selected.value);
          handleOpen(false);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          handleOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev,
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        }
        break;
      case "Escape":
        e.preventDefault();
        handleOpen(false);
        break;
      default:
        // Typeahead search
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          if (!open) {
            handleOpen(true);
          }

          const newSearchText = searchText + e.key;
          setSearchText(newSearchText);
          setHighlightedIndex(0);

          if (searchTimeout) clearTimeout(searchTimeout);
          setSearchTimeout(
            setTimeout(() => {
              setSearchText("");
            }, 500),
          );
        }
        break;
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    onChange?.(optionValue);
    handleOpen(false);
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, optionIndex: number) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        handleOptionSelect(filteredOptions[optionIndex].value);
        break;
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Escape":
        e.preventDefault();
        handleOpen(false);
        break;
      default:
        break;
    }
  };

  const trigger = (
    <PopoverTrigger
      ref={triggerRef}
      id={fieldId}
      disabled={disabled}
      className="w-full text-sm font-normal transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
        lineHeight: 1.43,
        minHeight: "auto",
        height: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "0",
        background: "transparent",
        border: "none",
        padding: "0",
        outline: "none",
        boxShadow: error ? "inset 0 0 0 2px #ef4444" : "none",
        borderRadius: "4px",
        width: "100%",
      }}
      onKeyDown={handleTriggerKeyDown}
    >
      <span
        style={{
          color: isShowingPlaceholder ? "#A1A1A9" : "var(--color-text-primary)",
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
    </PopoverTrigger>
  );

  const content = (
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
          padding: "4px 0",
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {filteredOptions.length === 0 ? (
          <div
            style={{
              padding: "8px 12px",
              color: "var(--color-text-muted)",
              fontSize: "13px",
            }}
          >
            {searchText ? "No matching options" : "No options"}
          </div>
        ) : (
          filteredOptions.map((option, index) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(option.value)}
                onKeyDown={(e) => handleOptionKeyDown(e, index)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  textAlign: "left",
                  backgroundColor: isSelected
                    ? "rgba(36, 99, 235, 0.15)"
                    : highlightedIndex === index
                      ? "rgba(36, 99, 235, 0.08)"
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
                onMouseEnter={() => {
                  setHighlightedIndex(index);
                }}
              >
                {isSelected && (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                )}
                {!isSelected && <div className="h-4 w-4 flex-shrink-0" />}
                <span>{option.label}</span>
              </button>
            );
          })
        )}
      </div>
    </PopoverContent>
  );

  return (
    <FieldCellShell error={error}>
      <Popover open={open} onOpenChange={handleOpen}>
        {trigger}
        {content}
      </Popover>
    </FieldCellShell>
  );
};

SelectFieldCell.displayName = "SelectFieldCell";
