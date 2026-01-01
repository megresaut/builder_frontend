import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldShell } from "../FieldShell";

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  error?: string;
  disabled?: boolean;
  layout?: "horizontal" | "vertical";
}

/**
 * RadioGroupField - Radio group field with FieldShell wrapper
 *
 * Features:
 * - Figma-style indicators: green (#82B485) when selected, gray (#D9D9D9) when unselected
 * - Flexible layout: horizontal or vertical
 * - Consistent styling with other form fields
 * - Full accessibility: proper ARIA labels and keyboard navigation
 *
 * @param label - Field label
 * @param description - Helper text
 * @param value - Currently selected option value
 * @param onChange - Callback when selection changes
 * @param options - Array of radio options with value and label
 * @param error - Error message
 * @param disabled - Disable all options
 * @param layout - "horizontal" (default) or "vertical" layout
 */
export const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  label,
  description,
  value,
  onChange,
  options,
  error,
  disabled = false,
  layout = "horizontal",
}) => {
  const fieldId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <FieldShell
      label={label}
      description={description}
      error={error}
      disabled={disabled}
      htmlFor={fieldId}
    >
      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        style={{
          display: "flex",
          flexDirection: layout === "horizontal" ? "row" : "column",
          gap: layout === "horizontal" ? "12px" : "8px",
        }}
      >
        {options.map((option) => (
          <div
            key={option.value}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <RadioGroupItem
              value={option.value}
              id={`${fieldId}-${option.value}`}
              disabled={disabled}
              style={{
                width: "16px",
                height: "16px",
              }}
            />
            <label
              htmlFor={`${fieldId}-${option.value}`}
              style={{
                fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--color-text-primary)",
                lineHeight: 1.43,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
                userSelect: "none",
              }}
            >
              {option.label}
            </label>
          </div>
        ))}
      </RadioGroup>
    </FieldShell>
  );
};

RadioGroupField.displayName = "RadioGroupField";
