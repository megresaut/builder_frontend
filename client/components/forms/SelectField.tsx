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
  label: string;
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
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

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
        <SelectFieldContent
          open={open}
          setOpen={setOpen}
          highlightedIndex={highlightedIndex}
          setHighlightedIndex={setHighlightedIndex}
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
        />
      </Popover>
    </FieldShell>
  );
};

interface SelectFieldContentProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
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
}

const SelectFieldContent: React.FC<SelectFieldContentProps> = ({
  open,
  setOpen,
  highlightedIndex,
  setHighlightedIndex,
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
}) => {
  const popoverContext = usePopoverContext();

  // Register options with Popover for typeahead search
  useEffect(() => {
    if (open) {
      popoverContext.setSearchableItems(
        options.map((opt) => ({ value: opt.value, label: opt.label }))
      );
    }
  }, [open, options, popoverContext]);

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
  }, [open, popoverContext, options, multiple, selectedValues, onChange, setOpen]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex(0);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) =>
            prev < popoverContext.filteredItems.length - 1 ? prev + 1 : prev,
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
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
        setHighlightedIndex((prev) =>
          prev < popoverContext.filteredItems.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
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
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal transition-colors flex items-center justify-between cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
          error
            ? "border-red-600"
            : open
              ? "border-black"
              : "border-[var(--color-border-light)]"
        }`}
        style={{
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          lineHeight: 1.43,
          minHeight: "44px",
          height: "auto",
          display: "flex",
          alignItems: "center",
          flexWrap: multiple ? "wrap" : "nowrap",
          gap: multiple ? "6px" : "8px",
          padding: multiple && selectedValues.length > 0 ? "8px 12px" : "8px 12px",
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
              return (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  onKeyDown={(e) => handleOptionKeyDown(e, index)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    backgroundColor: isSelected
                      ? "rgba(36, 99, 235, 0.15)"
                      : highlightedIndex === index
                        ? "rgba(36, 99, 235, 0.08)"
                        : "transparent",
                    color: "var(--color-text-primary)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  {!isSelected && <div className="h-4 w-4" />}
                  {option.label}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </>
  );
};

SelectField.displayName = "SelectField";
