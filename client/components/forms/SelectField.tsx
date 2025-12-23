import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { FieldShell } from "./FieldShell";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
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
 * SelectField - Select dropdown field with FieldShell wrapper
 *
 * Composed of FieldShell + Dropdown primitive for consistent select field styling.
 * Handles option lists for status, priority, and other enums.
 * 
 * Uses Dropdown primitive which includes:
 * - Automatic collision detection and side flipping
 * - Real-time repositioning on scroll/resize
 * - Modal-aware z-index stacking
 * - Consistent A11y attributes
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
 *
 * Example:
 * ```tsx
 * <SelectField
 *   label="Status"
 *   required
 *   value={status}
 *   onChange={setStatus}
 *   error={errors.status}
 *   placeholder="Select a status"
 *   options={[
 *     { value: "pending", label: "Pending" },
 *     { value: "completed", label: "Completed" },
 *   ]}
 * />
 * ```
 */
export const SelectField: React.FC<SelectFieldProps> = ({
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
          className={`h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal transition-colors flex items-center justify-between cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? "border-red-600" : "border-[var(--color-border-light)]"
          }`}
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
          className="rounded-lg border border-[var(--color-border-light)] bg-white shadow-md"
        >
          <div
            style={{
              maxHeight: "280px",
              overflowY: "auto",
              padding: "4px 0",
            }}
          >
            {options.length === 0 ? (
              <div
                style={{
                  padding: "8px 12px",
                  color: "var(--color-text-muted)",
                  fontSize: "14px",
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
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    backgroundColor:
                      value === option.value ? "rgba(36, 99, 235, 0.1)" : "transparent",
                    color: "var(--color-text-primary)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(36, 99, 235, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      value === option.value ? "rgba(36, 99, 235, 0.1)" : "transparent";
                  }}
                >
                  {value === option.value && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                  {value !== option.value && <div className="h-4 w-4" />}
                  {option.label}
                </button>
              ))
            )}
          </div>
        </Dropdown.Content>
      </Dropdown>
    </FieldShell>
  );
};

SelectField.displayName = "SelectField";
