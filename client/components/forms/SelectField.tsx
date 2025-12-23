import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldShell } from "./FieldShell";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
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
 * SelectField - Select dropdown field with FieldShell wrapper
 *
 * Composed of FieldShell + Select for consistent select field styling.
 * Handles option lists for status, priority, and other enums.
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute (used in label's "for")
 * @param value - Selected value
 * @param onChange - Change handler (receives selected value string)
 * @param disabled - Disable field
 * @param placeholder - Placeholder text shown when no selection
 * @param options - Array of {value, label} options
 *
 * Example:
 * ```tsx
 * <SelectField
 *   label="Status"
 *   required
 *   value={status}
 *   onChange={setStatus}
 *   error={errors.status}
 *   placeholder="Select a status"
 *   options={[
 *     { value: "pending", label: "Pending" },
 *     { value: "completed", label: "Completed" },
 *   ]}
 * />
 * ```
 */
export const SelectField: React.FC<SelectFieldProps> = ({
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
  const [selectSide, setSelectSide] = useState<"bottom" | "top">("bottom");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

  // Check if select should flip to top based on available space
  const checkSelectPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const contentHeight = 280; // Approximate height for dropdown list

    if (spaceBelow < contentHeight + 20 && spaceAbove > contentHeight + 20) {
      setSelectSide("top");
    } else {
      setSelectSide("bottom");
    }
  }, []);

  // Monitor for size changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver(checkSelectPosition);
    const scrollHandler = () => checkSelectPosition();

    // Observe the trigger and parent containers
    if (triggerRef.current) {
      resizeObserver.observe(triggerRef.current);
      let parent = triggerRef.current.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        resizeObserver.observe(parent);
        parent = parent.parentElement;
        depth++;
      }
    }

    // Listen for scroll and resize events
    document.addEventListener("scroll", scrollHandler, true);
    window.addEventListener("resize", checkSelectPosition);

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("scroll", scrollHandler, true);
      window.removeEventListener("resize", checkSelectPosition);
    };
  }, [checkSelectPosition]);

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={error}
      disabled={disabled}
      htmlFor={fieldId}
    >
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={fieldId}
          style={{
            borderColor: error ? "#ef4444" : "var(--color-border-light)",
            borderWidth: error ? "2px" : "1px",
            width: "100%",
          }}
          className="h-11 rounded-lg"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent side="bottom" align="start" avoidCollisions={true}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
};

SelectField.displayName = "SelectField";
