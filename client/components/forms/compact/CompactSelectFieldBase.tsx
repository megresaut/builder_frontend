import React, { useRef, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { usePopoverAutoClose } from "@/hooks/usePopoverAutoClose";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface CompactSelectFieldBaseProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  options: SelectOption[];
}

/**
 * CompactSelectFieldBase - Select field without FieldShell wrapper
 *
 * Raw select component with compact styling (32px height, 6px padding).
 * No label or field shell, ideal for custom layouts.
 *
 * @param value - Selected value
 * @param onChange - Change handler
 * @param disabled - Disable field
 * @param placeholder - Placeholder text
 * @param options - Array of options with value and label
 */
export const CompactSelectFieldBase = React.forwardRef<
  HTMLButtonElement,
  CompactSelectFieldBaseProps
>(({
  disabled = false,
  value,
  onChange,
  placeholder = "Select an option",
  options,
}, ref) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(ref ? null : null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = (ref as React.RefObject<HTMLButtonElement>) || triggerRef;

  usePopoverAutoClose({
    open,
    onOpenChange: setOpen,
    triggerRef: buttonRef as React.RefObject<HTMLElement>,
    contentRef: contentRef as React.RefObject<HTMLElement>,
  });

  useGlobalActionsScrollLock(open, {
    allowRefs: [
      buttonRef as React.RefObject<HTMLElement>,
      contentRef as React.RefObject<HTMLElement>,
    ],
  });

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={buttonRef}
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
            color: !selectedOption ? "var(--color-text-muted)" : "var(--color-text-primary)",
            backgroundColor: "rgba(255, 255, 255, 1)",
            border: "1px solid var(--color-border-light)",
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
            e.currentTarget.style.borderColor = "var(--color-border-light)";
          }}
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
      <PopoverContent
        ref={contentRef}
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
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange?.(option.value);
                setOpen(false);
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
                backgroundColor: value === option.value ? "rgba(0, 0, 0, 0.05)" : "transparent",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                outline: "none",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = value === option.value ? "rgba(0, 0, 0, 0.05)" : "transparent";
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
    </Popover>
  );
});

CompactSelectFieldBase.displayName = "CompactSelectFieldBase";

export { CompactSelectFieldBase };
