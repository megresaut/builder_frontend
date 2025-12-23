import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dropdown } from "@/components/ui/dropdown";
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
 * Composed of FieldShell + Dropdown primitive + Command for search + consistent styling.
 * Supports searching within large option lists (vendor, property, GL account).
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
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

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
        minSpaceBelow={320}
        offset={8}
        syncTriggerWidth={true}
      >
        <Dropdown.Trigger
          id={fieldId}
          disabled={disabled}
          style={{
            borderColor: error ? "#ef4444" : "var(--color-border-light)",
            borderWidth: error ? "2px" : "1px",
            height: "44px",
            borderRadius: "8px",
            justifyContent: "space-between",
            backgroundColor: "white",
            color: value ? "var(--color-text-primary)" : "var(--color-text-placeholder)",
            fontWeight: 400,
            opacity: disabled ? 0.6 : 1,
            width: "100%",
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "16px",
            border: "solid",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              <CommandList>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onChange?.(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </Command>
        </Dropdown.Content>
      </Dropdown>
    </FieldShell>
  );
};

ComboboxField.displayName = "ComboboxField";
