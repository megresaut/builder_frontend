import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { usePopoverAutoClose } from "@/hooks/usePopoverAutoClose";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";
import { FieldCellShell } from "./FieldCellShell";
import { Check, Loader2 } from "lucide-react";

interface VendorFieldCellProps {
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  placeholder?: string;
  /** When provided, options are server-driven: search is debounced and passed here, no client-side filter */
  onSearchChange?: (search: string) => void;
  /** Called when the dropdown opens or closes (e.g. to fetch initial vendors) */
  onOpenChange?: (open: boolean) => void;
  /** Called when user scrolls near bottom (for pagination) */
  onLoadMore?: () => void;
  optionsLoading?: boolean;
  hasMore?: boolean;
}

/**
 * VendorFieldCell - Combobox with custom input for vendor selection in table cells
 *
 * Allows selecting from predefined vendors or typing a custom vendor name.
 */
const SEARCH_DEBOUNCE_MS = 250;

export const VendorFieldCell: React.FC<VendorFieldCellProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  error = false,
  id,
  placeholder = "Select or type vendor...",
  onSearchChange,
  onOpenChange,
  onLoadMore,
  optionsLoading = false,
  hasMore = false,
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAsyncMode = typeof onSearchChange === "function";

  // Sync inputValue when value prop changes externally
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Notify parent when open state changes (e.g. to fetch initial vendors)
  const setOpenWithNotify = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  usePopoverAutoClose({
    open,
    onOpenChange: setOpenWithNotify,
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    contentRef: contentRef as React.RefObject<HTMLElement>,
  });

  useGlobalActionsScrollLock(open, {
    allowRefs: [
      triggerRef as React.RefObject<HTMLElement>,
      contentRef as React.RefObject<HTMLElement>,
    ],
  });

  // Focus and select search input when dropdown opens so user can immediately type
  useEffect(() => {
    if (open && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Debounced server search when in async mode (only while dropdown is open)
  useEffect(() => {
    if (!isAsyncMode || !open) return;
    searchDebounceRef.current = window.setTimeout(() => {
      onSearchChange?.(inputValue ?? "");
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, [open, inputValue, isAsyncMode, onSearchChange]);

  // Options: server-filtered in async mode, client-filtered otherwise
  const filteredOptions = isAsyncMode
    ? options
    : options.filter((opt) =>
        opt?.label && typeof opt.label === "string"
          ? opt.label.toLowerCase().includes((inputValue || "").toLowerCase())
          : false,
      );

  const selectedOption = options.find((opt) => opt?.value === value);
  const displayLabel = selectedOption?.label || inputValue || placeholder || '';

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setInputValue(optionValue);
    setOpen(false);
  };

  const handleCustomInput = (customValue: string) => {
    onChange?.(customValue);
    setInputValue(customValue);
    setOpen(false);
  };

  const handleListScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!onLoadMore || optionsLoading || !hasMore) return;
      const target = e.currentTarget;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
        onLoadMore();
      }
    },
    [onLoadMore, optionsLoading, hasMore],
  );

  return (
    <FieldCellShell error={error}>
      <Popover open={open} onOpenChange={setOpenWithNotify}>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            disabled={disabled}
            className="flex items-center justify-between gap-2 w-full h-9 px-3 rounded-md border border-0 text-sm bg-white text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            style={{
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            }}
            type="button"
          >
            <span
              style={{
                color:
                  value || inputValue
                    ? "var(--color-text-primary)"
                    : "#A1A1A9",
                fontSize: "13px",
                flex: 1,
                textAlign: "left",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayLabel}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          ref={contentRef}
          className="rounded-lg border border-[var(--color-border-light)] bg-white shadow-md"
          align="start"
          syncTriggerWidth={false}
          maxHeight={280}
          style={{ width: "max-content" }}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            requestAnimationFrame(() => {
              searchInputRef.current?.focus();
              searchInputRef.current?.select();
            });
          }}
        >
          <div
            ref={listScrollRef}
            onScroll={handleListScroll}
            style={{
              padding: "8px 0",
              overflowY: "auto",
              overflowX: "hidden",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              maxHeight: 260,
            }}
          >
            {/* Custom input field */}
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #E5E7EB" }}>
              <input
                ref={searchInputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={() => {
                  // Commit the typed value when the input loses focus
                  if (inputValue && inputValue !== value) {
                    onChange?.(inputValue);
                  }
                }}
                placeholder={placeholder}
                className="w-full px-2 py-1 border border-[#DADADA] rounded text-[13px] outline-none"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              />
            </div>

            {/* Loading state when no options yet */}
            {optionsLoading && filteredOptions.length === 0 && (
              <div
                style={{
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--color-text-secondary, #6b7280)",
                  fontSize: "13px",
                }}
              >
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                Loading vendors...
              </div>
            )}

            {/* Options list */}
            {filteredOptions.length > 0 && (
              <div>
                {filteredOptions.map((option) => {
                  const isSelected = value === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        textAlign: "left",
                        backgroundColor: isSelected
                          ? "rgba(36, 99, 235, 0.15)"
                          : "transparent",
                        color: "var(--color-text-primary)",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontFamily:
                          "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "background-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "rgba(36, 99, 235, 0.08)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          isSelected ? "rgba(36, 99, 235, 0.15)" : "transparent";
                      }}
                      type="button"
                    >
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                      {!isSelected && <div className="h-4 w-4 flex-shrink-0" />}
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Load more indicator at bottom */}
            {optionsLoading && filteredOptions.length > 0 && (
              <div
                style={{
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--color-text-secondary, #6b7280)",
                  fontSize: "12px",
                }}
              >
                <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                Loading more...
              </div>
            )}
            {!optionsLoading && hasMore && filteredOptions.length > 0 && (
              <div
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  color: "var(--color-text-secondary, #6b7280)",
                }}
              >
                Scroll for more
              </div>
            )}

            {/* Empty state (no loading, no options) */}
            {!optionsLoading && filteredOptions.length === 0 && (
              <div
                style={{
                  padding: "12px",
                  fontSize: "13px",
                  color: "var(--color-text-secondary, #6b7280)",
                }}
              >
                {isAsyncMode ? "No vendors found. Type to search or add custom." : "No matching vendors."}
              </div>
            )}

            {/* Custom vendor input option */}
            {inputValue && !filteredOptions.find((o) => o.value === inputValue) && (
              <button
                onClick={() => handleCustomInput(inputValue)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  textAlign: "left",
                  backgroundColor: "rgba(36, 99, 235, 0.08)",
                  color: "var(--color-text-primary)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontStyle: "italic",
                }}
                type="button"
              >
                Add "{inputValue}" as vendor
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </FieldCellShell>
  );
};

VendorFieldCell.displayName = "VendorFieldCell";
