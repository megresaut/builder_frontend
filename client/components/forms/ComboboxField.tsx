import React, { useState, useRef, useEffect, useCallback } from "react";
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
  const [popoverSide, setPopoverSide] = useState<"bottom" | "top">("bottom");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  // Check if popover should flip to top based on available space
  const checkPopoverPosition = useCallback(() => {
    if (!open || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const contentHeight = 320; // Approximate height for dropdown list

    if (spaceBelow < contentHeight + 20 && spaceAbove > contentHeight + 20) {
      setPopoverSide("top");
    } else {
      setPopoverSide("bottom");
    }
  }, [open]);

  // Monitor for size changes while popover is open
  useEffect(() => {
    if (!open) return;

    const resizeObserver = new ResizeObserver(checkPopoverPosition);
    const scrollHandler = () => checkPopoverPosition();

    // Observe the trigger button and parent containers
    if (triggerRef.current) {
      resizeObserver.observe(triggerRef.current);
      let parent = triggerRef.current.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        resizeObserver.observe(parent);
        parent = parent.parentElement;
        depth++;
      }
    }

    // Listen for scroll and resize events
    document.addEventListener("scroll", scrollHandler, true);
    window.addEventListener("resize", checkPopoverPosition);

    // Initial check
    checkPopoverPosition();

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("scroll", scrollHandler, true);
      window.removeEventListener("resize", checkPopoverPosition);
    };
  }, [open, checkPopoverPosition]);

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
          style={{ width: triggerWidth ? `${triggerWidth}px` : "auto", maxHeight: "300px", overflow: "auto" }}
          side="bottom"
          align="start"
          avoidCollisions={true}
          sideOffset={8}
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
