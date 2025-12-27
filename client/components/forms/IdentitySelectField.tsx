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
  const [triggerWidth, setTriggerWidth] = useState(0);
  const [searchableItemsSet, setSearchableItemsSet] = useState(false);
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

  React.useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, []);

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

  // Note: We don't use usePopoverContext here because it would break the rules of hooks.
  // Instead, the Popover primitive itself handles type-ahead search internally when it's opened.

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

  const renderAvatar = (option: IdentityOption) => {
    if (option.avatar) {
      return (
        <img
          src={option.avatar}
          alt={option.label}
          className="w-6 h-6 rounded-full object-cover"
        />
      );
    }
    return (
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
          option.avatarColor || "bg-gray-400"
        }`}
      >
        {option.initials || option.label[0]}
      </div>
    );
  };

  const renderOption = (option: IdentityOption, isSelected: boolean) => {
    return (
      <div key={option.id} className="flex items-center gap-3 w-full">
        {isSelected && (
          <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
        )}
        {!isSelected && <div className="h-4 w-4 flex-shrink-0" />}

        {renderAvatar(option)}

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#303030] truncate">
            {option.label}
          </div>
          {option.subtitle && (
            <div className="text-xs text-[#717179] truncate">
              {option.subtitle}
            </div>
          )}
          {option.tags && option.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {option.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-[#f0f0f0] text-[#303030] px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
              {option.tags.length > 2 && (
                <span className="text-xs text-[#717179]">
                  +{option.tags.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
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
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            id={fieldId}
            disabled={disabled}
            style={{
              borderColor: error
                ? "#ef4444"
                : open
                  ? "#000000"
                  : "var(--color-border-light)",
              borderWidth: error ? "2px" : "1px",
              borderStyle: "solid",
              minHeight: "44px",
              height: "auto",
              borderRadius: "8px",
              backgroundColor: "white",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              width: "100%",
              cursor: disabled ? "not-allowed" : "pointer",
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "16px",
              opacity: disabled ? 0.6 : 1,
              justifyContent: "space-between",
            }}
          >
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {multiple && selectedOptions.length > 0 ? (
                selectedOptions.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-1.5 bg-white rounded-full border border-[#2463EB] px-2 py-1 whitespace-nowrap"
                  >
                    {renderAvatar(opt)}
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {opt.label}
                    </span>
                    <div
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(opt.id);
                      }}
                      className="hover:opacity-70 transition-opacity cursor-pointer"
                      tabIndex={-1}
                    >
                      <X className="w-3 h-3 text-[#2463EB]" />
                    </div>
                  </div>
                ))
              ) : (
                <span style={{ color: "#303030", fontSize: "14px" }}>
                  {displayLabel}
                </span>
              )}
            </div>
            <ChevronDown
              className="h-4 w-4 flex-shrink-0"
              style={{ color: "#303030" }}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          ref={contentRef}
          align="start"
          side="bottom"
          sideOffset={4}
          avoidCollisions={true}
          className="p-0"
          style={{
            backgroundColor: "white",
            border: "1px solid var(--color-border-light)",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            zIndex: 50,
            width: triggerWidth > 0 ? `${triggerWidth}px` : "auto",
            minWidth: "200px",
            maxWidth: triggerWidth > 0 ? `${triggerWidth}px` : "auto",
            padding: "0",
            maxHeight: "320px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "4px 0",
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
              popoverContext.filteredItems.map((item) => {
                const option = options.find((opt) => opt.id === item.value);
                if (!option) return null;
                const isSelected = multiple
                  ? selectedIds.includes(option.id)
                  : selectedId === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleItem(option.id)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      textAlign: "left",
                      backgroundColor: isSelected
                        ? "rgba(36, 99, 235, 0.1)"
                        : "transparent",
                      color: "var(--color-text-primary)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = isSelected
                        ? "rgba(36, 99, 235, 0.15)"
                        : "rgba(36, 99, 235, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = isSelected
                        ? "rgba(36, 99, 235, 0.1)"
                        : "transparent";
                    }}
                  >
                    {renderOption(option, isSelected)}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
};

IdentitySelectField.displayName = "IdentitySelectField";
