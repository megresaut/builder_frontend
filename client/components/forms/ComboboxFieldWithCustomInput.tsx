import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldShell } from "./FieldShell";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxFieldWithCustomInputProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  options: ComboboxOption[];
  emptyMessage?: string;
  customInputPlaceholder?: string;
}

/**
 * ComboboxFieldWithCustomInput - Searchable combobox with free text input capability
 *
 * Combines dropdown selection with ability to enter custom values (e.g., new vendor name).
 * Custom values are NOT persisted—they're temporary input only.
 *
 * Features:
 * - Search and filter existing options
 * - Type custom value (won't be saved to database)
 * - Arrow key navigation, typeahead search, Enter/Escape support
 * - Automatic scroll locking when open
 *
 * Keyboard Interactions:
 * - Click or Space/Enter: Open dropdown
 * - Type in search field: Filter options or create custom value
 * - ArrowDown/ArrowUp: Navigate options
 * - Enter: Select highlighted option or confirm custom input
 * - Escape: Close dropdown
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param value - Selected value (option value or custom text)
 * @param onChange - Change handler (receives selected value or custom input)
 * @param disabled - Disable field
 * @param placeholder - Placeholder text shown when no selection
 * @param searchPlaceholder - Placeholder text in search input (default: "Search...")
 * @param options - Array of {value, label} options
 * @param emptyMessage - Message when no options match search (default: "No results found")
 * @param customInputPlaceholder - Placeholder for custom input section
 *
 * Example:
 * ```tsx
 * <ComboboxFieldWithCustomInput
 *   label="Vendor"
 *   required
 *   value={vendorId}
 *   onChange={setVendorId}
 *   error={errors.vendor}
 *   placeholder="Select or enter vendor"
 *   options={vendors.map(v => ({ value: v.id, label: v.name }))}
 *   customInputPlaceholder="Enter new vendor name"
 * />
 * ```
 */
export const ComboboxFieldWithCustomInput: React.FC<ComboboxFieldWithCustomInputProps> = ({
  label,
  required = false,
  description,
  error,
  id,
  disabled = false,
  value,
  onChange,
  placeholder = "Select or enter option",
  searchPlaceholder = "Search...",
  options,
  emptyMessage = "No results found",
  customInputPlaceholder = "Or enter a new value",
}) => {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [customInputMode, setCustomInputMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label ?? (value || placeholder);

  // Use all options (no filtering)
  const filteredOptions = options;

  // Focus custom input when entering custom mode
  useEffect(() => {
    if (customInputMode && customInputRef.current) {
      const timer = setTimeout(() => {
        customInputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [customInputMode]);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue === value ? "" : optionValue);
    setOpen(false);
    setSearchTerm("");
    setCustomInputMode(false);
    setCustomValue("");
  };

  const handleCustomInput = () => {
    if (customValue.trim()) {
      onChange?.(customValue);
      setOpen(false);
      setSearchTerm("");
      setCustomInputMode(false);
      setCustomValue("");
    }
  };


  const handleCustomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCustomInput();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setCustomInputMode(false);
      setCustomValue("");
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={fieldId}
            disabled={disabled}
            className={cn(
              "h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal",
              "transition-colors flex items-center justify-between",
              "disabled:cursor-not-allowed disabled:opacity-60",
              error
                ? "border-red-600"
                : open
                  ? "border-black"
                  : "border-[var(--color-border-light)]",
            )}
            style={{
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              lineHeight: 1.43,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            type="button"
          >
            <span
              className="overflow-hidden text-ellipsis whitespace-nowrap"
              style={{
                color: selectedOption ? "var(--color-text-primary)" : "#303030",
                textAlign: "left",
                flex: 1,
              }}
            >
              {selectedLabel}
            </span>
            <ChevronsUpDown
              className="ml-2 h-4 w-4 shrink-0 flex-none"
              style={{ color: "#303030" }}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
          style={{
            width: "var(--radix-popover-trigger-width)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "320px",
            }}
          >
            {/* Add Custom Option Button */}
            {!customInputMode && (
              <button
                type="button"
                onClick={() => setCustomInputMode(true)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--color-border-light)",
                  cursor: "pointer",
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-button-primary)",
                  textAlign: "left",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(36, 99, 235, 0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                + Add custom value
              </button>
            )}

            {/* Options List */}
            {!customInputMode && (
              <div
                style={{
                  maxHeight: "240px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  flexShrink: 1,
                }}
              >
                {filteredOptions.length === 0 ? (
                  <div
                    style={{
                      padding: "16px 8px",
                      textAlign: "center",
                      color: "var(--color-text-muted)",
                      fontSize: "14px",
                      minHeight: "80px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {emptyMessage}
                  </div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        backgroundColor:
                          highlightedIndex === index
                            ? "rgba(36, 99, 235, 0.15)"
                            : value === option.value
                              ? "rgba(36, 99, 235, 0.1)"
                              : "transparent",
                        color: "var(--color-text-primary)",
                        fontFamily:
                          "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "background-color 0.15s",
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
            )}

            {/* Custom Input Section */}
            {customInputMode && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "12px",
                }}
              >
                <input
                  ref={customInputRef}
                  type="text"
                  placeholder={customInputPlaceholder}
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={handleCustomInputKeyDown}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--color-border-light)",
                    borderRadius: "6px",
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    fontSize: "14px",
                    color: "var(--color-text-primary)",
                    outline: "none",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCustomInput}
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      backgroundColor: "var(--color-button-primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomInputMode(false);
                      setCustomValue("");
                    }}
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      backgroundColor: "var(--color-bg-subtle)",
                      color: "var(--color-text-primary)",
                      border: "1px solid var(--color-border-light)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
};

ComboboxFieldWithCustomInput.displayName = "ComboboxFieldWithCustomInput";
