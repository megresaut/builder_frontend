import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useVendorSearch, type VendorOption } from "@/hooks/useVendorSearch";

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
  // Keyboard-highlighted row. Focus stays in the search box (so typing keeps
  // working), so the highlight is tracked here and announced via
  // aria-activedescendant rather than by moving DOM focus. -1 = nothing armed,
  // which keeps a stray Enter right after opening from picking a vendor.
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const listboxId = React.useId();
  const optionId = (i: number) => `${listboxId}-opt-${i}`;

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
    setActiveIndex(-1);
    if (next) setActivated(true);
    else setSearch("");
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) loadMore();
  };

  const select = (v: VendorOption) => {
    onChange(v.id, v.name);
    setOpen(false);
    setActiveIndex(-1);
    setSearch("");
  };

  // A fresh search resets the list, so put the user back at the top. Typing is a
  // statement of intent, so arm the top hit — Enter then takes it, no arrowing.
  React.useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
    setActiveIndex(search ? 0 : -1);
  }, [search]);

  // Keep the highlighted row visible. Scrolling the container also re-triggers
  // handleScroll, so arrowing to the bottom pages the next 50 in on its own.
  React.useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  // Clamped so a shrinking result set (or a stale index) can't strand the
  // highlight past the end of the list.
  const moveActive = (delta: number) => {
    if (vendors.length === 0) return;
    setActiveIndex((i) => {
      const next = i < 0 ? (delta > 0 ? 0 : vendors.length - 1) : i + delta;
      return Math.max(0, Math.min(vendors.length - 1, next));
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault(); // don't let the caret jump to the end of the term
        moveActive(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        if (vendors.length === 0) return;
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        if (vendors.length === 0) return;
        e.preventDefault();
        setActiveIndex(vendors.length - 1);
        break;
      case "Enter": {
        const v = vendors[activeIndex];
        if (!v) return;
        e.preventDefault();
        select(v);
        break;
      }
    }
  };

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
            role="combobox"
            aria-expanded
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Type to search all vendors…"
            className="w-full rounded-md border border-[#E5E5E5] px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
          />
        </div>

        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="max-h-[240px] overflow-y-auto py-1"
          onScroll={handleScroll}
        >
          {vendors.length === 0 && loading && (
            <div className="px-3 py-2 text-sm text-[#A1A1A1]">Loading vendors…</div>
          )}
          {vendors.length === 0 && !loading && (
            <div className="px-3 py-2 text-sm text-[#A1A1A1]">No vendors found.</div>
          )}

          {vendors.map((v, i) => (
            <button
              key={v.id}
              id={optionId(i)}
              data-index={i}
              role="option"
              aria-selected={value === v.id}
              // Focus never leaves the search box, so options stay out of the tab
              // order; arrows move the highlight instead.
              tabIndex={-1}
              type="button"
              onClick={() => select(v)}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm text-[#303030] hover:bg-[#F5F7FA]",
                value === v.id && "bg-[#F0F4F8]",
                i === activeIndex && "bg-[#E9F0F7]",
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
