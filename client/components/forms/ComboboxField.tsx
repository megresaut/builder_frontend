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
 * Uses Popover primitive which includes:
 * - Automatic scroll locking when open
 * - 150px proximity-based auto-close
 * - Search input inside dropdown for filtering options
 * - Selected state indicator with checkmark
 * - Min/max dropdown height with scrollable content
 * - Arrow key navigation, typeahead search, Enter/Escape support
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
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label ?? placeholder;

  // Filter options based on search term
  const filteredOptions = searchTerm
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  // Reset highlighted index when search term changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Single focus path: we control focus so Radix doesn't steal it (onOpenAutoFocus preventDefault).
  // Short delay so popover is fully mounted and avoids same-tap close on mobile.
  useEffect(() => {
    if (open && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue === value ? "" : optionValue);
    setOpen(false);
    setSearchTerm("");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filteredOptions.length === 0) return;

    switch (e.key) {
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
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setSearchTerm("");
        break;
      default:
        break;
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
      <Popover open={open} onOpenChange={setOpen} modal={false}>
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
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            const target = e.target as Node;
            if (contentRef.current?.contains(target)) {
              e.preventDefault();
            }
          }}
        >
          <div
            ref={contentRef}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "280px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderBottom: "1px solid var(--color-border-light)",
                flexShrink: 0,
              }}
            >
              <Search className="h-4 w-4" style={{ color: "#717179" }} />
              <input
                ref={searchInputRef}
                type="text"
                inputMode="search"
                autoComplete="off"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: 0,
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "16px",
                  color: "var(--color-text-primary)",
                  backgroundColor: "transparent",
                }}
              />
            </div>

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
                    minHeight: "100px",
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
          </div>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
};

ComboboxField.displayName = "ComboboxField";
