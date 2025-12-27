import React, { useState, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  usePopoverContext,
} from "@/components/ui/popover";
import { FieldShell } from "./FieldShell";

export interface MultiSelectOption {
  id: string;
  label: string;
  initials?: string;
}

interface MultiSelectFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value: MultiSelectOption[];
  onChange: (value: MultiSelectOption[]) => void;
  disabled?: boolean;
  placeholder?: string;
  options: MultiSelectOption[];
}

/**
 * MultiSelectField - Multi-select dropdown field with FieldShell wrapper
 *
 * Uses Popover primitive with type-ahead search
 */
export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  required = false,
  description,
  error,
  id,
  disabled = false,
  value,
  onChange,
  placeholder = "Select options",
  options,
}) => {
  const [open, setOpen] = useState(false);
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

  // Deduplicate value array to prevent duplicate key warnings
  const uniqueValue = Array.from(
    new Map(value.map((item) => [item.id, item])).values()
  );

  const toggleItem = (item: MultiSelectOption) => {
    const isSelected = value.some((v) => v.id === item.id);
    if (isSelected) {
      onChange(value.filter((v) => v.id !== item.id));
    } else {
      onChange([...value, item]);
    }
  };

  const removeItem = (itemId: string) => {
    onChange(value.filter((v) => v.id !== itemId));
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
        <MultiSelectFieldContent
          open={open}
          setOpen={setOpen}
          fieldId={fieldId}
          disabled={disabled}
          placeholder={placeholder}
          uniqueValue={uniqueValue}
          removeItem={removeItem}
          options={options}
          toggleItem={toggleItem}
        />
      </Popover>
    </FieldShell>
  );
};

interface MultiSelectFieldContentProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  fieldId: string;
  disabled: boolean;
  placeholder: string;
  uniqueValue: MultiSelectOption[];
  removeItem: (itemId: string) => void;
  options: MultiSelectOption[];
  toggleItem: (item: MultiSelectOption) => void;
}

const MultiSelectFieldContent: React.FC<MultiSelectFieldContentProps> = ({
  open,
  setOpen,
  fieldId,
  disabled,
  placeholder,
  uniqueValue,
  removeItem,
  options,
  toggleItem,
}) => {
  const popoverContext = usePopoverContext();

  // Register options with Popover for typeahead search
  useEffect(() => {
    if (open) {
      popoverContext.setSearchableItems(
        options.map((opt) => ({ value: opt.id, label: opt.label }))
      );
    }
  }, [open, options, popoverContext]);

  return (
    <>
      <PopoverTrigger asChild>
        <button
          id={fieldId}
          disabled={disabled}
          type="button"
          style={{
            borderColor: "#ef4444" ? "#ef4444" : "var(--color-border-light)",
            borderWidth: "#ef4444" ? "2px" : "1px",
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
            border: "solid",
            opacity: disabled ? 0.6 : 1,
            justifyContent: "space-between",
          }}
        >
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {uniqueValue.length === 0 ? (
              <span
                style={{
                  color: "var(--color-text-placeholder)",
                  fontSize: "14px",
                }}
              >
                {placeholder}
              </span>
            ) : (
              uniqueValue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-1 bg-white rounded-full border border-[#2463EB] px-2 py-0.5 whitespace-nowrap"
                >
                  {item.initials && (
                    <div className="flex w-[18px] h-[18px] justify-center items-center rounded-full bg-[#2463EB]">
                      <span className="text-white font-semibold text-[8px]">
                        {item.initials}
                      </span>
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {item.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    className="hover:opacity-70 transition-opacity"
                    tabIndex={-1}
                  >
                    <X className="w-3 h-3 text-[#2463EB]" />
                  </button>
                </div>
              ))
            )}
          </div>
          <ChevronDown
            className="h-4 w-4 flex-shrink-0"
            style={{ color: "#303030" }}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-0"
        style={{
          minWidth: "200px",
        }}
      >
        <div
          style={{
            maxHeight: "280px",
            overflowY: "auto",
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
              const isSelected = uniqueValue.some((v) => v.id === option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleItem(option)}
                  type="button"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
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
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "rgba(36, 99, 235, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = isSelected
                      ? "rgba(36, 99, 235, 0.1)"
                      : "transparent";
                  }}
                >
                  {isSelected ? (
                    <Check className="h-4 w-4 text-blue-600" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  {option.initials && (
                    <div className="flex w-[24px] h-[24px] justify-center items-center rounded-full bg-[#2463EB]">
                      <span className="text-white font-semibold text-[10px]">
                        {option.initials}
                      </span>
                    </div>
                  )}
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

MultiSelectField.displayName = "MultiSelectField";
