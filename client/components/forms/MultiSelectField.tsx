import React, { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
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
 * MultiSelectField – stable, crash-free multiselect
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

  // Deduplicate selected values
  const uniqueValue = Array.from(
    new Map(value.map((item) => [item.id, item])).values(),
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
        <PopoverTrigger asChild>
          <button
            id={fieldId}
            disabled={disabled}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            style={{
              borderColor: error ? "#ef4444" : "var(--color-border-light)",
              borderWidth: error ? "2px" : "1px",
              minHeight: "44px",
              borderRadius: "8px",
              backgroundColor: "white",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              width: "100%",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: "16px",
              borderStyle: "solid",
              opacity: disabled ? 0.6 : 1,
              justifyContent: "space-between",
            }}
          >
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {uniqueValue.length === 0 ? (
                <span style={{ color: "var(--color-text-placeholder)", fontSize: "14px" }}>
                  {placeholder}
                </span>
              ) : (
                uniqueValue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1 bg-white rounded-full border border-[#2463EB] px-2 py-0.5"
                  >
                    {item.initials && (
                      <div className="flex w-[18px] h-[18px] items-center justify-center rounded-full bg-[#2463EB]">
                        <span className="text-white text-[8px] font-semibold">
                          {item.initials}
                        </span>
                      </div>
                    )}
                    <span className="text-[12px]">{item.label}</span>
                    <X
                      className="w-3 h-3 text-[#2463EB] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                    />
                  </div>
                ))
              )}
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-auto p-0">
          <div
            role="listbox"
            aria-multiselectable="true"
            style={{
              maxHeight: "280px",
              overflowY: "auto",
              padding: "4px 0",
              minWidth: "200px",
            }}
          >
            {options.length === 0 ? (
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  color: "var(--color-text-muted)",
                }}
              >
                No options
              </div>
            ) : (
              options.map((option) => {
                const isSelected = uniqueValue.some((v) => v.id === option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleItem(option)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleItem(option);
                      } else if (e.key === "Escape") {
                        setOpen(false);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: isSelected
                        ? "rgba(36, 99, 235, 0.1)"
                        : "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      textAlign: "left",
                    }}
                  >
                    {isSelected ? (
                      <Check className="h-4 w-4 text-blue-600" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    <span>{option.label}</span>
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

MultiSelectField.displayName = "MultiSelectField";
