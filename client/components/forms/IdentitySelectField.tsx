import React, { useState, useMemo } from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  usePopoverContext,
} from "@/components/ui/popover";
import { usePopoverAutoClose } from "@/hooks/usePopoverAutoClose";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";
import { FieldShell } from "./FieldShell";
import { useEffect } from "react";

export interface IdentityOption {
  id: string;
  label: string;
  subtitle?: string;
  initials?: string;
  avatarColor?: string;
  badgeColor?: string;
  tags?: string[];
  avatar?: string;
}

interface IdentitySelectFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  options: IdentityOption[];
  multiple?: boolean;
}

/**
 * IdentitySelectField - Multi/single select with rich option rendering
 *
 * Used for entity pickers like Vendor, Property, GL Account.
 * Displays initials, colors, subtitles, and tags for each option.
 * Supports both single and multi-select modes.
 *
 * Features:
 * - Avatar with initials or image
 * - Subtitle text (address, email, etc)
 * - Tag badges
 * - Color-coded avatars
 * - Truncation for long names
 * - Multi-select with chip display
 * - Keyboard navigation
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute
 * @param value - Selected value(s)
 * @param onChange - Change handler
 * @param disabled - Disable field
 * @param placeholder - Placeholder text
 * @param options - Rich option objects with avatars, subtitles, tags
 * @param multiple - Enable multi-select (default: false)
 *
 * Example:
 * ```tsx
 * <IdentitySelectField
 *   label="Select Vendor"
 *   required
 *   value={vendorId}
 *   onChange={setVendorId}
 *   placeholder="Search vendors..."
 *   options={[
 *     {
 *       id: "v1",
 *       label: "Dolce Heating & Plumbing",
 *       subtitle: "heating@dolce.com",
 *       initials: "DH",
 *       avatarColor: "bg-blue-500",
 *       tags: ["HVAC", "Plumbing"]
 *     },
 *   ]}
 * />
 * ```
 */
export const IdentitySelectField: React.FC<IdentitySelectFieldProps> = ({
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
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
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

  const selectedIds = multiple ? (Array.isArray(value) ? value : []) : [];
  const selectedId = !multiple ? (typeof value === "string" ? value : "") : "";
  const selectedOptions = options.filter(
    multiple
      ? (opt) => selectedIds.includes(opt.id)
      : (opt) => opt.id === selectedId,
  );

  const displayLabel =
    multiple && selectedOptions.length > 0
      ? `${selectedOptions.length} selected`
      : selectedOptions.length > 0
        ? selectedOptions[0].label
        : placeholder;

  const toggleItem = (optionId: string) => {
    if (multiple) {
      const newIds = selectedIds.includes(optionId)
        ? selectedIds.filter((id) => id !== optionId)
        : [...selectedIds, optionId];
      onChange(newIds);
    } else {
      onChange(optionId);
      setOpen(false);
    }
  };

  const removeItem = (optionId: string) => {
    if (multiple) {
      const newIds = selectedIds.filter((id) => id !== optionId);
      onChange(newIds);
    }
  };

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
        <IdentitySelectFieldContent
          open={open}
          setOpen={setOpen}
          error={error}
          disabled={disabled}
          fieldId={fieldId}
          triggerRef={triggerRef}
          contentRef={contentRef}
          displayLabel={displayLabel}
          selectedIds={selectedIds}
          selectedId={selectedId}
          selectedOptions={selectedOptions}
          options={options}
          multiple={multiple}
          placeholder={placeholder}
          toggleItem={toggleItem}
          removeItem={removeItem}
        />
      </Popover>
    </FieldShell>
  );
};

IdentitySelectField.displayName = "IdentitySelectField";
