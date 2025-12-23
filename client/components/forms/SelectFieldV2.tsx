import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { FieldShell } from "./FieldShell";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldV2Props {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  options: SelectOption[];
}

/**
 * SelectFieldV2 - Enhanced Select dropdown field with improved FieldShell integration
 *
 * Composed of FieldShell + Dropdown primitive with:
 * - Better Tailwind class utilization
 * - Consistent design system token usage
 * - Cleaner styling approach (CSS variables + Tailwind)
 * - Improved accessibility
 * - Automatic collision detection and side flipping
 * - Real-time repositioning on scroll/resize
 * - Modal-aware z-index stacking
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param value - Selected value
 * @param onChange - Change handler (receives selected value string)
 * @param disabled - Disable field
 * @param placeholder - Placeholder text shown when no selection
 * @param options - Array of {value, label} options
 */
export const SelectFieldV2: React.FC<SelectFieldV2Props> = ({
  label,
  required = false,
  description,
  error,
  id,
  disabled = false,
  value,
  onChange,
  placeholder = "Select an option",
  options,
}) => {
  const [open, setOpen] = useState(false);
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label ?? placeholder;
  const isShowingPlaceholder = !selectedOption;

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={error}
      disabled={disabled}
      htmlFor={fieldId}
    >
      <Dropdown
        open={open}
        onOpenChange={setOpen}
        initialPlacement="bottom"
        minSpaceBelow={280}
        syncTriggerWidth={true}
      >
        <Dropdown.Trigger
          id={fieldId}
          disabled={disabled}
          className={cn(
            "ra-select-field-v2-trigger",
            "h-11 w-full rounded-lg border px-3 py-2",
            "bg-white text-sm font-normal",
            "flex items-center justify-between",
            "cursor-pointer transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error
              ? "border-red-600"
              : "border-[var(--color-border-light)]"
          )}
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            lineHeight: 1.43,
          }}
        >
          <span
            className="overflow-hidden text-ellipsis whitespace-nowrap"
            style={{
              color: "var(--color-text-primary)",
            }}
          >
            {selectedLabel}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" style={{ color: "#303030" }} />
        </Dropdown.Trigger>

        <Dropdown.Content
          closeOnOutsideClick={true}
          closeOnEscape={true}
          className="ra-select-field-v2-content rounded-lg border border-[var(--color-border-light)] bg-white shadow-md"
        >
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: "280px",
              padding: "4px 0",
            }}
          >
            {options.length === 0 ? (
              <div
                className="px-3 py-2 text-sm"
                style={{
                  color: "var(--color-text-muted)",
                }}
              >
                No options
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange?.(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "ra-select-field-v2-option",
                    "w-full px-3 py-2 text-left text-sm",
                    "flex items-center gap-2",
                    "border-none cursor-pointer",
                    "transition-colors",
                    value === option.value
                      ? "bg-[rgba(36,99,235,0.1)]"
                      : "bg-transparent hover:bg-[rgba(36,99,235,0.08)]"
                  )}
                  style={{
                    fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {value === option.value ? (
                    <Check className="h-4 w-4 shrink-0 text-blue-600" />
                  ) : (
                    <div className="h-4 w-4 shrink-0" />
                  )}
                  <span>{option.label}</span>
                </button>
              ))
            )}
          </div>
        </Dropdown.Content>
      </Dropdown>
    </FieldShell>
  );
};

SelectFieldV2.displayName = "SelectFieldV2";
