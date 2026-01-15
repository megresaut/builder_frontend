import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { FieldShell } from "./FieldShell";
import { StatusIndicator } from "./StatusIndicator";

interface PrioritySelectFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  value: "normal" | "low" | "high" | "urgent";
  onChange?: (value: "normal" | "low" | "high" | "urgent") => void;
  disabled?: boolean;
}

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const PrioritySelectField: React.FC<PrioritySelectFieldProps> = ({
  label,
  required = false,
  description,
  error,
  id,
  disabled = false,
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

  const selectedOption = priorityOptions.find((opt) => opt.value === value);

  const handleOptionSelect = (optionValue: string) => {
    onChange?.(optionValue as "normal" | "low" | "high" | "urgent");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
            prev < priorityOptions.length - 1 ? prev + 1 : prev,
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
        <PopoverTrigger
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
            gap: "8px",
            padding: "8px 12px",
          }}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-2 flex-1">
            <StatusIndicator type="priority" value={value} />
            <span
              style={{
                color: value ? "var(--color-text-primary)" : "var(--color-text-placeholder)",
                fontSize: "14px",
              }}
            >
              {selectedOption?.label || "Select Priority"}
            </span>
          </div>
          <ChevronDown
            className="h-4 w-4 shrink-0 flex-none"
            style={{ color: "#303030" }}
          />
        </PopoverTrigger>

        <PopoverContent
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
            }}
          >
            {priorityOptions.map((option, index) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOptionSelect(option.value);
                    }
                  }}
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
                  {isSelected ? (
                    <Check className="h-4 w-4 text-blue-600" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <StatusIndicator type="priority" value={option.value} />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
};

PrioritySelectField.displayName = "PrioritySelectField";
