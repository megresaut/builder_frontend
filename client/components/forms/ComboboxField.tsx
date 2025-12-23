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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
 * Composed of FieldShell + Combobox (Command + Popover) for consistent combobox styling.
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
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(undefined);
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={fieldId}
            ref={(el) => {
              if (el && !triggerWidth) {
                setTriggerWidth(el.offsetWidth);
              }
            }}
            variant="outline"
            role="combobox"
            aria-expanded={open}
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
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedLabel}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{ width: triggerWidth ? `${triggerWidth}px` : "auto", maxHeight: "300px", overflow: "hidden" }}
          side="bottom"
          align="start"
          avoidCollisions={true}
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
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
};

ComboboxField.displayName = "ComboboxField";
