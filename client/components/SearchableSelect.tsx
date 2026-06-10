import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface BaseProps {
  options: SearchableSelectOption[];
  allLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Fixed width for the dropdown popover in px. Defaults to syncing with trigger width. */
  popoverWidth?: number;
}

interface SingleProps extends BaseProps {
  multiSelect?: false;
  value: string;
  onChange: (v: string) => void;
}

interface MultiProps extends BaseProps {
  multiSelect: true;
  value: string[];
  onChange: (v: string[]) => void;
}

export type SearchableSelectProps = SingleProps | MultiProps;

export function SearchableSelect(props: SearchableSelectProps) {
  const { options, allLabel = "All", disabled = false, className, popoverWidth } = props;
  const [open, setOpen] = React.useState(false);

  // ── normalise to arrays for internal logic ───────────────────────────────
  const isMulti = props.multiSelect === true;

  // Extract typed values once to avoid narrowing failures inside closures
  const multiValue  = isMulti ? (props as MultiProps).value  : ([] as string[]);
  const singleValue = isMulti ? ""                           : (props as SingleProps).value;
  const onChangeMulti = isMulti ? (props as MultiProps).onChange  : null;
  const onChangeSingle = isMulti ? null                           : (props as SingleProps).onChange;

  const hasValue = isMulti ? multiValue.length > 0 : !!singleValue;

  // ── trigger label ─────────────────────────────────────────────────────────
  const triggerLabel: string = (() => {
    if (!hasValue) return allLabel;
    if (isMulti) {
      if (multiValue.length === 1) {
        return options.find((o) => o.value === multiValue[0])?.label ?? multiValue[0];
      }
      return `${multiValue.length} selected`;
    }
    return options.find((o) => o.value === singleValue)?.label ?? singleValue;
  })();

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleClear = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onChangeMulti?.([]);
    onChangeSingle?.("");
    setOpen(false);
  };

  const handleSelect = (optValue: string) => {
    if (optValue === "__all__") {
      onChangeMulti?.([]);
      onChangeSingle?.("");
      setOpen(false);
      return;
    }
    if (isMulti && onChangeMulti) {
      const next = multiValue.includes(optValue)
        ? multiValue.filter((v) => v !== optValue)
        : [...multiValue, optValue];
      onChangeMulti(next);
      // keep popover open for multi-select
    } else if (onChangeSingle) {
      onChangeSingle(optValue);
      setOpen(false);
    }
  };

  const isChecked = (optValue: string) =>
    isMulti ? multiValue.includes(optValue) : singleValue === optValue;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            "flex items-center justify-between gap-1.5 border border-[#E5E5E5] rounded-md px-2.5 py-1.5 text-sm bg-white text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764] disabled:opacity-50 disabled:cursor-not-allowed text-left",
            className,
          )}
        >
          <span className={cn("truncate", !hasValue && "text-[#717179]")}>
            {triggerLabel}
          </span>
          <span className="flex items-center gap-0.5 shrink-0">
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleClear(e);
                }}
                className="text-[#717179] hover:text-[#303030] rounded-full p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-[#717179] transition-transform",
                open && "rotate-180",
              )}
            />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0"
        maxHeight={320}
        scrollable={false}
        syncTriggerWidth={!popoverWidth}
        style={popoverWidth ? { width: `${popoverWidth}px` } : undefined}
      >
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList className="max-h-[280px]">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__all__" onSelect={() => handleSelect("__all__")}>
                <Check
                  className={cn(
                    "mr-2 h-3.5 w-3.5",
                    !hasValue ? "opacity-100 text-[#013764]" : "opacity-0",
                  )}
                />
                {allLabel}
              </CommandItem>

              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => handleSelect(opt.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      isChecked(opt.value)
                        ? "opacity-100 text-[#013764]"
                        : "opacity-0",
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        {isMulti && hasValue && (
          <div className="border-t border-[#E5E5E5] px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-[#717179]">{multiValue.length} selected</span>
            <button
              type="button"
              onClick={() => onChangeMulti?.([])}
              className="text-xs text-[#013764] hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
