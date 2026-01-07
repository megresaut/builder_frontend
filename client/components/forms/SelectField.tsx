import { Check, ChevronDown, X } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  usePopoverContext,
} from "@/components/ui/popover";
import { usePopoverAutoClose } from "@/hooks/usePopoverAutoClose";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";
import { cn } from "@/lib/utils";
import { FieldShell } from "./FieldShell";
import { useEffect, useRef, useState } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  options: SelectOption[];
  multiple?: boolean;
  onCreateNew?: () => void;
  createNewLabel?: string;
  compact?: boolean;
}

/**
 * SelectField - Select dropdown field with FieldShell wrapper
 *
 * Uses Popover primitive with type-ahead search
 *
 * Keyboard Interactions:
 * - Enter/Space: Open dropdown (when closed) or select highlighted option
 * - ArrowDown: Navigate to next option (opens dropdown if closed)
 * - ArrowUp: Navigate to previous option
 * - Escape: Close dropdown
 * - Type character(s): Search options by label (auto-filters)
 *
 * @param compact - When true, renders without FieldShell wrapper (32px height, 6px padding) for inline editing
 */

/**
 * SelectField - Select dropdown field with FieldShell wrapper
 *
 * Uses Popover primitive with type-ahead search
 *
 * Keyboard Interactions:
 * - Enter/Space: Open dropdown (when closed) or select highlighted option
 * - ArrowDown: Navigate to next option (opens dropdown if closed)
 * - ArrowUp: Navigate to previous option
 * - Escape: Close dropdown
 * - Type character(s): Search options by label (auto-filters)
 */
export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  required = false,
  description,
  error,
  id,
  disabled = false,
  value,
  onChange,
  placeholder = "Select an option",
  options,
  multiple = false,
  onCreateNew,
  createNewLabel = "Create New",
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fieldId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : "select-field");

  usePopoverAutoClose({
    open,
    onOpenChange: setOpen,
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    contentRef: contentRef as React.RefObject<HTMLElement>,
  });

  useGlobalActionsScrollLock(open, {
    allowRefs: [
      triggerRef as React.RefObject<HTMLElement>,
      contentRef as React.RefObject<HTMLElement>,
    ],
  });

  const isMultiple = multiple;
  const selectedValues = isMultiple ? (Array.isArray(value) ? value : []) : [];
  const selectedValue = !isMultiple
    ? typeof value === "string"
      ? value
      : ""
    : "";

  const selectedOptions = isMultiple
    ? options.filter((opt) => selectedValues.includes(opt.value))
    : selectedValue
      ? [options.find((opt) => opt.value === selectedValue)].filter(Boolean)
      : [];

  const displayLabel = isMultiple
    ? selectedValues.length === 0
      ? placeholder
      : undefined
    : (selectedOptions[0]?.label ?? placeholder);

  const isShowingPlaceholder = isMultiple
    ? selectedValues.length === 0
    : !selectedValue;

  const popoverContent = (
    <Popover open={open} onOpenChange={setOpen}>
      <SelectFieldContent
        label={label || ""}
        open={open}
        setOpen={setOpen}
        triggerRef={triggerRef}
        contentRef={contentRef}
        fieldId={fieldId}
        disabled={disabled}
        error={error}
        isShowingPlaceholder={isShowingPlaceholder}
        displayLabel={displayLabel}
        value={value}
        onChange={onChange}
        options={options}
        selectedValues={selectedValues}
        selectedValue={selectedValue}
        selectedOptions={selectedOptions}
        multiple={isMultiple}
        onCreateNew={onCreateNew}
        createNewLabel={createNewLabel}
        compact={compact}
      />
    </Popover>
  );

  if (compact) {
    return popoverContent;
  }

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={error}
      disabled={disabled}
      htmlFor={fieldId}
    >
      {popoverContent}
    </FieldShell>
  );
};

interface SelectFieldContentProps {
  label?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  fieldId: string;
  disabled: boolean;
  error?: string;
  isShowingPlaceholder: boolean;
  displayLabel: string | undefined;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  options: SelectOption[];
  selectedValues: string[];
  selectedValue: string;
  selectedOptions: SelectOption[];
  multiple: boolean;
  onCreateNew?: () => void;
  createNewLabel?: string;
  compact?: boolean;
}

