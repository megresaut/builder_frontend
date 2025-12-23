import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { FieldShell } from "./FieldShell";

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxFieldProps {
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
}

/**
 * ComboboxField - Searchable combobox field with FieldShell wrapper
 *
 * Features:
 * - Search input inside dropdown for filtering options
 * - Selected state indicator with checkmark
 * - Min/max dropdown height with scrollable content
 * - Arrow key navigation, typeahead search, Enter/Escape support
 * - Clear error messaging
 *
 * Keyboard Interactions:
 * - Click or Space/Enter: Open dropdown
 * - Type in search field: Filter options in real-time
 * - ArrowDown/ArrowUp: Navigate options
 * - Enter: Select highlighted option
 * - Escape: Close dropdown
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
 * @param searchPlaceholder - Placeholder text in search input (default: "Search...")
 * @param options - Array of {value, label} options
 * @param emptyMessage - Message when no options match search (default: "No results found")
 *
 * Example:
 * ```tsx
 * <ComboboxField
 *   label="Vendor"
 *   required
 *   value={vendorId}
 *   onChange={setVendorId}
 *   error={errors.vendor}
 *   placeholder="Select vendor"
 *   options={vendors.map(v => ({ value: v.id, label: v.name }))}
 * />
 * ```
 */
export const ComboboxField: React.FC<ComboboxFieldProps> = ({
  label,
  required = false,
  description,
  error,
  id,
  disabled = false,
  value,
  onChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  options,
  emptyMessage = "No results found",
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const commandRef = useRef<any>(null);

  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label ?? placeholder;

  // Filter options based on search term
  const filteredOptions = searchTerm
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const input = contentRef.current?.querySelector(
          'input[type="text"]',
        ) as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleTriggerClick = () => {
    setOpen(!open);
  };

  const handleTriggerKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue === value ? "" : optionValue);
    setOpen(false);
    setSearchTerm("");
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
      <div style={{ position: "relative" }}>
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          id={fieldId}
          disabled={disabled}
          className={`h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal transition-colors flex items-center justify-between cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? "border-red-600" : "border-[var(--color-border-light)]"
          }`}
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            lineHeight: 1.43,
          }}
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
          type="button"
        >
          <span
            className="overflow-hidden text-ellipsis whitespace-nowrap"
            style={{
              color: "var(--color-text-primary)",
              textAlign: "left",
            }}
          >
            {selectedLabel}
          </span>
          <ChevronsUpDown
            className="ml-2 h-4 w-4 shrink-0"
            style={{ color: "#303030" }}
          />
        </button>

        {/* Dropdown Content */}
        {open && (
          <div
            ref={contentRef}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 50,
              marginTop: "8px",
              backgroundColor: "white",
              border: "1px solid var(--color-border-light)",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchTerm}
                onValueChange={setSearchTerm}
                style={{
                  borderBottom: "1px solid var(--color-border-light)",
                  padding: "8px 12px",
                }}
              />
              {filteredOptions.length === 0 ? (
                <CommandEmpty style={{ padding: "16px 8px", textAlign: "center" }}>
                  {emptyMessage}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  <CommandList
                    style={{
                      maxHeight: "280px",
                      minHeight: "150px",
                      overflow: "auto",
                      padding: "4px 0",
                    }}
                  >
                    {filteredOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => handleSelect(option.value)}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          backgroundColor:
                            value === option.value
                              ? "rgba(36, 99, 235, 0.15)"
                              : "transparent",
                        }}
                        className="transition-colors"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === option.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <span style={{ color: "var(--color-text-primary)" }}>
                          {option.label}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </CommandGroup>
              )}
            </Command>
          </div>
        )}

        {/* Overlay to close on outside click */}
        {open && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 40,
            }}
            onClick={() => setOpen(false)}
          />
        )}
      </div>
    </FieldShell>
  );
};

ComboboxField.displayName = "ComboboxField";
