import { Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  usePopoverContext,
} from "@/components/ui/popover";
import { usePopoverAutoClose } from "@/hooks/usePopoverAutoClose";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";
import { FieldShell } from "./FieldShell";
import TaskStatusBadge from "@/components/TaskStatusBadge";
import { useEffect, useRef, useState } from "react";

interface StatusSelectFieldProps {
  label?: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export const StatusSelectField: React.FC<StatusSelectFieldProps> = ({
  label = "Status",
  required = false,
  description,
  error,
  id,
  disabled = false,
  value,
  onChange,
  placeholder = "Select Status",
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fieldId = id || "status-select-field";

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

  const selectedOption = STATUS_OPTIONS.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const isShowingPlaceholder = !value;

  const popoverContent = (
    <Popover open={open} onOpenChange={setOpen}>
      <StatusSelectFieldContent
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
        selectedOption={selectedOption}
      />
    </Popover>
  );

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

interface StatusSelectFieldContentProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  fieldId: string;
  disabled: boolean;
  error?: string;
  isShowingPlaceholder: boolean;
  displayLabel: string;
  value?: string;
  onChange?: (value: string) => void;
  selectedOption?: { value: string; label: string };
}

const StatusSelectFieldContent: React.FC<StatusSelectFieldContentProps> = ({
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
  selectedOption,
}) => {
  const popoverContext = usePopoverContext();
  const { highlightedIndex } = popoverContext;
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      popoverContext.setSearchableItems(
        STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
      );
      popoverContext.setHighlightedIndex(0);
    }
  }, [open, popoverContext]);

  useEffect(() => {
    if (open && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.focus();
    }
  }, [highlightedIndex, open]);

  useEffect(() => {
    if (open && popoverContext.onEnterSelect) {
      popoverContext.onEnterSelect((item) => {
        if (item) {
          onChange?.(item.value);
          setOpen(false);
        }
      });
    }
  }, [open, popoverContext, onChange, setOpen]);

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
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setOpen(false);
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
        aria-controls="status-select-listbox"
        className={`w-full rounded-lg bg-white text-sm font-normal transition-colors flex items-center justify-between cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 px-3 py-2 ${
          error
            ? "border-2 border-red-500"
            : open
              ? "border-2 border-black"
              : "border border-[var(--color-border-light)]"
        }`}
        style={{
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          lineHeight: 1.43,
          minHeight: "44px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: open ? "7px 11px" : "8px 12px",
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <div className="flex items-center gap-2 flex-1">
          {selectedOption ? (
            <TaskStatusBadge status={selectedOption.label as any} />
          ) : (
            <span style={{ color: "#303030", fontSize: "14px" }}>
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
          id="status-select-listbox"
          role="listbox"
          aria-label="Status"
          style={{
            padding: "4px 0",
            maxHeight: "300px",
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
          }}
        >
          {popoverContext.filteredItems.map((item, index) => {
            const isSelected = value === item.value;
            return (
              <button
                key={item.value}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                onClick={() => handleOptionSelect(item.value)}
                onKeyDown={(e) => handleOptionKeyDown(e, index)}
                role="option"
                aria-selected={isSelected}
                type="button"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  textAlign: "left",
                  backgroundColor: highlightedIndex === index
                      ? "rgba(36, 99, 235, 0.08)"
                      : "transparent",
                  color: "var(--color-text-primary)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={() => {
                  popoverContext.setHighlightedIndex(index);
                }}
              >
                {isSelected ? (
                  <Check className="h-4 w-4 text-blue-600" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <TaskStatusBadge status={item.label as any} />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </>
  );
};

StatusSelectField.displayName = "StatusSelectField";
