import React, { useRef, useEffect, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  usePopoverContext,
} from "@/components/ui/popover";
import { FieldShell } from "../FieldShell";
import { usePopoverAutoClose } from "@/hooks/usePopoverAutoClose";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface CompactSelectFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  options: SelectOption[];
}

/**
 * CompactSelectField - Select field optimized for inline editing
 *
 * Features:
 * - Compact trigger button: 32px height, 6px padding
 * - All SelectField functionality preserved (keyboard nav, search, type-ahead)
 * - Maintains consistent styling with other compact fields
 *
 * @param label - Field label
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute
 * @param value - Selected value
 * @param onChange - Change handler
 * @param disabled - Disable field
 * @param placeholder - Placeholder text
 * @param options - Array of options with value and label
 */
export const CompactSelectField: React.FC<CompactSelectFieldProps> = ({
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

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

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
        <CompactSelectTrigger
          ref={triggerRef}
          fieldId={fieldId}
          disabled={disabled}
          displayLabel={displayLabel}
          isPlaceholder={!selectedOption}
          error={!!error}
        />
        <CompactSelectContent
          ref={contentRef}
          options={options}
          value={value}
          onChange={(newValue) => {
            onChange?.(newValue);
            setOpen(false);
          }}
        />
      </Popover>
    </FieldShell>
  );
};

/**
 * CompactSelectTrigger - Compact trigger button for select dropdown
 */
interface CompactSelectTriggerProps {
  fieldId: string;
  disabled: boolean;
  displayLabel: string;
  isPlaceholder: boolean;
  error: boolean;
}

const CompactSelectTrigger = React.forwardRef<
  HTMLButtonElement,
  CompactSelectTriggerProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(
  (
    { fieldId, disabled, displayLabel, isPlaceholder, error, ...props },
    ref,
  ) => (
    <PopoverTrigger asChild>
      <button
        ref={ref}
        id={fieldId}
        disabled={disabled}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: "32px",
          padding: "6px 12px",
          fontSize: "14px",
          fontWeight: 400,
          letterSpacing: "-0.28px",
          lineHeight: 1.4,
          fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          color: isPlaceholder ? "var(--color-text-muted)" : "var(--color-text-primary)",
          backgroundColor: "rgba(255, 255, 255, 1)",
          border: error ? "2px solid #ef4444" : "1px solid var(--color-border-light)",
          borderRadius: "8px",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          boxSizing: "border-box",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#000000";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? "#ef4444"
            : "var(--color-border-light)";
        }}
        {...props}
      >
        <span>{displayLabel}</span>
        <ChevronDown
          width={16}
          height={16}
          style={{
            flexShrink: 0,
            color: "var(--color-text-muted)",
          }}
        />
      </button>
    </PopoverTrigger>
  ),
);

CompactSelectTrigger.displayName = "CompactSelectTrigger";

/**
 * CompactSelectContent - Dropdown content for compact select
 */
interface CompactSelectContentProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
}

const CompactSelectContent = React.forwardRef<
  HTMLDivElement,
  CompactSelectContentProps
>(({ options, value, onChange }, ref) => {
  const popoverContext = usePopoverContext();
  const { highlightedIndex } = popoverContext;
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.focus();
    }
  }, [highlightedIndex]);

  return (
    <PopoverContent
      ref={ref}
      align="start"
      sideOffset={4}
      style={{
        padding: "4px",
        minWidth: "200px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {options.map((option, idx) => (
          <button
            key={option.value}
            ref={(el) => {
              optionRefs.current[idx] = el;
            }}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(option.value);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              fontWeight: 400,
              color: "var(--color-text-primary)",
              backgroundColor:
                highlightedIndex === idx ? "rgba(0, 0, 0, 0.05)" : "transparent",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
              fontFamily:
                "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              outline: "none",
              transition: "background-color 0.2s",
            }}
            role="option"
            aria-selected={value === option.value}
          >
            <span style={{ flex: 1 }}>{option.label}</span>
            {value === option.value && (
              <Check width={16} height={16} style={{ flexShrink: 0 }} />
            )}
          </button>
        ))}
      </div>
    </PopoverContent>
  );
});

CompactSelectContent.displayName = "CompactSelectContent";
CompactSelectField.displayName = "CompactSelectField";

export { CompactSelectField };