const SelectFieldContent: React.FC<SelectFieldContentProps> = ({
  label,
  open,
  setOpen,
  triggerRef,
  contentRef,
  fieldId,
  disabled,
  error,
  isShowingPlaceholder,
  displayLabel,
  value,
  onChange,
  options,
  selectedValues,
  selectedValue,
  selectedOptions,
  multiple,
  onCreateNew,
  createNewLabel = "Create New",
  compact = false,
}) => {
  const popoverContext = usePopoverContext();
  const { highlightedIndex } = popoverContext;
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Register options with Popover for typeahead search and highlight first option
  useEffect(() => {
    if (open) {
      popoverContext.setSearchableItems(
        options.map((opt) => ({ value: opt.value, label: opt.label })),
      );
      // Highlight first option when dropdown opens
      popoverContext.setHighlightedIndex(0);
    }
  }, [open, options, popoverContext.setSearchableItems, popoverContext.setHighlightedIndex]);

  // Sync DOM focus with visual highlight when arrow keys navigate
  useEffect(() => {
    if (open && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.focus();
    }
  }, [highlightedIndex, open]);

  // Set up Enter key handler for selecting from type-ahead results
  useEffect(() => {
    if (open && popoverContext.onEnterSelect) {
      popoverContext.onEnterSelect((item) => {
        if (item) {
          const option = options.find((opt) => opt.value === item.value);
          if (option) {
            if (multiple) {
              const newValues = selectedValues.includes(option.value)
                ? selectedValues.filter((v) => v !== option.value)
                : [...selectedValues, option.value];
              onChange?.(newValues);
            } else {
              onChange?.(option.value);
              setOpen(false);
            }
          }
        }
      });
    }
  }, [
    open,
    popoverContext,
    options,
    multiple,
    selectedValues,
    onChange,
    setOpen,
  ]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        if (!open) {
          e.preventDefault();
          setOpen(true);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "ArrowDown":
      case "ArrowUp":
        if (!open) {
          e.preventDefault();
          setOpen(true);
        }
        break;
      default:
        break;
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange?.(newValues);
    } else {
      onChange?.(optionValue);
      setOpen(false);
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (popoverContext.filteredItems[index]) {
          handleOptionSelect(popoverContext.filteredItems[index].value);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        popoverContext.setHighlightedIndex((prev) =>
          prev < popoverContext.filteredItems.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        popoverContext.setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      default:
        break;
    }
  };

  const removeItem = (itemValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      const newValues = selectedValues.filter((v) => v !== itemValue);
      onChange?.(newValues);
    }
  };

  return (
    <>
      <PopoverTrigger
        ref={triggerRef}
        id={fieldId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="select-listbox"
        className={`w-full rounded-lg border bg-white text-sm font-normal transition-colors flex items-center justify-between cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
          compact ? "px-3 py-0" : "px-3 py-2"
        } ${
          error
            ? "border-red-600"
            : open
              ? "border-black"
              : "border-[var(--color-border-light)]"
        }`}
        style={{
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          lineHeight: 1.43,
          minHeight: compact ? "32px" : "44px",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: multiple ? "6px" : "8px",
          padding:
            compact && multiple && selectedValues.length > 0
              ? "2px 6px"
              : compact
                ? "4px 12px"
                : multiple && selectedValues.length > 0
                  ? "8px 12px"
                  : "8px 12px",
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {multiple && selectedValues.length > 0 ? (
            selectedOptions.map((opt) => (
              <div
                key={opt.value}
                className="flex items-center gap-1.5 bg-white rounded-full border border-[#2463EB] px-2 py-1 whitespace-nowrap"
                style={{
                  fontSize: "12px",
                }}
              >
                <span style={{ color: "var(--color-text-primary)" }}>
                  {opt.label}
                </span>
                <div
                  role="button"
                  onClick={(e) => removeItem(opt.value, e)}
                  className="hover:opacity-70 transition-opacity cursor-pointer"
                  tabIndex={-1}
                >
                  <X className="w-3 h-3 text-[#2463EB]" />
                </div>
              </div>
            ))
          ) : (
            <span
              style={{
                color: isShowingPlaceholder
                  ? "#303030"
                  : "var(--color-text-primary)",
                fontSize: "14px",
              }}
            >
              {displayLabel}
            </span>
          )}
        </div>
        <ChevronDown
          className="h-4 w-4 shrink-0 flex-none"
          style={{ color: "#303030" }}
        />
      </PopoverTrigger>

      <PopoverContent
        ref={contentRef}
        className="rounded-lg border border-[var(--color-border-light)] bg-white shadow-md"
        align="start"
        syncTriggerWidth={true}
      >
        <div
          id="select-listbox"
          role="listbox"
          aria-label={label}
          style={{
            padding: "4px 0",
            maxHeight: "300px",
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {popoverContext.filteredItems.length === 0 ? (
            <div
              style={{
                padding: "8px 12px",
                color: "var(--color-text-muted)",
                fontSize: "14px",
              }}
            >
              {popoverContext.filteredItems.length === 0 && options.length > 0
                ? "No matching options"
                : "No options"}
            </div>
          ) : (
            popoverContext.filteredItems.map((item, index) => {
              const option = options.find((opt) => opt.value === item.value);
              if (!option) return null;
              const isSelected = multiple
                ? selectedValues.includes(option.value)
                : selectedValue === option.value;
              const isHighlighted = highlightedIndex === index;
              return (
                <button
                  key={option.value}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  onClick={() => handleOptionSelect(option.value)}
                  onKeyDown={(e) => handleOptionKeyDown(e, index)}
                  data-selected={isSelected ? "true" : "false"}
                  data-highlighted={isHighlighted ? "true" : "false"}
                  role="option"
                  aria-selected={isSelected}
                  className="w-full px-3 py-2 text-left text-sm text-[var(--color-text-primary)] flex items-center gap-2"
                  type="button"
                  style={{
                    border: "none",
                    cursor: "pointer",
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                  onMouseEnter={() => popoverContext.setHighlightedIndex(index)}
                >
                  {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  {!isSelected && <div className="h-4 w-4" />}
                  {option.label}
                </button>
              );
            })
          )}
        </div>
        {onCreateNew && (
          <div
            style={{
              borderTop: "1px solid var(--color-border-light)",
              padding: "8px 0",
            }}
          >
            <button
              onClick={() => {
                onCreateNew();
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-[#2463EB] hover:bg-blue-50 transition-colors flex items-center gap-2"
              style={{
                border: "none",
                cursor: "pointer",
                fontFamily:
                  "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                fontWeight: "500",
              }}
            >
              <span>+ {createNewLabel}</span>
            </button>
          </div>
        )}
      </PopoverContent>
    </>
  );
};

SelectField.displayName = "SelectField";
