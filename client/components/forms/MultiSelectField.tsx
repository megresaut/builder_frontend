import React, { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { FieldShell } from "./FieldShell";

export interface MultiSelectOption {
  id: string;
  label: string;
  initials?: string;
}

interface MultiSelectFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value: MultiSelectOption[];
  onChange: (value: MultiSelectOption[]) => void;
  disabled?: boolean;
  placeholder?: string;
  options: MultiSelectOption[];
}

/**
 * MultiSelectField - Multi-select dropdown field with FieldShell wrapper
 *
 * Composed of FieldShell + Dropdown primitive for consistent multi-select field styling.
 * Handles selection of multiple items with pill-style display.
 *
 * Uses Dropdown primitive which includes:
 * - Automatic collision detection and flipping based on container boundaries
 * - Real-time repositioning on scroll/resize
 * - Modal-aware z-index stacking
 * - Consistent A11y attributes
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param value - Array of selected items
 * @param onChange - Change handler (receives array of selected items)
 * @param disabled - Disable field
 * @param placeholder - Placeholder text shown when no selection
 * @param options - Array of available options
 *
 * Example:
 * ```tsx
 * <MultiSelectField
 *   label="Assignees"
 *   required
 *   value={selectedAssignees}
 *   onChange={setSelectedAssignees}
 *   error={errors.assignees}
 *   placeholder="Select assignees"
 *   options={[
 *     { id: "1", label: "David Harris", initials: "DH" },
 *     { id: "2", label: "Sarah Johnson", initials: "SJ" },
 *   ]}
 * />
 * ```
 */
export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  required = false,
  description,
  error,
  id,
  disabled = false,
  value,
  onChange,
  placeholder = "Select options",
  options,
}) => {
  const [open, setOpen] = useState(false);
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

  const toggleItem = (item: MultiSelectOption) => {
    const isSelected = value.some((v) => v.id === item.id);
    if (isSelected) {
      onChange(value.filter((v) => v.id !== item.id));
    } else {
      onChange([...value, item]);
    }
  };

  const removeItem = (itemId: string) => {
    onChange(value.filter((v) => v.id !== itemId));
  };

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
        offset={8}
        syncTriggerWidth={true}
      >
        <Dropdown.Trigger
          id={fieldId}
          disabled={disabled}
          style={{
            borderColor: error ? "#ef4444" : "var(--color-border-light)",
            borderWidth: error ? "2px" : "1px",
            minHeight: "44px",
            height: "auto",
            borderRadius: "8px",
            backgroundColor: "white",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            width: "100%",
            cursor: disabled ? "not-allowed" : "pointer",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "16px",
            border: "solid",
            opacity: disabled ? 0.6 : 1,
            justifyContent: "space-between",
          }}
        >
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {value.length === 0 ? (
              <span style={{ color: "var(--color-text-placeholder)", fontSize: "14px" }}>
                {placeholder}
              </span>
            ) : (
              value.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-1 bg-white rounded-full border border-[#2463EB] px-2 py-0.5 whitespace-nowrap"
                >
                  {item.initials && (
                    <div className="flex w-[18px] h-[18px] justify-center items-center rounded-full bg-[#2463EB]">
                      <span className="text-white font-semibold text-[8px]">
                        {item.initials}
                      </span>
                    </div>
                  )}
                  <span style={{ fontSize: "12px", color: "var(--color-text-primary)" }}>
                    {item.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    className="hover:opacity-70 transition-opacity"
                    tabIndex={-1}
                  >
                    <X className="w-3 h-3 text-[#2463EB]" />
                  </button>
                </div>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: "#303030" }} />
        </Dropdown.Trigger>

        <Dropdown.Content
          closeOnOutsideClick={true}
          closeOnEscape={true}
          style={{
            backgroundColor: "white",
            border: "1px solid var(--color-border-light)",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            zIndex: 50,
          }}
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
              options.map((option) => {
                const isSelected = value.some((v) => v.id === option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleItem(option)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      textAlign: "left",
                      backgroundColor: isSelected ? "rgba(36, 99, 235, 0.1)" : "transparent",
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
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = isSelected
                        ? "rgba(36, 99, 235, 0.1)"
                        : "transparent";
                    }}
                  >
                    {isSelected ? (
                      <Check className="h-4 w-4 text-blue-600" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    {option.initials && (
                      <div className="flex w-[24px] h-[24px] justify-center items-center rounded-full bg-[#2463EB]">
                        <span className="text-white font-semibold text-[10px]">
                          {option.initials}
                        </span>
                      </div>
                    )}
                    <span>{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </Dropdown.Content>
      </Dropdown>
    </FieldShell>
  );
};

MultiSelectField.displayName = "MultiSelectField";
