import React, { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
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
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  options: SelectOption[];
  multiple?: boolean;
}

/**
 * SelectField - Select dropdown field with FieldShell wrapper
 *
 * Composed of FieldShell + Dropdown primitive for consistent select field styling.
 * Handles option lists for status, priority, and other enums.
 * Supports both single-select and multi-select modes.
 *
 * Uses Dropdown primitive which includes:
 * - Automatic collision detection and side flipping
 * - Real-time repositioning on scroll/resize
 * - Modal-aware z-index stacking
 * - Consistent A11y attributes
 *
 * Keyboard Interactions:
 * - Enter/Space: Open dropdown (when closed) or select highlighted option
 * - ArrowDown: Navigate to next option (opens dropdown if closed)
 * - ArrowUp: Navigate to previous option
 * - Escape: Close dropdown and clear search
 * - Type character(s): Search options by label (clears after 500ms of inactivity)
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param value - Selected value (string for single-select, string[] for multi-select)
 * @param onChange - Change handler (receives selected value string or string[])
 * @param disabled - Disable field
 * @param placeholder - Placeholder text shown when no selection
 * @param options - Array of {value, label} options
 * @param multiple - Enable multi-select mode (default: false)
 *
 * Example (Single-select):
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
 *
 * Example (Multi-select):
 * ```tsx
 * <SelectField
 *   label="Categories"
 *   value={selectedCategories}
 *   onChange={setSelectedCategories}
 *   placeholder="Select categories"
 *   options={[...]}
 *   multiple
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
  multiple = false,
}) => {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [searchText, setSearchText] = React.useState("");
  const [searchTimeout, setSearchTimeout] = React.useState<NodeJS.Timeout>();

  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

  // Determine if we're in multi-select mode
  const isMultiple = multiple;
  const selectedValues = isMultiple ? (Array.isArray(value) ? value : []) : [];
  const selectedValue = !isMultiple ? (typeof value === "string" ? value : "") : "";

  // Get selected option objects
  const selectedOptions = isMultiple
    ? options.filter((opt) => selectedValues.includes(opt.value))
    : selectedValue
      ? [options.find((opt) => opt.value === selectedValue)].filter(Boolean)
      : [];

  const displayLabel = isMultiple
    ? selectedValues.length === 0
      ? placeholder
      : undefined
    : selectedOptions[0]?.label ?? placeholder;

  const isShowingPlaceholder = isMultiple ? selectedValues.length === 0 : !selectedValue;

  // Filter options based on search text
  const filteredOptions = searchText
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchText.toLowerCase()),
      )
    : options;

  const handleTriggerKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex(0);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
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
        setOpen(false);
        setSearchText("");
        break;
      default:
        // Typeahead search
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          if (!open) {
            setOpen(true);
          }

          const newSearchText = searchText + e.key;
          setSearchText(newSearchText);
          setHighlightedIndex(0);

          // Clear search after 500ms of inactivity
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
    if (isMultiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange?.(newValues);
      // Keep dropdown open in multi-select mode
    } else {
      onChange?.(optionValue);
      setOpen(false);
      setSearchText("");
    }
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent,
    optionIndex: number,
  ) => {
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
        setOpen(false);
        setSearchText("");
        break;
      default:
        break;
    }
  };

  // When dropdown is open, also handle Enter on trigger to select highlighted option
  const handleTriggerKeyDownWhenOpen = (
    e: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (!open) {
      handleTriggerKeyDown(e);
      return;
    }

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (filteredOptions.length > 0) {
          handleOptionSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      default:
        handleTriggerKeyDown(e);
        break;
    }
  };

  const removeItem = (itemValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMultiple) {
      const newValues = selectedValues.filter((v) => v !== itemValue);
      onChange?.(newValues);
    }
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
        minSpaceBelow={isMultiple ? 320 : 280}
        syncTriggerWidth={true}
      >
        <Dropdown.Trigger
          id={fieldId}
          disabled={disabled}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal transition-colors flex items-center justify-between cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? "border-red-600" : "border-[var(--color-border-light)]"
          }`}
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            lineHeight: 1.43,
            minHeight: "44px",
            height: "auto",
            display: "flex",
            alignItems: "center",
            flexWrap: isMultiple ? "wrap" : "nowrap",
            gap: isMultiple ? "6px" : "8px",
            padding: isMultiple && selectedValues.length > 0 ? "8px 12px" : "8px 12px",
          }}
          onKeyDown={handleTriggerKeyDownWhenOpen}
        >
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {isMultiple && selectedValues.length > 0 ? (
              selectedOptions.map((opt) => (
                <div
                  key={opt.value}
                  className="flex items-center gap-1.5 bg-white rounded-full border border-[#2463EB] px-2 py-1 whitespace-nowrap"
                  style={{
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "var(--color-text-primary)" }}>
                    {opt.label}
                  </span>
                  <div
                    role="button"
                    onClick={(e) => removeItem(opt.value, e)}
                    className="hover:opacity-70 transition-opacity cursor-pointer"
                    tabIndex={-1}
                  >
                    <X className="w-3 h-3 text-[#2463EB]" />
                  </div>
                </div>
              ))
            ) : (
              <span
                style={{
                  color: isShowingPlaceholder ? "#303030" : "var(--color-text-primary)",
                  fontSize: "14px",
                }}
              >
                {displayLabel}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 flex-none" style={{ color: "#303030" }} />
        </Dropdown.Trigger>

        <Dropdown.Content
          closeOnOutsideClick={true}
          closeOnEscape={true}
          className="rounded-lg border border-[var(--color-border-light)] bg-white shadow-md"
        >
          {isMultiple && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderBottom: "1px solid var(--color-border-light)",
              }}
            >
              <input
                type="text"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleTriggerKeyDown}
                autoFocus
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: 0,
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "14px",
                  color: "var(--color-text-primary)",
                  backgroundColor: "transparent",
                }}
              />
            </div>
          )}
          <div
            style={{
              maxHeight: "280px",
              overflowY: "auto",
              padding: "4px 0",
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "8px 12px",
                  color: "var(--color-text-muted)",
                  fontSize: "14px",
                }}
              >
                {searchText ? "No matching options" : "No options"}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = isMultiple
                  ? selectedValues.includes(option.value)
                  : selectedValue === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    onKeyDown={(e) => handleOptionKeyDown(e, index)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      textAlign: "left",
                      backgroundColor:
                        isSelected
                          ? "rgba(36, 99, 235, 0.15)"
                          : highlightedIndex === index
                            ? "rgba(36, 99, 235, 0.08)"
                            : "transparent",
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
                      setHighlightedIndex(index);
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        isSelected
                          ? "rgba(36, 99, 235, 0.15)"
                          : "rgba(36, 99, 235, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        isSelected
                          ? "rgba(36, 99, 235, 0.15)"
                          : "transparent";
                    }}
                  >
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                    {!isSelected && <div className="h-4 w-4" />}
                    {option.label}
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

SelectField.displayName = "SelectField";
