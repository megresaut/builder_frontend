import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useVendorSearch } from "@/hooks/useVendorSearch";

/**
 * VendorPicker — the single vendor <select> replacement for forms.
 *
 * Owns its own data: searches server-side (`GET /vendors?search=`) and pages in
 * 50 at a time on scroll, so all ~2.5k active vendors are reachable. Pickers
 * that fetch a fixed page of vendors up front and filter client-side silently
 * hide everyone past the cut-off, which is the bug this component exists to
 * avoid — do not replace it with a plain options array.
 *
 * `value` / `onChange` speak vendor id ("" = nothing selected).
 */

interface VendorPickerProps {
  value: number | "";
  /** `name` is passed through for callers that persist a denormalised vendor name. */
  onChange: (vendorId: number | "", name: string) => void;
  /** Label shown when nothing is selected. */
  placeholder?: string;
  /**
   * Known name for `value`, used as the trigger label until the picker resolves
   * it itself (avoids a flash of "Vendor #123" on forms that already have it).
   */
  valueLabel?: string;
  /** Show a clear (✕) affordance when a vendor is selected. Default: true. */
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  /**
   * Fixed popover width in px. Defaults to matching the trigger — set this when
   * the trigger is too narrow to read vendor names (e.g. a table cell).
   */
  contentWidth?: number;
}

export function VendorPicker({
  value,
  onChange,
  placeholder = "Select a vendor…",
  valueLabel,
  clearable = true,
  disabled = false,
  id,
  className,
  contentWidth,
}: VendorPickerProps) {
  const [open, setOpen] = React.useState(false);
  // Don't hit the API until the field is actually used once.
  const [activated, setActivated] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  const { vendors, search, setSearch, loading, hasMore, loadMore, nameById, ensureVendor } =
    useVendorSearch(activated);

  // Resolve the label for a pre-selected vendor that isn't in the loaded page.
  React.useEffect(() => {
    if (value === "" || valueLabel || nameById[value]) return;
    ensureVendor(value);
  }, [value, valueLabel, nameById, ensureVendor]);

  const hasValue = value !== "";
  const triggerLabel = hasValue
    ? nameById[value] ?? valueLabel ?? `Vendor #${value}`
    : placeholder;

  const handleOpenChange = (next: boolean) => {
    if (disabled) return;
    setOpen(next);
    if (next) setActivated(true);
    else setSearch("");
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) loadMore();
  };

  // A fresh search resets the list, so put the user back at the top.
  React.useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [search]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            "flex w-full items-center justify-between gap-1.5 border border-[#E5E5E5] rounded-md px-2.5 py-1.5 text-sm bg-white text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764] disabled:opacity-50 disabled:cursor-not-allowed text-left",
            className,
          )}
        >
          <span className={cn("truncate", !hasValue && "text-[#717179]")}>{triggerLabel}</span>
          <span className="flex items-center gap-0.5 shrink-0">
            {hasValue && clearable && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear vendor"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("", "");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onChange("", "");
                  }
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
        scrollable={false}
        maxHeight={340}
        syncTriggerWidth={!contentWidth}
        style={contentWidth ? { width: `${contentWidth}px` } : undefined}
      >
        <div className="p-2 border-b border-[#F0F0F0]">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to search all vendors…"
            className="w-full rounded-md border border-[#E5E5E5] px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
          />
        </div>

        <div ref={listRef} className="max-h-[240px] overflow-y-auto py-1" onScroll={handleScroll}>
          {vendors.length === 0 && loading && (
            <div className="px-3 py-2 text-sm text-[#A1A1A1]">Loading vendors…</div>
          )}
          {vendors.length === 0 && !loading && (
            <div className="px-3 py-2 text-sm text-[#A1A1A1]">No vendors found.</div>
          )}

          {vendors.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                onChange(v.id, v.name);
                setOpen(false);
                setSearch("");
              }}
              className={cn(
                "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm text-[#303030] hover:bg-[#F5F7FA]",
                value === v.id && "bg-[#F0F4F8]",
              )}
            >
              <Check
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  value === v.id ? "opacity-100 text-[#013764]" : "opacity-0",
                )}
              />
              <span className="truncate">{v.name}</span>
            </button>
          ))}

          {vendors.length > 0 && loading && (
            <div className="px-3 py-2 text-xs text-[#A1A1A1]">Loading more…</div>
          )}
          {vendors.length > 0 && !loading && hasMore && (
            <div className="px-3 py-2 text-xs text-[#A1A1A1]">Scroll for more…</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
