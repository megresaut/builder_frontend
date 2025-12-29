import { Check } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  usePopoverContext,
} from "@/components/ui/popover";
import { usePopoverAutoClose } from "@/hooks/usePopoverAutoClose";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";
import { FieldCellShell } from "./FieldCellShell";
import { useEffect, useRef, useState } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldCellProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  id?: string;
}

/**
 * SelectFieldCell - Select dropdown for table cells with type-ahead search
 */
export const SelectFieldCell: React.FC<SelectFieldCellProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  error = false,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fieldId = id || "select-cell";

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

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const isShowingPlaceholder = !value;

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setHighlightedIndex(0);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setHighlightedIndex(0);
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

  return (
    <FieldCellShell error={error}>
      <Popover open={open} onOpenChange={setOpen}>
        <SelectFieldCellContent
          open={open}
          setOpen={setOpen}
          fieldId={fieldId}
          disabled={disabled}
          displayLabel={displayLabel}
          isShowingPlaceholder={isShowingPlaceholder}
          triggerRef={triggerRef}
          value={value}
          options={options}
          placeholder={placeholder}
          onChange={onChange}
          contentRef={contentRef}
          handleTriggerKeyDown={handleTriggerKeyDown}
        />
      </Popover>
    </FieldCellShell>
  );
};

interface SelectFieldCellContentProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  fieldId: string;
  disabled: boolean;
  displayLabel: string;
  isShowingPlaceholder: boolean;
  triggerRef: React.RefObject<HTMLButtonElement>;
  value?: string;
  options: SelectOption[];
  placeholder: string;
  onChange?: (value: string) => void;
  contentRef: React.RefObject<HTMLDivElement>;
  handleTriggerKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
}

const SelectFieldCellContent: React.FC<SelectFieldCellContentProps> = ({
  open,
  setOpen,
  fieldId,
  disabled,
  displayLabel,
  isShowingPlaceholder,
  triggerRef,
  value,
  options,
  placeholder,
  onChange,
  contentRef,
  handleTriggerKeyDown,
}) => {
  const popoverContext = usePopoverContext();
  const { highlightedIndex } = popoverContext;

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
            onChange?.(option.value);
            setOpen(false);
          }
        }
      });
    }
  }, [open, popoverContext, options, onChange, setOpen]);

  const handleOptionSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setOpen(false);
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, optionIndex: number) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        handleOptionSelect(popoverContext.filteredItems[optionIndex].value);
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
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <PopoverTrigger
        ref={triggerRef}
        id={fieldId}
        disabled={disabled}
        className="flex items-center justify-between gap-2 w-full h-9 px-3 rounded-md border border-0 text-sm bg-white text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        style={{
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
        }}
        onKeyDown={handleTriggerKeyDown}
        type="button"
      >
        <span
          style={{
            color: isShowingPlaceholder ? "#A1A1A9" : "var(--color-text-primary)",
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
      </PopoverTrigger>

      <PopoverContent
        ref={contentRef}
        className="rounded-lg border border-[var(--color-border-light)] bg-white shadow-md"
        align="start"
        syncTriggerWidth={false}
        maxHeight={280}
        style={{ width: "max-content" }}
      >
        <div
          style={{
            padding: "4px 0",
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
                fontSize: "13px",
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
              const isSelected = value === option.value;
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
                    fontSize: "13px",
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={() => {
                    popoverContext.setHighlightedIndex(index);
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
            })
          )}
        </div>
      </PopoverContent>
    </>
  );
};

SelectFieldCell.displayName = "SelectFieldCell";
