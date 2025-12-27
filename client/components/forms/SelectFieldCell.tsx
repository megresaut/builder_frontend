import React, { useState, useRef } from "react";
import { Check } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  usePopoverContext,
} from "@/components/ui/popover";
import { usePopoverAutoClose } from "@/hooks/usePopoverAutoClose";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";
import { FieldCellShell } from "./FieldCellShell";
import { useEffect } from "react";

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const popoverContext = usePopoverContext();

  const fieldId = id || "select-cell";

  // Register options with Popover for typeahead search
  useEffect(() => {
    if (open) {
      popoverContext.setSearchableItems(
        options.map((opt) => ({ value: opt.value, label: opt.label }))
      );
    }
  }, [open, options, popoverContext]);

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

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const isShowingPlaceholder = !value;

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setHighlightedIndex(0);
        } else if (popoverContext.filteredItems.length > 0) {
          const item = popoverContext.filteredItems[highlightedIndex];
          onChange?.(item.value);
          setOpen(false);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) =>
            prev < popoverContext.filteredItems.length - 1 ? prev + 1 : prev,
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
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setOpen(false);
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, optionIndex: number) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        handleOptionSelect(popoverContext.filteredItems[optionIndex].value);
        break;
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < popoverContext.filteredItems.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
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
        {popoverContext.filteredItems.length === 0 ? (
          <div
            style={{
              padding: "8px 12px",
              color: "var(--color-text-muted)",
              fontSize: "13px",
            }}
          >
            {popoverContext.filteredItems.length === 0 && options.length > 0
              ? "No matching options"
              : "No options"}
          </div>
        ) : (
          popoverContext.filteredItems.map((item, index) => {
            const option = options.find((opt) => opt.value === item.value);
            if (!option) return null;
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
      <Popover open={open} onOpenChange={setOpen}>
        {trigger}
        {content}
      </Popover>
    </FieldCellShell>
  );
};

SelectFieldCell.displayName = "SelectFieldCell";
